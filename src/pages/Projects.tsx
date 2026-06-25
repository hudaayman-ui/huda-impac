import React, { useState } from 'react';
import { Plus, Pencil, Trash2, FolderOpen, Users } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { useLang } from '../context/LangContext';
import { Project, ProjectStatus } from '../types';
import { formatDate } from '../utils/storage';
import { ProjectStatusBadge } from '../components/Badges';
import ConfirmDialog from '../components/ConfirmDialog';

interface ProjectsProps {
  prefillClientId?: string;
  prefillDealId?: string;
  onCreated?: () => void;
}

type FormState = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

const emptyForm = (prefillClientId?: string, prefillDealId?: string): FormState => ({
  name: '',
  clientId: prefillClientId || '',
  status: 'active',
  startDate: new Date().toISOString().split('T')[0],
  expectedEndDate: '',
  assignedTeam: [],
  description: '',
  linkedDealId: prefillDealId,
});

export default function Projects({ prefillClientId, prefillDealId, onCreated }: ProjectsProps) {
  const { data, addProject, updateProject, deleteProject, addToast } = useCRM();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [showForm, setShowForm] = useState(!!prefillClientId);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(prefillClientId, prefillDealId));
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [upsellProjectId, setUpsellProjectId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const filtered = data.projects.filter(p => {
    const q = search.toLowerCase();
    const client = data.clients.find(c => c.id === p.clientId);
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (client?.nameEn || client?.nameAr || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setForm(emptyForm());
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (p: Project) => {
    setForm({
      name: p.name,
      clientId: p.clientId,
      status: p.status,
      startDate: p.startDate,
      expectedEndDate: p.expectedEndDate,
      assignedTeam: [...p.assignedTeam],
      description: p.description,
      linkedDealId: p.linkedDealId,
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editId) {
      const prev = data.projects.find(p => p.id === editId);
      updateProject(editId, form);
      if (prev?.status !== 'completed' && form.status === 'completed') {
        setUpsellProjectId(editId);
      }
      addToast('Project updated ✓');
    } else {
      addProject(form);
      addToast('Project created ✓');
      onCreated?.();
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteProject(deleteId);
    addToast('Project deleted');
    setDeleteId(null);
  };

  const toggleMember = (id: string) => {
    setForm(f => ({
      ...f,
      assignedTeam: f.assignedTeam.includes(id)
        ? f.assignedTeam.filter(m => m !== id)
        : [...f.assignedTeam, id],
    }));
  };

  const isBehind = (p: Project) => p.status === 'active' && p.expectedEndDate && p.expectedEndDate < today;

  const statusBorderColor: Record<ProjectStatus, string> = {
    active:    'border-emerald-500/30',
    onhold:    'border-yellow-500/30',
    completed: 'border-blue-500/30',
    cancelled: 'border-red-500/30',
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold crm-text-primary">Projects</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Add Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="crm-input rounded-xl px-4 py-2.5 text-sm flex-1 min-w-[200px]"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as ProjectStatus | '')}
          className="crm-input rounded-xl px-3 py-2.5 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="onhold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="crm-text-muted text-sm">{filtered.length} projects</span>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(project => {
          const client = data.clients.find(c => c.id === project.clientId);
          const openTaskCount = data.tasks.filter(t => t.linkedProjectId === project.id && t.status !== 'done').length;
          const teamMembers = project.assignedTeam
            .map(id => data.team.find(m => m.id === id))
            .filter(Boolean);
          const behind = isBehind(project);

          return (
            <div
              key={project.id}
              className={`crm-card rounded-2xl p-5 hover:crm-border-hover transition-all border ${behind ? 'border-orange-500/40' : statusBorderColor[project.status]}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="crm-text-primary font-semibold text-sm">{project.name}</h3>
                    {behind && <span className="text-orange-400 text-xs font-medium">⚠ Behind</span>}
                  </div>
                  {client && (
                    <p className="text-blue-400 text-xs">{client.nameEn || client.nameAr}</p>
                  )}
                </div>
                <ProjectStatusBadge status={project.status} />
              </div>

              {project.description && (
                <p className="crm-text-muted text-xs mb-3 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center gap-2 text-xs crm-text-muted mb-3">
                <span>{formatDate(project.startDate, data.settings.dateFormat) || '—'}</span>
                <span>→</span>
                <span className={behind ? 'text-orange-400' : ''}>
                  {formatDate(project.expectedEndDate, data.settings.dateFormat) || '—'}
                </span>
              </div>

              {teamMembers.length > 0 && (
                <div className="flex items-center gap-1 mb-3">
                  <Users size={12} className="crm-text-muted" />
                  <div className="flex gap-1">
                    {teamMembers.slice(0, 4).map(m => (
                      <div
                        key={m!.id}
                        title={m!.name}
                        className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-medium"
                      >
                        {m!.name[0]}
                      </div>
                    ))}
                    {teamMembers.length > 4 && (
                      <span className="crm-text-muted text-xs self-center">+{teamMembers.length - 4}</span>
                    )}
                  </div>
                </div>
              )}

              {openTaskCount > 0 && (
                <p className="crm-text-muted text-xs mb-3">{openTaskCount} open task{openTaskCount !== 1 ? 's' : ''}</p>
              )}

              <div className="flex items-center justify-end gap-1 pt-3 border-t crm-border">
                <button
                  onClick={() => openEdit(project)}
                  className="p-1.5 rounded-lg crm-text-muted hover:crm-text-primary hover:crm-surface-elevated transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setDeleteId(project.id)}
                  className="p-1.5 rounded-lg crm-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 crm-text-muted">
            <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p>No projects found</p>
            <button onClick={openAdd} className="mt-3 text-blue-400 hover:text-blue-300 text-sm">
              + Add your first project
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="crm-modal w-full max-w-lg mx-4 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="crm-text-primary font-bold text-lg mb-5">
              {editId ? 'Edit Project' : 'Add Project'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block crm-text-secondary text-xs mb-1">Project Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Enter project name..."
                  className="w-full crm-input rounded-xl px-3 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Client *</label>
                  <select
                    required
                    value={form.clientId}
                    onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm"
                  >
                    <option value="">— Select Client —</option>
                    {data.clients.map(c => (
                      <option key={c.id} value={c.id}>{c.nameEn || c.nameAr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="onhold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Expected End Date</label>
                  <input
                    type="date"
                    value={form.expectedEndDate}
                    onChange={e => setForm(f => ({ ...f, expectedEndDate: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block crm-text-secondary text-xs mb-2">Assigned Team</label>
                <div className="flex flex-wrap gap-2">
                  {data.team.filter(m => m.active).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        form.assignedTeam.includes(m.id)
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'crm-surface border-gray-600 crm-text-secondary hover:crm-border-hover'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                  {data.team.filter(m => m.active).length === 0 && (
                    <p className="crm-text-muted text-xs">No team members — add them in Settings → Team</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block crm-text-secondary text-xs mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full crm-input rounded-xl px-3 py-2.5 text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); onCreated?.(); }}
                  className="flex-1 py-2.5 crm-btn-secondary rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete Project"
          message="Are you sure you want to delete this project?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {/* Upsell dialog on project completion */}
      {upsellProjectId && (() => {
        const p = data.projects.find(pr => pr.id === upsellProjectId);
        const client = data.clients.find(c => c.id === p?.clientId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="crm-modal w-full max-w-sm mx-4 rounded-2xl p-6 text-center shadow-2xl">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="crm-text-primary font-bold text-lg mb-2">Project Completed!</h3>
              <p className="crm-text-secondary text-sm mb-6">
                Would you like to open a new opportunity for{' '}
                <span className="crm-text-primary font-medium">{client?.nameEn || client?.nameAr}</span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setUpsellProjectId(null)}
                  className="flex-1 py-2.5 crm-btn-secondary rounded-xl text-sm"
                >
                  No thanks
                </button>
                <button
                  onClick={() => setUpsellProjectId(null)}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium"
                >
                  Open Deal
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
