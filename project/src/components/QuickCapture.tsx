import React, { useState, useRef } from 'react';
import { Plus, X, Calendar, User, Briefcase } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { todayStr } from '../utils/storage';

export default function QuickCapture() {
  const { data, addTask, addToast } = useCRM();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState(todayStr());
  const [assignedTo, setAssignedTo] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  const filteredProjects = data.projects.filter(p =>
    !clientId || p.clientId === clientId
  );

  const handleOpen = () => {
    setOpen(true);
    setTitle('');
    setClientId('');
    setProjectId('');
    setDueDate(todayStr());
    setAssignedTo(data.team.find(m => m.active)?.id || '');
    setTimeout(() => titleRef.current?.focus(), 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      description: '',
      priority: data.settings.taskSettings.defaultPriority,
      status: 'todo',
      dueDate,
      assignedTo,
      linkedClientId: clientId || undefined,
      linkedProjectId: projectId || undefined,
    });
    addToast('Task added ✓');
    setOpen(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-2xl shadow-blue-900/40 transition-all duration-200 hover:scale-105 active:scale-95 font-medium text-sm"
      >
        <Plus size={18} />
        <span>Quick Task</span>
      </button>

      {/* Popup */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full sm:max-w-md crm-modal rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl mx-0 sm:mx-4 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Plus size={14} className="text-white" />
                </div>
                <h3 className="crm-text-primary font-semibold">Quick Task</h3>
              </div>
              <button onClick={() => setOpen(false)} className="crm-text-muted hover:crm-text-primary">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Task title..."
                className="w-full crm-input rounded-xl px-4 py-3 text-sm"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 crm-text-muted pointer-events-none" />
                  <select
                    value={clientId}
                    onChange={e => { setClientId(e.target.value); setProjectId(''); }}
                    className="w-full crm-input rounded-xl pl-8 pr-3 py-2.5 text-sm appearance-none"
                  >
                    <option value="">Client (optional)</option>
                    {data.clients.map(c => (
                      <option key={c.id} value={c.id}>{c.nameEn || c.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 crm-text-muted pointer-events-none" />
                  <select
                    value={projectId}
                    onChange={e => setProjectId(e.target.value)}
                    className="w-full crm-input rounded-xl pl-8 pr-3 py-2.5 text-sm appearance-none"
                  >
                    <option value="">Project (optional)</option>
                    {filteredProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 crm-text-muted pointer-events-none" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full crm-input rounded-xl pl-8 pr-3 py-2.5 text-sm"
                  />
                </div>

                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 crm-text-muted pointer-events-none" />
                  <select
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    className="w-full crm-input rounded-xl pl-8 pr-3 py-2.5 text-sm appearance-none"
                  >
                    <option value="">Assign to...</option>
                    {data.team.filter(m => m.active).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!title.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition-colors"
              >
                Add Task
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
