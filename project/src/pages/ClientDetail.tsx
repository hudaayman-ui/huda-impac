import React, { useState } from 'react';
import { ArrowLeft, Building2, Phone, Mail, TrendingUp, FolderOpen, CheckSquare, Activity, MessageCircle } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { useLang } from '../context/LangContext';
import { formatDate, isOverdue } from '../utils/storage';
import { PriorityBadge, ProjectStatusBadge } from '../components/Badges';
import { ClientStatus } from '../types';

interface ClientDetailProps {
  clientId: string;
  onBack: () => void;
}

const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Active', not_active: 'Not Active', pending: 'Pending', closed: 'Closed', on_hold: 'On Hold',
};
const STATUS_COLORS: Record<ClientStatus, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  not_active: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  closed: 'bg-red-500/20 text-red-400 border-red-500/30',
  on_hold: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

export default function ClientDetail({ clientId, onBack }: ClientDetailProps) {
  const { data } = useCRM();
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<'contacts' | 'deals' | 'projects' | 'tasks' | 'activity'>('contacts');

  const client = data.clients.find(c => c.id === clientId);
  if (!client) return (
    <div className="p-6 text-center crm-text-muted">
      <p>Client not found</p>
      <button onClick={onBack} className="mt-3 text-blue-400 hover:text-blue-300 text-sm">← Go back</button>
    </div>
  );

  const contacts = data.contacts.filter(c => c.clientId === clientId);
  const deals = data.deals.filter(d => d.clientId === clientId);
  const projects = data.projects.filter(p => p.clientId === clientId);
  const tasks = data.tasks.filter(t => t.linkedClientId === clientId);
  const activityFeed = [
    ...data.activityLog.filter(a =>
      a.entityId === clientId ||
      deals.some(d => d.id === a.entityId) ||
      projects.some(p => p.id === a.entityId) ||
      tasks.some(t => t.id === a.entityId)
    )
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 30);

  const tabs = [
    { key: 'contacts', label: 'Contacts', count: contacts.length },
    { key: 'deals', label: 'Deals', count: deals.length },
    { key: 'projects', label: 'Projects', count: projects.length },
    { key: 'tasks', label: 'Tasks', count: tasks.filter(t => t.status !== 'done').length },
    { key: 'activity', label: 'Activity', count: activityFeed.length },
  ] as const;

  const owner = data.team.find(m => m.id === client.salesOwner);
  const statusCls = STATUS_COLORS[client.status] || STATUS_COLORS.active;

  return (
    <div className="p-6 space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 crm-text-secondary hover:crm-text-primary text-sm transition-colors">
        <ArrowLeft size={16} />
        Back to Clients
      </button>

      {/* Client header */}
      <div className="crm-card rounded-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl crm-surface-elevated flex items-center justify-center">
              <Building2 size={28} className="crm-text-muted" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold crm-text-primary">{client.nameEn || client.nameAr}</h1>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusCls}`}>
                  {STATUS_LABELS[client.status]}
                </span>
              </div>
              {client.nameAr && client.nameEn && (
                <p className="crm-text-secondary">{client.nameAr}</p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {client.industry && (
                  <span className="px-2 py-0.5 crm-surface-elevated crm-text-secondary rounded-lg text-xs">{client.industry}</span>
                )}
                {owner && (
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs">Owner: {owner.name}</span>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Deals', value: deals.length, color: 'crm-text-primary' },
              { label: 'Active Projects', value: projects.filter(p => p.status === 'active').length, color: 'text-emerald-400' },
              { label: 'Open Tasks', value: tasks.filter(t => t.status !== 'done').length, color: 'text-blue-400' },
            ].map(stat => (
              <div key={stat.label} className="crm-surface-elevated rounded-xl px-4 py-3">
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="crm-text-muted text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Addresses */}
        {(client.addresses || []).filter(a => a).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {client.addresses.filter(a => a).map((addr, i) => (
              <span key={i} className="crm-surface-elevated crm-text-secondary text-xs px-3 py-1.5 rounded-lg">{addr}</span>
            ))}
          </div>
        )}

        {/* Brief */}
        {client.brief && (
          <div className="mt-4 p-3 crm-surface-elevated rounded-xl crm-text-secondary text-sm">{client.brief}</div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 crm-surface-elevated rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'crm-text-secondary hover:crm-text-primary'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? 'bg-blue-500' : 'crm-surface-elevated crm-text-muted'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Contacts tab */}
      {activeTab === 'contacts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.length === 0
            ? <EmptyState icon={<Phone size={32} />} message="No contacts" />
            : contacts.map(ct => (
              <div key={ct.id} className="crm-card rounded-xl p-4">
                <h4 className="crm-text-primary font-semibold">{ct.fullName}</h4>
                <p className="crm-text-secondary text-sm mb-3">{ct.jobTitle}</p>
                <div className="space-y-1.5">
                  {ct.phones.filter(p => p).map((ph, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Phone size={12} className="crm-text-muted" />
                      <a href={`tel:${ph}`} className="text-blue-400 text-sm hover:underline">{ph}</a>
                      <a href={`https://wa.me/${ph.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300">
                        <MessageCircle size={12} />
                      </a>
                    </div>
                  ))}
                  {ct.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="crm-text-muted" />
                      <a href={`mailto:${ct.email}`} className="text-blue-400 text-sm hover:underline">{ct.email}</a>
                    </div>
                  )}
                </div>
                {ct.notes && <p className="mt-2 crm-text-muted text-xs">{ct.notes}</p>}
              </div>
            ))
          }
        </div>
      )}

      {/* Deals tab */}
      {activeTab === 'deals' && (
        <div className="space-y-3">
          {deals.length === 0
            ? <EmptyState icon={<TrendingUp size={32} />} message="No deals" />
            : deals.map(deal => {
              const stage = data.settings.pipelineStages.find(s => s.id === deal.stageId);
              return (
                <div key={deal.id} className="crm-card rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: stage?.color || '#64748b' }} />
                    <div>
                      <p className="crm-text-primary font-medium">{deal.name}</p>
                      <p className="crm-text-muted text-xs">{stage?.nameEn}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="crm-text-secondary text-sm">{deal.probability}% probability</p>
                    {deal.expectedCloseDate && (
                      <p className="crm-text-muted text-xs">{formatDate(deal.expectedCloseDate, data.settings.dateFormat)}</p>
                    )}
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      {/* Projects tab */}
      {activeTab === 'projects' && (
        <div className="space-y-3">
          {projects.length === 0
            ? <EmptyState icon={<FolderOpen size={32} />} message="No projects" />
            : projects.map(p => (
              <div key={p.id} className="crm-card rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="crm-text-primary font-medium">{p.name}</p>
                  <p className="crm-text-muted text-xs">
                    {formatDate(p.startDate, data.settings.dateFormat)} → {formatDate(p.expectedEndDate, data.settings.dateFormat)}
                  </p>
                </div>
                <ProjectStatusBadge status={p.status} />
              </div>
            ))
          }
        </div>
      )}

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {tasks.length === 0
            ? <EmptyState icon={<CheckSquare size={32} />} message="No tasks" />
            : tasks.map(task => (
              <div key={task.id}
                className={`crm-card rounded-xl p-4 flex items-start gap-3 ${isOverdue(task.dueDate) && task.status !== 'done' ? 'border-red-500/30' : ''}`}>
                <div className="flex-1">
                  <p className={`font-medium text-sm ${task.status === 'done' ? 'crm-text-muted line-through' : 'crm-text-primary'}`}>
                    {task.title}
                  </p>
                  <p className="crm-text-muted text-xs mt-1">
                    {formatDate(task.dueDate, data.settings.dateFormat)}
                    {isOverdue(task.dueDate) && task.status !== 'done' && ' · ⚠ Overdue'}
                  </p>
                </div>
                <PriorityBadge priority={task.priority} />
              </div>
            ))
          }
        </div>
      )}

      {/* Activity tab */}
      {activeTab === 'activity' && (
        <div className="space-y-2">
          {activityFeed.length === 0
            ? <EmptyState icon={<Activity size={32} />} message="No activity yet" />
            : activityFeed.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 crm-card rounded-xl">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="crm-text-secondary text-sm">{log.action}</p>
                  <p className="crm-text-muted text-xs">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="col-span-full text-center py-12 crm-text-muted">
      <div className="flex justify-center mb-3 opacity-30">{icon}</div>
      <p>{message}</p>
    </div>
  );
}
