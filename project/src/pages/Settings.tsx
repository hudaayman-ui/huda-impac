import React, { useState, useRef } from 'react';
import { Settings as SettingsIcon, User, Bell, TrendingUp, SquareCheck as CheckSquare, Tag, Users, Upload, Download, Trash2, Palette, RotateCcw, Plus, X, GripVertical, Camera } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { useLang } from '../context/LangContext';
import { AppSettings, PipelineStageConfig, TaskPriority, TeamMember } from '../types';
import { generateId } from '../utils/storage';
import ConfirmDialog from '../components/ConfirmDialog';

type Section = 'general' | 'profile' | 'notifications' | 'pipeline' | 'tasks' | 'dropdowns' | 'team' | 'importexport' | 'data' | 'appearance';

const ACCENT_COLORS = [
  { id: 'blue',    label: 'Blue',    cls: 'bg-blue-600' },
  { id: 'emerald', label: 'Green',   cls: 'bg-emerald-600' },
  { id: 'rose',    label: 'Rose',    cls: 'bg-rose-600' },
  { id: 'amber',   label: 'Amber',   cls: 'bg-amber-600' },
  { id: 'cyan',    label: 'Cyan',    cls: 'bg-cyan-600' },
  { id: 'slate',   label: 'Slate',   cls: 'bg-slate-600' },
];

const STAGE_COLORS = ['#64748b','#3b82f6','#8b5cf6','#f59e0b','#f97316','#22c55e','#ef4444','#ec4899','#06b6d4','#a78bfa','#34d399'];

export default function Settings() {
  const { data, updateSettings, addToast, addTeamMember, updateTeamMember, deleteTeamMember,
    clearAllTasks, clearAllDeals, clearAllClients, resetToDefaults, exportData, importBackup } = useCRM();
  const { lang } = useLang();

  const [section, setSection] = useState<Section>('general');
  const [confirmAction, setConfirmAction] = useState<null | { title: string; message: string; action: () => void; doubleConfirm?: boolean }>(null);

  const s = data.settings;

  const save = (updates: Partial<AppSettings>) => {
    updateSettings(updates);
    addToast('Saved ✓');
  };

  const sections: { key: Section; label: string; icon: React.ElementType }[] = [
    { key: 'general',      label: 'General',          icon: SettingsIcon },
    { key: 'profile',      label: 'My Profile',       icon: User },
    { key: 'notifications',label: 'Notifications',    icon: Bell },
    { key: 'pipeline',     label: 'Pipeline Stages',  icon: TrendingUp },
    { key: 'tasks',        label: 'Task Settings',    icon: CheckSquare },
    { key: 'dropdowns',    label: 'Dropdown Lists',   icon: Tag },
    { key: 'team',         label: 'Team Management',  icon: Users },
    { key: 'importexport', label: 'Import / Export',  icon: Download },
    { key: 'data',         label: 'Data Management',  icon: Trash2 },
    { key: 'appearance',   label: 'Appearance',       icon: Palette },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Settings sidebar — always dark */}
      <div className="w-56 flex-shrink-0 border-r sidebar-dark p-4 space-y-1 min-h-screen">
        <h2 className="text-gray-400 text-xs font-medium uppercase tracking-wider px-3 mb-3">Settings</h2>
        {sections.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setSection(key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
              section === key
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/60'
            }`}>
            <Icon size={15} />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {section === 'general'       && <GeneralSection       s={s} save={save} />}
        {section === 'profile'       && <ProfileSection       s={s} save={save} addToast={addToast} />}
        {section === 'notifications' && <NotificationsSection s={s} save={save} />}
        {section === 'pipeline'      && <PipelineSection      s={s} save={save} addToast={addToast} />}
        {section === 'tasks'         && <TasksSection         s={s} save={save} />}
        {section === 'dropdowns'     && <DropdownsSection     s={s} save={save} />}
        {section === 'team'          && <TeamSection          data={data} addTeamMember={addTeamMember} updateTeamMember={updateTeamMember} deleteTeamMember={deleteTeamMember} addToast={addToast} />}
        {section === 'importexport'  && <ImportExportSection  data={data} exportData={exportData} importBackup={importBackup} addToast={addToast} />}
        {section === 'data'          && (
          <DataSection
            data={data}
            onClearTasks={() => setConfirmAction({ title: 'Clear All Tasks', message: 'All tasks will be permanently deleted.', action: clearAllTasks })}
            onClearDeals={() => setConfirmAction({ title: 'Clear All Deals', message: 'All deals will be permanently deleted.', action: clearAllDeals })}
            onClearClients={() => setConfirmAction({ title: 'Clear All Data', message: 'All clients and all linked data will be deleted.', action: clearAllClients })}
            onReset={() => setConfirmAction({ title: 'Reset App', message: 'This will wipe all data and restore defaults. Are you sure?', action: resetToDefaults, doubleConfirm: true })}
          />
        )}
        {section === 'appearance' && <AppearanceSection s={s} save={save} />}
      </div>

      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.title}
          message={confirmAction.message}
          onConfirm={() => { confirmAction.action(); setConfirmAction(null); }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

/* ─── Shared primitives ─────────────────────────────────────── */

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold crm-text-primary">{title}</h2>
      {description && <p className="crm-text-secondary text-sm mt-1">{description}</p>}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 relative ${value ? 'bg-blue-600' : 'bg-gray-600'}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${value ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b crm-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="crm-text-primary text-sm font-medium">{label}</p>
        {description && <p className="crm-text-muted text-xs mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

/* ─── General ────────────────────────────────────────────────── */
function GeneralSection({ s, save }: { s: AppSettings; save: (u: Partial<AppSettings>) => void }) {
  return (
    <div>
      <SectionHeader title="General Settings" />
      <div className="crm-card rounded-2xl p-5">
        <Row label="App Name">
          <input value={s.appName} onChange={e => save({ appName: e.target.value })}
            className="crm-input rounded-xl px-3 py-2 text-sm w-52" />
        </Row>
        <Row label="Company Name">
          <input value={s.companyName} onChange={e => save({ companyName: e.target.value })}
            className="crm-input rounded-xl px-3 py-2 text-sm w-52" />
        </Row>
        <Row label="Default Language">
          <select value={s.language} onChange={e => save({ language: e.target.value as any })}
            className="crm-input rounded-xl px-3 py-2 text-sm">
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </Row>
        <Row label="Currency">
          <select value={s.currency} onChange={e => save({ currency: e.target.value })}
            className="crm-input rounded-xl px-3 py-2 text-sm">
            <option value="EGP">EGP</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </Row>
        <Row label="Date Format">
          <select value={s.dateFormat} onChange={e => save({ dateFormat: e.target.value })}
            className="crm-input rounded-xl px-3 py-2 text-sm">
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          </select>
        </Row>
      </div>
    </div>
  );
}

/* ─── Profile ────────────────────────────────────────────────── */
function ProfileSection({ s, save, addToast }: { s: AppSettings; save: (u: Partial<AppSettings>) => void; addToast: (m: string) => void }) {
  const p = s.profile;
  const upd = (k: string, v: string) => save({ profile: { ...p, [k]: v } });
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      upd('photo', ev.target?.result as string);
      addToast('Profile photo updated ✓');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <SectionHeader title="My Profile" />
      <div className="crm-card rounded-2xl p-5">
        {/* Photo upload */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b crm-border">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl crm-surface-elevated flex items-center justify-center overflow-hidden">
              {p.photo
                ? <img src={p.photo} alt="Profile" className="w-full h-full object-cover" />
                : <User size={32} className="crm-text-muted" />
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 transition-colors"
            >
              <Camera size={12} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          <div>
            <p className="crm-text-primary font-medium">{p.name || 'Your Name'}</p>
            <p className="crm-text-secondary text-sm">{p.role || 'Your Role'}</p>
            <button onClick={() => fileRef.current?.click()} className="text-blue-400 hover:text-blue-300 text-xs mt-1">
              Upload photo
            </button>
          </div>
        </div>

        <Row label="Full Name">
          <input value={p.name} onChange={e => upd('name', e.target.value)}
            className="crm-input rounded-xl px-3 py-2 text-sm w-52" />
        </Row>
        <Row label="Email" description="Used for daily digest notifications">
          <input type="email" value={p.email} onChange={e => upd('email', e.target.value)}
            className="crm-input rounded-xl px-3 py-2 text-sm w-52" />
        </Row>
        <Row label="Phone">
          <input value={p.phone} onChange={e => upd('phone', e.target.value)}
            className="crm-input rounded-xl px-3 py-2 text-sm w-52" />
        </Row>
        <Row label="Role / Title">
          <input value={p.role} onChange={e => upd('role', e.target.value)}
            className="crm-input rounded-xl px-3 py-2 text-sm w-52" />
        </Row>
      </div>
    </div>
  );
}

/* ─── Notifications ──────────────────────────────────────────── */
function NotificationsSection({ s, save }: { s: AppSettings; save: (u: Partial<AppSettings>) => void }) {
  const n = s.notifications;
  const upd = (k: string, v: any) => save({ notifications: { ...n, [k]: v } });
  return (
    <div>
      <SectionHeader title="Notifications & Reminders" />
      <div className="crm-card rounded-2xl p-5">
        <Row label="Daily Email Digest" description="Send task summary every morning">
          <Toggle value={n.dailyDigestEnabled} onChange={v => upd('dailyDigestEnabled', v)} />
        </Row>
        <Row label="Digest Send Time">
          <input type="time" value={n.dailyDigestTime} onChange={e => upd('dailyDigestTime', e.target.value)}
            className="crm-input rounded-xl px-3 py-2 text-sm" />
        </Row>
        <Row label="Client Check-in Reminder">
          <Toggle value={n.clientCheckinEnabled} onChange={v => upd('clientCheckinEnabled', v)} />
        </Row>
        <Row label="Check-in Frequency (days)">
          <input type="number" min="1" max="30" value={n.clientCheckinFrequencyDays}
            onChange={e => upd('clientCheckinFrequencyDays', +e.target.value)}
            className="crm-input rounded-xl px-3 py-2 text-sm w-20" />
        </Row>
        <Row label="Overdue Task Alert">
          <Toggle value={n.overdueAlertEnabled} onChange={v => upd('overdueAlertEnabled', v)} />
        </Row>
        <Row label="Deal Inactivity Warning (days)">
          <input type="number" min="1" value={n.noActivityDealThreshold}
            onChange={e => upd('noActivityDealThreshold', +e.target.value)}
            className="crm-input rounded-xl px-3 py-2 text-sm w-20" />
        </Row>
        <Row label="Client No-Contact Warning (days)">
          <input type="number" min="1" value={n.clientNotContactedThreshold}
            onChange={e => upd('clientNotContactedThreshold', +e.target.value)}
            className="crm-input rounded-xl px-3 py-2 text-sm w-20" />
        </Row>
      </div>
    </div>
  );
}

/* ─── Pipeline Stages ────────────────────────────────────────── */
function PipelineSection({ s, save, addToast }: { s: AppSettings; save: (u: Partial<AppSettings>) => void; addToast: (m: string) => void }) {
  const [stages, setStages] = useState<PipelineStageConfig[]>([...s.pipelineStages].sort((a, b) => a.order - b.order));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const persist = (newStages: PipelineStageConfig[]) => {
    const ordered = newStages.map((s, i) => ({ ...s, order: i }));
    setStages(ordered);
    save({ pipelineStages: ordered });
  };

  const addStage = () => {
    const ns: PipelineStageConfig = { id: generateId(), nameEn: 'New Stage', color: '#3b82f6', order: stages.length, type: 'normal' };
    persist([...stages, ns]);
    setEditingId(ns.id);
  };

  const removeStage = (id: string) => persist(stages.filter(s => s.id !== id));

  const updateStage = (id: string, updates: Partial<PipelineStageConfig>) => {
    const updated = stages.map(s => s.id === id ? { ...s, ...updates } : s);
    persist(updated);
  };

  const handleDrop = (targetId: string) => {
    if (!dragging || dragging === targetId) return;
    const fi = stages.findIndex(s => s.id === dragging);
    const ti = stages.findIndex(s => s.id === targetId);
    const ns = [...stages];
    const [moved] = ns.splice(fi, 1);
    ns.splice(ti, 0, moved);
    persist(ns);
    setDragging(null); setDragOver(null);
  };

  return (
    <div>
      <SectionHeader title="Pipeline Stages" description="Drag to reorder. Click the gear icon to edit." />
      <div className="space-y-2 mb-4">
        {stages.map(stage => (
          <div
            key={stage.id}
            draggable
            onDragStart={() => setDragging(stage.id)}
            onDragEnd={() => { setDragging(null); setDragOver(null); }}
            onDragOver={e => { e.preventDefault(); setDragOver(stage.id); }}
            onDrop={() => handleDrop(stage.id)}
            className={`crm-card rounded-xl p-3 transition-all ${dragOver === stage.id ? 'border-blue-500' : ''} ${dragging === stage.id ? 'opacity-50' : ''}`}
          >
            {editingId === stage.id ? (
              <div className="space-y-2">
                <input value={stage.nameEn} onChange={e => updateStage(stage.id, { nameEn: e.target.value })}
                  className="w-full crm-input rounded-xl px-3 py-2 text-sm" placeholder="Stage name" />
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex gap-1.5">
                    {STAGE_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => updateStage(stage.id, { color: c })}
                        className={`w-5 h-5 rounded-full hover:scale-110 transition-transform ${stage.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-800' : ''}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                  <select value={stage.type} onChange={e => updateStage(stage.id, { type: e.target.value as any })}
                    className="crm-input rounded-lg px-2 py-1.5 text-xs">
                    <option value="normal">Normal</option>
                    <option value="lost">Lost ❌</option>
                  </select>
                  <button type="button" onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs">Done</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <GripVertical size={14} className="crm-text-muted cursor-grab" />
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: stage.color }} />
                <span className="crm-text-primary text-sm flex-1">{stage.nameEn}</span>
                {stage.type !== 'normal' && <span className="text-xs crm-text-muted">❌ Lost</span>}
                <button type="button" onClick={() => setEditingId(stage.id)} className="p-1 crm-text-muted hover:crm-text-primary"><SettingsIcon size={12} /></button>
                <button type="button" onClick={() => removeStage(stage.id)} className="p-1 crm-text-muted hover:text-red-400"><X size={12} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={addStage} className="flex items-center gap-2 px-4 py-2 crm-btn-secondary rounded-xl text-sm transition-colors">
        <Plus size={14} />
        Add Stage
      </button>
    </div>
  );
}

/* ─── Task Settings ──────────────────────────────────────────── */
function TasksSection({ s, save }: { s: AppSettings; save: (u: Partial<AppSettings>) => void }) {
  const ts = s.taskSettings;
  const upd = (k: string, v: any) => save({ taskSettings: { ...ts, [k]: v } });
  return (
    <div>
      <SectionHeader title="Task Settings" />
      <div className="crm-card rounded-2xl p-5">
        <Row label="Default Due Time">
          <input type="time" value={ts.defaultDueTime} onChange={e => upd('defaultDueTime', e.target.value)}
            className="crm-input rounded-xl px-3 py-2 text-sm" />
        </Row>
        <Row label="Auto-Rollover Overdue Tasks" description="Automatically move overdue tasks to today">
          <Toggle value={ts.autoRollover} onChange={v => upd('autoRollover', v)} />
        </Row>
        <Row label="Rollover Time">
          <input type="time" value={ts.rolloverTime} onChange={e => upd('rolloverTime', e.target.value)}
            className="crm-input rounded-xl px-3 py-2 text-sm" />
        </Row>
        <Row label="Quick Capture Default Priority">
          <select value={ts.defaultPriority} onChange={e => upd('defaultPriority', e.target.value as TaskPriority)}
            className="crm-input rounded-xl px-3 py-2 text-sm">
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </Row>
      </div>
    </div>
  );
}

/* ─── Dropdowns ──────────────────────────────────────────────── */
function ListEditor({ title, items, onChange }: { title: string; items: string[]; onChange: (items: string[]) => void }) {
  const [newItem, setNewItem] = useState('');
  return (
    <div className="crm-card rounded-xl p-4 mb-4">
      <h4 className="crm-text-primary text-sm font-semibold mb-3">{title}</h4>
      <div className="flex flex-wrap gap-2 mb-3">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5 px-3 py-1 crm-surface-elevated rounded-lg crm-text-secondary text-sm">
            {item}
            <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="crm-text-muted hover:text-red-400 transition-colors"><X size={11} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && newItem.trim()) { onChange([...items, newItem.trim()]); setNewItem(''); } }}
          placeholder="Add item..."
          className="flex-1 crm-input rounded-xl px-3 py-2 text-sm"
        />
        <button type="button"
          onClick={() => { if (newItem.trim()) { onChange([...items, newItem.trim()]); setNewItem(''); } }}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm transition-colors">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function DropdownsSection({ s, save }: { s: AppSettings; save: (u: Partial<AppSettings>) => void }) {
  const d = s.dropdowns;
  return (
    <div>
      <SectionHeader title="Dropdown Lists" />
      <ListEditor title="Industries / Sectors" items={d.industries} onChange={v => save({ dropdowns: { ...d, industries: v } })} />
      <ListEditor title="Lost Reasons" items={d.lostReasons} onChange={v => save({ dropdowns: { ...d, lostReasons: v } })} />
      <ListEditor title="Team Departments" items={d.departments} onChange={v => save({ dropdowns: { ...d, departments: v } })} />
    </div>
  );
}

/* ─── Team Management ────────────────────────────────────────── */
function TeamSection({ data, addTeamMember, updateTeamMember, deleteTeamMember, addToast }: any) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', role: '', phones: [''], email: '', department: '', active: true });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openEdit = (m: TeamMember) => {
    setForm({ name: m.name, role: m.role, phones: m.phones?.length ? [...m.phones] : [''], email: m.email, department: m.department, active: m.active });
    setEditId(m.id); setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, phones: form.phones.filter(p => p.trim()) };
    if (editId) { updateTeamMember(editId, payload); addToast('Updated ✓'); }
    else { addTeamMember(payload); addToast('Added ✓'); }
    setShowForm(false); setEditId(null);
  };

  const addPhone = () => setForm(f => ({ ...f, phones: [...f.phones, ''] }));
  const setPhone = (i: number, v: string) => setForm(f => ({ ...f, phones: f.phones.map((p, idx) => idx === i ? v : p) }));
  const removePhone = (i: number) => setForm(f => ({ ...f, phones: f.phones.filter((_, idx) => idx !== i) }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold crm-text-primary">Team Management</h2>
        <button onClick={() => { setForm({ name: '', role: '', phones: [''], email: '', department: '', active: true }); setEditId(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus size={14} />Add Member
        </button>
      </div>
      <div className="space-y-2">
        {data.team.map((m: TeamMember) => (
          <div key={m.id} className={`crm-card rounded-xl p-3 flex items-center gap-3 ${!m.active ? 'opacity-60' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {m.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="crm-text-primary text-sm font-medium">{m.name}</p>
              <p className="crm-text-muted text-xs">{m.role}{m.department ? ` · ${m.department}` : ''}</p>
            </div>
            {!m.active && <span className="text-xs text-red-400 px-2 py-0.5 bg-red-500/10 rounded-lg">Inactive</span>}
            <button onClick={() => openEdit(m)} className="p-1.5 crm-text-muted hover:crm-text-primary"><SettingsIcon size={13} /></button>
            <button onClick={() => setDeleteId(m.id)} className="p-1.5 crm-text-muted hover:text-red-400"><Trash2 size={13} /></button>
          </div>
        ))}
        {data.team.length === 0 && <p className="crm-text-muted text-sm text-center py-8">No team members yet</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="crm-modal w-full max-w-md mx-4 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="crm-text-primary font-bold text-lg mb-4">{editId ? 'Edit Member' : 'Add Member'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Role</label>
                  <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="block crm-text-secondary text-xs mb-1">Phone Numbers</label>
                {form.phones.map((ph, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={ph} onChange={e => setPhone(i, e.target.value)} placeholder="+20..."
                      className="flex-1 crm-input rounded-xl px-3 py-2 text-sm" />
                    {form.phones.length > 1 && (
                      <button type="button" onClick={() => removePhone(i)} className="crm-text-muted hover:text-red-400"><X size={14} /></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addPhone} className="text-blue-400 text-xs">+ Add phone</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block crm-text-secondary text-xs mb-1">Department</label>
                  <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full crm-input rounded-xl px-3 py-2.5 text-sm">
                    <option value="">— Select —</option>
                    {data.settings.dropdowns.departments.map((d: string) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                <span className="crm-text-secondary text-sm">Active</span>
              </label>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 crm-btn-secondary rounded-xl text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete Member"
          message="Assigned tasks and deals will remain. Continue?"
          onConfirm={() => { deleteTeamMember(deleteId); setDeleteId(null); addToast('Deleted'); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

/* ─── Import / Export ────────────────────────────────────────── */
function ImportExportSection({ data, exportData, importBackup, addToast }: any) {
  const downloadTemplate = (type: string) => {
    const templates: Record<string, string> = {
      clients: [
        'nameEn,nameAr,industry,status,address1,address2,brief,salesOwnerName',
        'Example Client,اسم عربي,Hospitality,active,Cairo Egypt,,Client overview here,Sara Ahmed',
        'Another Corp,,Real Estate,pending,Alexandria,,Brief notes,',
      ].join('\n'),
      contacts: [
        'fullName,jobTitle,clientNameEn,phone1,phone2,email,notes',
        'Ahmed Hassan,Purchasing Manager,Example Client,+201001234567,,ahmed@example.com,Decision maker',
        'Sara Mostafa,Director,,+201009876543,,sara@company.com,',
      ].join('\n'),
      tasks: [
        'title,description,priority,status,dueDate,assignedToName,clientNameEn,notes',
        'Follow up on proposal,Call to discuss revisions,high,todo,2025-07-01,Sara Ahmed,Example Client,',
        'Send samples,,medium,todo,2025-07-05,,,',
      ].join('\n'),
    };

    const csv = templates[type] || '';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `template-${type}.csv`; a.click();
    URL.revokeObjectURL(url);
    addToast(`Template downloaded`);
  };

  const exportAllAsCSV = () => {
    // Build a multi-sheet CSV (separate sections separated by headers)
    const sections: string[] = [];

    // Clients
    sections.push('=== CLIENTS ===');
    sections.push('nameEn,nameAr,industry,status,addresses,brief,notes,salesOwner,createdAt');
    data.clients.forEach((c: any) => {
      sections.push(`"${c.nameEn}","${c.nameAr}","${c.industry}","${c.status}","${(c.addresses||[]).join('; ')}","${c.brief||''}","${c.notes||''}","${data.team.find((m:any)=>m.id===c.salesOwner)?.name||''}","${c.createdAt}"`);
    });

    sections.push('');
    sections.push('=== CONTACTS ===');
    sections.push('fullName,jobTitle,client,phones,email,notes');
    data.contacts.forEach((c: any) => {
      const cl = data.clients.find((cl: any) => cl.id === c.clientId);
      sections.push(`"${c.fullName}","${c.jobTitle}","${cl?.nameEn||''}","${c.phones.join('; ')}","${c.email}","${c.notes}"`);
    });

    sections.push('');
    sections.push('=== DEALS ===');
    sections.push('name,client,stage,probability,expectedCloseDate,assignedTo,notes');
    data.deals.forEach((d: any) => {
      const cl = data.clients.find((c: any) => c.id === d.clientId);
      const stage = data.settings.pipelineStages.find((s: any) => s.id === d.stageId);
      const member = data.team.find((m: any) => m.id === d.assignedTo);
      sections.push(`"${d.name}","${cl?.nameEn||''}","${stage?.nameEn||''}","${d.probability}%","${d.expectedCloseDate}","${member?.name||''}","${d.notes}"`);
    });

    sections.push('');
    sections.push('=== PROJECTS ===');
    sections.push('name,client,status,startDate,expectedEndDate,team,description');
    data.projects.forEach((p: any) => {
      const cl = data.clients.find((c: any) => c.id === p.clientId);
      const team = p.assignedTeam.map((id: string) => data.team.find((m: any) => m.id === id)?.name).filter(Boolean).join('; ');
      sections.push(`"${p.name}","${cl?.nameEn||''}","${p.status}","${p.startDate}","${p.expectedEndDate}","${team}","${p.description}"`);
    });

    sections.push('');
    sections.push('=== TASKS ===');
    sections.push('title,priority,status,dueDate,assignedTo,client,rollovers');
    data.tasks.forEach((t: any) => {
      const cl = data.clients.find((c: any) => c.id === t.linkedClientId);
      const member = data.team.find((m: any) => m.id === t.assignedTo);
      sections.push(`"${t.title}","${t.priority}","${t.status}","${t.dueDate}","${member?.name||''}","${cl?.nameEn||''}","${t.rolloverHistory.length}"`);
    });

    const blob = new Blob([sections.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `impact-crm-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Full export downloaded');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        importBackup(parsed);
      } catch {
        addToast('Invalid file format', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div>
      <SectionHeader title="Import / Export" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="crm-card rounded-2xl p-5">
          <h3 className="crm-text-primary font-semibold mb-4">Download Templates</h3>
          <p className="crm-text-muted text-xs mb-4">CSV templates with example rows and all available fields.</p>
          <div className="space-y-2">
            {[
              { key: 'clients', label: 'Clients Template' },
              { key: 'contacts', label: 'Contacts Template' },
              { key: 'tasks', label: 'Tasks Template' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => downloadTemplate(key)}
                className="w-full flex items-center gap-3 p-3 crm-surface-elevated hover:crm-border-hover rounded-xl crm-text-secondary text-sm transition-colors">
                <Download size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="crm-card rounded-2xl p-5">
          <h3 className="crm-text-primary font-semibold mb-4">Backup & Restore</h3>
          <div className="space-y-3">
            <button onClick={exportAllAsCSV}
              className="w-full flex items-center gap-3 p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-blue-400 text-sm transition-colors">
              <Download size={14} />
              Export All Data (CSV)
            </button>
            <button onClick={exportData}
              className="w-full flex items-center gap-3 p-3 crm-surface-elevated hover:crm-border-hover rounded-xl crm-text-secondary text-sm transition-colors">
              <Download size={14} />
              Export Full Backup (JSON)
            </button>
            <label className="w-full flex items-center gap-3 p-3 crm-surface-elevated hover:crm-border-hover rounded-xl crm-text-secondary text-sm transition-colors cursor-pointer">
              <Upload size={14} />
              Import from JSON Backup
              <input type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Data Management ────────────────────────────────────────── */
function DataSection({ data, onClearTasks, onClearDeals, onClearClients, onReset }: any) {
  return (
    <div>
      <SectionHeader title="Data Management" />
      <div className="crm-card rounded-2xl p-5 mb-4">
        <p className="crm-text-secondary text-sm mb-1">Database</p>
        <p className="crm-text-muted text-xs mt-1">Supabase PostgreSQL</p>
      </div>
      <div className="space-y-3">
        {[
          { label: 'Clear All Tasks', sub: `${data.tasks.length} tasks`, color: 'yellow', action: onClearTasks },
          { label: 'Clear All Deals', sub: `${data.deals.length} deals`, color: 'orange', action: onClearDeals },
          { label: 'Clear All Clients & Linked Data', sub: 'Clients, contacts, deals, projects, tasks', color: 'red', action: onClearClients },
          { label: 'Reset App to Defaults 🔴', sub: 'Nuclear option — wipes everything', color: 'red-dark', action: onReset },
        ].map(({ label, sub, color, action }) => (
          <button key={label} onClick={action}
            className={`w-full flex items-center gap-3 p-4 rounded-xl text-sm transition-colors text-left ${
              color === 'yellow' ? 'bg-yellow-500/10 border border-yellow-500/20 hover:border-yellow-500/40 text-yellow-400' :
              color === 'orange' ? 'bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/40 text-orange-400' :
              'bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-red-400'
            }`}>
            <Trash2 size={16} />
            <div>
              <p className="font-medium">{label}</p>
              <p className="opacity-60 text-xs">{sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Appearance ─────────────────────────────────────────────── */
function AppearanceSection({ s, save }: { s: AppSettings; save: (u: Partial<AppSettings>) => void }) {
  const ALL_MODULES = ['clients', 'contacts', 'pipeline', 'projects', 'tasks', 'team'];
  const MODULE_LABELS: Record<string, string> = {
    clients: 'Clients', contacts: 'Contacts', pipeline: 'Pipeline',
    projects: 'Projects', tasks: 'Tasks', team: 'Team',
  };

  const toggleModule = (mod: string) => {
    const updated = s.visibleModules.includes(mod)
      ? s.visibleModules.filter(m => m !== mod)
      : [...s.visibleModules, mod];
    save({ visibleModules: updated });
  };

  return (
    <div>
      <SectionHeader title="Appearance" />
      <div className="crm-card rounded-2xl p-5 mb-4">
        <Row label="Theme">
          <div className="flex gap-2">
            {[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
            ].map(({ value, label }) => (
              <button key={value} onClick={() => save({ theme: value as any })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                  s.theme === value
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'crm-surface-elevated border-gray-600 crm-text-secondary hover:crm-text-primary'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Accent Color">
          <div className="flex gap-2">
            {ACCENT_COLORS.map(c => (
              <button key={c.id} onClick={() => save({ accentColor: c.id })}
                className={`w-6 h-6 rounded-full ${c.cls} hover:scale-110 transition-transform ${s.accentColor === c.id ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900' : ''}`}
                title={c.label} />
            ))}
          </div>
        </Row>
        <Row label="Compact Mode" description="Reduce spacing to show more content">
          <Toggle value={s.compactMode} onChange={v => save({ compactMode: v })} />
        </Row>
      </div>

      <div className="crm-card rounded-2xl p-5">
        <h3 className="crm-text-primary font-semibold mb-4">Visible Sidebar Modules</h3>
        <div className="grid grid-cols-2 gap-2">
          {ALL_MODULES.map(mod => (
            <label key={mod} className="flex items-center gap-3 p-3 crm-surface-elevated rounded-xl cursor-pointer hover:crm-border-hover transition-colors">
              <Toggle value={s.visibleModules.includes(mod)} onChange={() => toggleModule(mod)} />
              <span className="crm-text-secondary text-sm">{MODULE_LABELS[mod]}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
