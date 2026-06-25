import { CheckSquare, TrendingUp, FolderOpen, Users, Activity, AlertCircle, Clock } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { useLang } from '../context/LangContext';
import { isOverdue, isToday, formatDate, daysBetween, todayStr } from '../utils/storage';
import { PriorityBadge } from '../components/Badges';
import type { ActiveView } from '../components/Sidebar';

interface DashboardProps {
  onNavigate: (view: ActiveView, extra?: unknown) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { data, updateTask, addToast } = useCRM();
  const { t, lang } = useLang();

  const today = todayStr();
  const settings = data.settings;

  const todayTasks = data.tasks.filter(t => t.status !== 'done' && isToday(t.dueDate));
  const overdueTasks = data.tasks.filter(t => t.status !== 'done' && isOverdue(t.dueDate));

  const inactiveDeals = data.deals.filter(d => {
    const stage = settings.pipelineStages.find(s => s.id === d.stageId);
    if (stage?.type === 'lost') return false;
    return daysBetween(d.updatedAt, today) >= settings.notifications.noActivityDealThreshold;
  });

  const behindProjects = data.projects.filter(p =>
    p.status === 'active' && p.expectedEndDate < today
  );

  const inactiveClients = data.clients.filter(c => {
    const lastContact = c.lastContactedAt;
    if (!lastContact) return true;
    return daysBetween(lastContact, today) >= settings.notifications.clientNotContactedThreshold;
  });

  const pipelineSummary = settings.pipelineStages.map(stage => {
    const deals = data.deals.filter(d => d.stageId === stage.id);
    const total = deals.reduce((sum, d) => sum + (d.probability || 0), 0);
    return { stage, count: deals.length, total };
  }).filter(s => s.count > 0);

  const totalPipeline = data.deals
    .filter(d => {
      const stage = settings.pipelineStages.find(s => s.id === d.stageId);
      return stage?.type !== 'lost';
    })
    .reduce((sum, d) => sum + (d.probability || 0), 0);

  const recentActivity = data.activityLog.slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t('nav.dashboard')}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {lang === 'ar'
            ? `مرحباً، ${settings.profile.name} — ${new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
            : `Welcome, ${settings.profile.name} — ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
          }
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<CheckSquare size={20} />}
          label={lang === 'ar' ? 'مهام اليوم' : "Today's Tasks"}
          value={todayTasks.length}
          subValue={overdueTasks.length > 0 ? `${overdueTasks.length} ${lang === 'ar' ? 'متأخر' : 'overdue'}` : undefined}
          subColor="text-red-400"
          color="blue"
          onClick={() => onNavigate('tasks')}
        />
        <SummaryCard
          icon={<TrendingUp size={20} />}
          label={lang === 'ar' ? 'إجمالي الاحتمالات' : 'Pipeline Probability'}
          value={`${totalPipeline}%`}
          subValue={`${data.deals.filter(d => settings.pipelineStages.find(s=>s.id===d.stageId)?.type!=='lost').length} ${lang === 'ar' ? 'صفقات' : 'deals'}`}
          color="emerald"
          onClick={() => onNavigate('pipeline')}
        />
        <SummaryCard
          icon={<FolderOpen size={20} />}
          label={lang === 'ar' ? 'مشاريع نشطة' : 'Active Projects'}
          value={data.projects.filter(p => p.status === 'active').length}
          subValue={behindProjects.length > 0 ? `${behindProjects.length} ${lang === 'ar' ? 'متأخر' : 'behind'}` : undefined}
          subColor="text-red-400"
          color="amber"
          onClick={() => onNavigate('projects')}
        />
        <SummaryCard
          icon={<Users size={20} />}
          label={lang === 'ar' ? 'العملاء' : 'Clients'}
          value={data.clients.length}
          subValue={inactiveClients.length > 0 ? `${inactiveClients.length} ${lang === 'ar' ? 'بحاجة تواصل' : 'need follow-up'}` : undefined}
          subColor="text-yellow-400"
          color="rose"
          onClick={() => onNavigate('clients')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's tasks */}
        <div className="lg:col-span-2 space-y-4">
          {/* Today tasks */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <CheckSquare size={18} className="text-blue-400" />
                {lang === 'ar' ? 'مهام اليوم' : "Today's Tasks"}
                {todayTasks.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">{todayTasks.length}</span>
                )}
              </h2>
              <button onClick={() => onNavigate('tasks')} className="text-blue-400 hover:text-blue-300 text-xs">
                {lang === 'ar' ? 'عرض الكل' : 'View all'}
              </button>
            </div>
            {todayTasks.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                {lang === 'ar' ? 'لا توجد مهام اليوم 🎉' : 'No tasks today 🎉'}
              </p>
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map(task => {
                  const client = data.clients.find(c => c.id === task.linkedClientId);
                  return (
                    <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-800 rounded-xl hover:bg-gray-750 transition-colors group">
                      <button
                        onClick={() => { updateTask(task.id, { status: 'done' }); addToast(lang === 'ar' ? 'تم إنهاء المهمة ✓' : 'Task done ✓'); }}
                        className="mt-0.5 w-4 h-4 rounded border-2 border-gray-600 hover:border-emerald-500 flex-shrink-0 transition-colors"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{task.title}</p>
                        {client && <p className="text-gray-500 text-xs">{client.nameAr}</p>}
                        {task.rolloverHistory.length > 0 && (
                          <p className="text-orange-400 text-xs">🔄 {lang === 'ar' ? 'انتقلت' : 'rolled over'} ×{task.rolloverHistory.length}</p>
                        )}
                      </div>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Overdue tasks */}
          {overdueTasks.length > 0 && (
            <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-5">
              <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
                <AlertCircle size={18} className="text-red-400" />
                {t('dashboard.overdueTasks')}
                <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs animate-pulse">{overdueTasks.length}</span>
              </h2>
              <div className="space-y-2">
                {overdueTasks.map(task => {
                  const client = data.clients.find(c => c.id === task.linkedClientId);
                  return (
                    <div key={task.id} className="flex items-start gap-3 p-3 bg-red-900/20 rounded-xl">
                      <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{task.title}</p>
                        <p className="text-red-400 text-xs">{formatDate(task.dueDate, data.settings.dateFormat)}{client ? ` • ${client.nameAr}` : ''}</p>
                      </div>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pipeline summary */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
            <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-emerald-400" />
              {t('dashboard.pipelineSummary')}
            </h2>
            <div className="space-y-2">
              {pipelineSummary.map(({ stage, count, total }) => (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stage.color }} />
                  <span className="text-gray-300 text-sm flex-1">{stage.nameEn}</span>
                  <span className="text-gray-500 text-xs">{count}</span>
                  <span className="text-white text-sm font-medium">{total}%</span>
                </div>
              ))}
              {pipelineSummary.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-2">
                  {lang === 'ar' ? 'لا توجد صفقات نشطة' : 'No active deals'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Inactive deals */}
          {inactiveDeals.length > 0 && (
            <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-2xl p-4">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
                <Clock size={16} className="text-yellow-400" />
                {t('dashboard.inactiveDeals')}
                <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">{inactiveDeals.length}</span>
              </h3>
              {inactiveDeals.slice(0, 3).map(deal => {
                const days = daysBetween(deal.updatedAt, today);
                return (
                  <div key={deal.id} className="py-2 border-b border-yellow-500/10 last:border-0">
                    <p className="text-white text-xs font-medium truncate">{deal.name}</p>
                    <p className="text-yellow-400 text-xs">{days} {lang === 'ar' ? 'يوم بدون نشاط' : 'days inactive'}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Behind projects */}
          {behindProjects.length > 0 && (
            <div className="bg-orange-950/20 border border-orange-500/20 rounded-2xl p-4">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
                <FolderOpen size={16} className="text-orange-400" />
                {t('dashboard.behindProjects')}
                <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-xs">{behindProjects.length}</span>
              </h3>
              {behindProjects.map(p => {
                const days = daysBetween(p.expectedEndDate, today);
                return (
                  <div key={p.id} className="py-2 border-b border-orange-500/10 last:border-0">
                    <p className="text-white text-xs font-medium truncate">{p.name}</p>
                    <p className="text-orange-400 text-xs">{lang === 'ar' ? `متأخر ${days} يوم` : `${days} days late`}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Inactive clients */}
          {inactiveClients.length > 0 && (
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
                <Users size={16} className="text-gray-400" />
                {t('dashboard.inactiveClients')}
                <span className="px-1.5 py-0.5 bg-gray-600 text-gray-300 rounded-full text-xs">{inactiveClients.length}</span>
              </h3>
              {inactiveClients.slice(0, 4).map(c => (
                <div key={c.id} className="py-2 border-b border-gray-700/30 last:border-0">
                  <p className="text-white text-xs font-medium">{c.nameAr}</p>
                  <p className="text-gray-500 text-xs">
                    {c.lastContactedAt
                      ? `${lang === 'ar' ? 'آخر تواصل' : 'Last contact'}: ${formatDate(c.lastContactedAt, data.settings.dateFormat)}`
                      : (lang === 'ar' ? 'لم يتم التواصل بعد' : 'Never contacted')
                    }
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Recent activity */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
              <Activity size={16} className="text-blue-400" />
              {t('dashboard.recentActivity')}
            </h3>
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-2">
                {lang === 'ar' ? 'لا توجد أنشطة بعد' : 'No activity yet'}
              </p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map(log => (
                  <div key={log.id} className="py-1.5 border-b border-gray-700/30 last:border-0">
                    <p className="text-gray-300 text-xs">{log.action}</p>
                    <p className="text-gray-600 text-xs">{new Date(log.timestamp).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  subColor?: string;
  color: 'blue' | 'emerald' | 'amber' | 'rose';
  onClick?: () => void;
}

function SummaryCard({ icon, label, value, subValue, subColor = 'text-gray-400', color, onClick }: SummaryCardProps) {
  const colorMap = {
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', border: 'border-blue-500/20' },
    emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
    amber: { bg: 'bg-amber-500/10', icon: 'text-amber-400', border: 'border-amber-500/20' },
    rose: { bg: 'bg-rose-500/10', icon: 'text-rose-400', border: 'border-rose-500/20' },
  };
  const c = colorMap[color];
  return (
    <button
      onClick={onClick}
      className={`bg-gray-800/50 border ${c.border} rounded-2xl p-4 text-left hover:bg-gray-800 transition-colors w-full group`}
    >
      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3 ${c.icon}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-gray-400 text-sm mt-1">{label}</p>
      {subValue && <p className={`text-xs mt-1 ${subColor}`}>{subValue}</p>}
    </button>
  );
}
