import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, LayoutGrid, List, AlertTriangle, Search, RefreshCw } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { useLang } from '../context/LangContext';
import { Task, TaskPriority, TaskStatus } from '../types';
import { formatDate, isOverdue, isToday, todayStr } from '../utils/storage';
import { PriorityBadge, TaskStatusBadge, OverdueBadge } from '../components/Badges';
import ConfirmDialog from '../components/ConfirmDialog';

type FilterMode = 'all' | 'today' | 'overdue';

const EMPTY: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'rolloverHistory'> = {
  title: '', description: '', priority: 'medium', status: 'todo',
  dueDate: todayStr(), assignedTo: '', linkedProjectId: undefined, linkedClientId: undefined,
};

export default function Tasks() {
  const { data, addTask, updateTask, deleteTask, rolloverOverdueTasks, addToast } = useCRM();
  const { lang, t } = useLang();

  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [clientFilter, setClientFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'rolloverHistory'>>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { rolloverOverdueTasks(); }, []);

  const overdueCount = data.tasks.filter(t => t.status !== 'done' && isOverdue(t.dueDate)).length;
  const todayCount = data.tasks.filter(t => t.status !== 'done' && isToday(t.dueDate)).length;

  const filtered = data.tasks.filter(task => {
    const q = search.toLowerCase();
    const client = data.clients.find(c => c.id === task.linkedClientId);
    const matchSearch = !q || task.title.toLowerCase().includes(q) || (client?.nameEn || client?.nameAr || '').toLowerCase().includes(q);
    const matchPriority = !priorityFilter || task.priority === priorityFilter;
    const matchClient = !clientFilter || task.linkedClientId === clientFilter;
    let matchMode = true;
    if (filterMode === 'today') matchMode = isToday(task.dueDate) && task.status !== 'done';
    if (filterMode === 'overdue') matchMode = isOverdue(task.dueDate) && task.status !== 'done';
    return matchSearch && matchPriority && matchClient && matchMode;
  });

  const byStatus = (status: TaskStatus) => filtered.filter(t => t.status === status);

  const openAdd = () => {
    setForm({ ...EMPTY, assignedTo: data.team[0]?.id || '', dueDate: todayStr() });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (task: Task) => {
    setForm({
      title: task.title, description: task.description, priority: task.priority,
      status: task.status, dueDate: task.dueDate, assignedTo: task.assignedTo,
      linkedProjectId: task.linkedProjectId, linkedClientId: task.linkedClientId,
    });
    setEditId(task.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editId) {
      updateTask(editId, form);
      addToast('Task updated ✓');
    } else {
      addTask(form);
      addToast('Task added ✓');
    }
    setShowForm(false);
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTask(taskId, { status });
    if (status === 'done') addToast('Task completed ✓');
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteTask(deleteId);
    addToast('Task deleted');
    setDeleteId(null);
  };

  const filteredProjects = data.projects.filter(p =>
    !form.linkedClientId || p.clientId === form.linkedClientId
  );

  const statusConfig = {
    todo:       { label: 'To Do',       color: '#64748b' },
    inprogress: { label: 'In Progress', color: '#3b82f6' },
    done:       { label: 'Done',        color: '#22c55e' },
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold crm-text-primary">Tasks</h1>
          <div className="flex items-center gap-3 mt-1">
            {todayCount > 0 && <span className="text-blue-400 text-sm">{todayCount} due today</span>}
            {overdueCount > 0 && <span className="text-red-400 text-sm flex items-center gap-1"><AlertTriangle size={12} /> {overdueCount} overdue</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { rolloverOverdueTasks(); addToast('Overdue tasks rolled over'); }}
            className="flex items-center gap-2 px-3 py-2 crm-btn-secondary rounded-xl text-sm transition-colors"
            title="Rollover overdue tasks to today"
          >
            <RefreshCw size={14} />
          </button>
          <div className="flex items-center crm-surface border crm-border rounded-xl p-1">
            <button onClick={() => setView('kanban')} className={`p-1.5 rounded-lg transition-colors ${view === 'kanban' ? 'bg-blue-600 text-white' : 'crm-text-secondary hover:crm-text-primary'}`}><LayoutGrid size={16} /></button>
            <button onClick={() => setView('table')} className={`p-1.5 rounded-lg transition-colors ${view === 'table' ? 'bg-blue-600 text-white' : 'crm-text-secondary hover:crm-text-primary'}`}><List size={16} /></button>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus size={15} />
            Add Task
          </button>
        </div>
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { key: 'all',     label: 'All',        count: data.tasks.filter(t => t.status !== 'done').length },
          { key: 'today',   label: "Today's",    count: todayCount },
          { key: 'overdue', label: 'Overdue',    count: overdueCount },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterMode(tab.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-colors ${
              filterMode === tab.key
                ? 'bg-blue-600 text-white'
                : 'crm-surface crm-text-secondary border crm-border hover:crm-text-primary'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 rounded-full text-xs font-medium ${
                filterMode === tab.key ? 'bg-blue-500 text-white'
                : tab.key === 'overdue' ? 'bg-red-500/20 text-red-400'
                : 'crm-surface-elevated crm-text-secondary'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}

        <div className="flex-1" />

        <div className="relative min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 crm-text-muted" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full crm-input rounded-xl pl-9 pr-4 py-2 text-sm"
          />
        </div>

        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as TaskPriority | '')}
          className="crm-input rounded-xl px-3 py-2 text-sm">
          <option value="">All Priorities</option>
          {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>

        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
          className="crm-input rounded-xl px-3 py-2 text-sm">
          <option value="">All Clients</option>
          {data.clients.map(c => <option key={c.id} value={c.id}>{c.nameEn || c.nameAr}</option>)}
        </select>
      </div>

      {/* Kanban view */}
      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(['todo', 'inprogress', 'done'] as TaskStatus[]).map(status => {
            const statusTasks = byStatus(status);
            const cfg = statusConfig[status];
            return (
              <div
                key={status}
                className="crm-card rounded-2xl overflow-hidden"
                style={{ borderTop: `3px solid ${cfg.color}` }}
              >
                <div className="p-4 border-b crm-border flex items-center gap-2">
                  <span className="crm-text-primary font-semibold text-sm">{cfg.label}</span>
                  <span className="px-1.5 py-0.5 crm-surface-elevated crm-text-secondary rounded-full text-xs">{statusTasks.length}</span>
                </div>
                <div className="p-3 space-y-3 min-h-[200px]">
                  {statusTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={openEdit}
                      onDelete={setDeleteId}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                  {statusTasks.length === 0 && (
                    <p className="text-center py-8 crm-text-muted text-sm">No tasks</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table view */
        <div className="crm-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b crm-border">
                {['Task', 'Client', 'Priority', 'Status', 'Due Date', 'Assigned To', ''].map((h, i) => (
                  <th key={i} className="text-left crm-text-secondary text-xs font-medium py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => {
                const client = data.clients.find(c => c.id === task.linkedClientId);
                const member = data.team.find(m => m.id === task.assignedTo);
                const overdue = isOverdue(task.dueDate) && task.status !== 'done';
                return (
                  <tr key={task.id} className={`border-b crm-border hover:crm-surface-elevated transition-colors ${overdue ? 'bg-red-500/5' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {overdue && <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />}
                        <span className={`text-sm ${task.status === 'done' ? 'crm-text-muted line-through' : 'crm-text-primary'}`}>{task.title}</span>
                        {task.rolloverHistory.length > 0 && (
                          <span className="text-xs text-orange-400">🔄×{task.rolloverHistory.length}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 crm-text-secondary text-sm">{client ? (client.nameEn || client.nameAr) : '-'}</td>
                    <td className="py-3 px-4"><PriorityBadge priority={task.priority} /></td>
                    <td className="py-3 px-4">
                      <select
                        value={task.status}
                        onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className="crm-input rounded-lg px-2 py-1 text-xs"
                      >
                        <option value="todo">To Do</option>
                        <option value="inprogress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm ${overdue ? 'text-red-400' : 'crm-text-secondary'}`}>
                        {formatDate(task.dueDate, data.settings.dateFormat)}
                      </span>
                    </td>
                    <td className="py-3 px-4 crm-text-secondary text-sm">{member?.name || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg crm-text-muted hover:crm-text-primary hover:crm-surface-elevated transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => setDeleteId(task.id)} className="p-1.5 rounded-lg crm-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-12 crm-text-muted">No tasks found</p>
          )}
        </div>
      )}

      {/* Task Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="crm-modal w-full max-w-lg mx-4 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="crm-text-primary font-bold text-lg mb-5">
              {editId ? 'Edit Task' : 'Add Task'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block crm-text-secondary text-xs mb-1">Task Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full crm-input rounded-xl px-3 py-2.5 text-sm"
                  placeholder="Enter task title..."
                />
              </div>
              <div>
                <label className="block crm-text-secondary text-xs mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full crm-input rounded-xl px-3 py-2.5 text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm"
                  >
                    {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map(p => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm"
                  >
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Assigned To</label>
                  <select
                    value={form.assignedTo}
                    onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm"
                  >
                    <option value="">— None —</option>
                    {data.team.filter(m => m.active).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Client</label>
                  <select
                    value={form.linkedClientId || ''}
                    onChange={e => setForm(f => ({ ...f, linkedClientId: e.target.value || undefined, linkedProjectId: undefined }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm"
                  >
                    <option value="">— None —</option>
                    {data.clients.map(c => (
                      <option key={c.id} value={c.id}>{c.nameEn || c.nameAr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Project</label>
                  <select
                    value={form.linkedProjectId || ''}
                    onChange={e => setForm(f => ({ ...f, linkedProjectId: e.target.value || undefined }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm"
                  >
                    <option value="">— None —</option>
                    {filteredProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editId && (() => {
                const task = data.tasks.find(t => t.id === editId);
                if (!task?.rolloverHistory.length) return null;
                return (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                    <p className="text-orange-400 text-xs font-medium mb-2">🔄 Rollover History</p>
                    {task.rolloverHistory.map((r, i) => (
                      <p key={i} className="crm-text-muted text-xs">{r.note}</p>
                    ))}
                  </div>
                );
              })()}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 crm-btn-secondary rounded-xl text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete Task"
          message="Are you sure you want to delete this task?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, s: TaskStatus) => void;
}

function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const { data } = useCRM();
  const client = data.clients.find(c => c.id === task.linkedClientId);
  const overdue = isOverdue(task.dueDate) && task.status !== 'done';
  const member = data.team.find(m => m.id === task.assignedTo);

  const nextStatus: Record<TaskStatus, TaskStatus> = { todo: 'inprogress', inprogress: 'done', done: 'todo' };
  const nextLabel: Record<TaskStatus, string> = { todo: '→ In Progress', inprogress: '→ Done', done: '→ To Do' };

  return (
    <div className={`crm-card-inner rounded-xl p-3 transition-all hover:crm-border-hover ${overdue ? 'border border-red-500/30' : ''}`}>
      {overdue && <OverdueBadge />}
      {task.rolloverHistory.length > 0 && (
        <div className="flex items-center gap-1 mb-1.5">
          <RefreshCw size={10} className="text-orange-400" />
          <span className="text-orange-400 text-xs">×{task.rolloverHistory.length} rollover</span>
        </div>
      )}
      <p className={`text-sm font-medium mb-1 leading-tight ${task.status === 'done' ? 'crm-text-muted line-through' : 'crm-text-primary'}`}>
        {task.title}
      </p>
      {client && <p className="crm-text-muted text-xs mb-2">{client.nameEn || client.nameAr}</p>}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <PriorityBadge priority={task.priority} />
        <span className={`text-xs ${overdue ? 'text-red-400' : 'crm-text-muted'}`}>
          {formatDate(task.dueDate, data.settings.dateFormat)}
        </span>
      </div>
      {member && <p className="crm-text-muted text-xs mb-2">{member.name}</p>}
      <div className="flex items-center justify-between pt-2 border-t crm-border">
        <button
          onClick={() => onStatusChange(task.id, nextStatus[task.status])}
          className="text-xs crm-text-muted hover:text-blue-400 transition-colors"
        >
          {nextLabel[task.status]}
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(task)} className="p-1 crm-text-muted hover:crm-text-primary"><Pencil size={12} /></button>
          <button onClick={() => onDelete(task.id)} className="p-1 crm-text-muted hover:text-red-400"><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  );
}
