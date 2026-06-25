import React, { useState, useRef } from 'react';
import { Settings as SettingsIcon, User, Bell, TrendingUp, CheckSquare, Tag, Users, Upload, Download, Trash2, Palette, RotateCcw, Plus, X, GripVertical, Camera } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { useLang } from '../context/LangContext';
import { AppSettings, PipelineStageConfig, TaskPriority, TeamMember } from '../types';
import { generateId } from '../utils/storage';
import ConfirmDialog from '../components/ConfirmDialog';
import ImportModal from '../components/ImportModal';

const ACCENT_OPTIONS = [
  { key: 'blue', label: 'Blue', class: 'bg-blue-600' },
  { key: 'emerald', label: 'Emerald', class: 'bg-emerald-600' },
  { key: 'rose', label: 'Rose', class: 'bg-rose-600' },
  { key: 'amber', label: 'Amber', class: 'bg-amber-600' },
  { key: 'cyan', label: 'Cyan', class: 'bg-cyan-600' },
  { key: 'slate', label: 'Slate', class: 'bg-slate-600' },
];

const MODULE_OPTIONS = [
  { key: 'clients', label: 'Clients' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'projects', label: 'Projects' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'team', label: 'Team' },
];

const WIDGET_OPTIONS = [
  { key: 'todayTasks', label: "Today's Tasks" },
  { key: 'overdueTasks', label: 'Overdue Tasks' },
  { key: 'inactiveDeals', label: 'Inactive Deals' },
  { key: 'behindProjects', label: 'Behind Schedule' },
  { key: 'inactiveClients', label: 'Inactive Clients' },
  { key: 'pipelineSummary', label: 'Pipeline Summary' },
  { key: 'recentActivity', label: 'Recent Activity' },
];

export default function Settings() {
  const {
    data,
    updateSettings,
    addClient,
    addContact,
    importClients,
    importContacts,
    clearAllTasks,
    clearAllDeals,
    clearAllClients,
    resetToDefaults,
    exportData,
    importBackup,
  } = useCRM();
  const { lang } = useLang();
  const { settings } = data;

  const [activeTab, setActiveTab] = useState<'general' | 'pipeline' | 'team' | 'dropdowns' | 'data'>('general');
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importType, setImportType] = useState<'clients' | 'contacts'>('clients');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (partial: Partial<AppSettings>) => {
    updateSettings(partial);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleProfileChange = (partial: Partial<AppSettings['profile']>) => {
    handleChange({ profile: { ...settings.profile, ...partial } });
  };

  const handleNotificationChange = (partial: Partial<AppSettings['notifications']>) => {
    handleChange({ notifications: { ...settings.notifications, ...partial } });
  };

  const handleTaskSettingsChange = (partial: Partial<AppSettings['taskSettings']>) => {
    handleChange({ taskSettings: { ...settings.taskSettings, ...partial } });
  };

  const handleDropdownChange = (key: keyof AppSettings['dropdowns'], value: string[]) => {
    handleChange({ dropdowns: { ...settings.dropdowns, [key]: value } });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleChange({ companyLogo: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        importBackup(json);
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <SettingsIcon size={24} />
        Settings
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700 pb-2">
        {[
          { key: 'general', icon: User, label: 'General' },
          { key: 'pipeline', icon: TrendingUp, label: 'Pipeline' },
          { key: 'team', icon: Users, label: 'Team' },
          { key: 'dropdowns', icon: Tag, label: 'Dropdowns' },
          { key: 'data', icon: Upload, label: 'Data' },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {saved && (
        <div className="mb-4 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium">
          Saved
        </div>
      )}

      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Profile */}
          <SectionCard title="Profile" icon={<User size={18} />}>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                  {settings.profile.photo ? (
                    <img src={settings.profile.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={24} className="text-gray-500" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"
                >
                  <Camera size={12} className="text-white" />
                </button>
              </div>
              <div className="flex-1">
                <input
                  value={settings.profile.name}
                  onChange={e => handleProfileChange({ name: e.target.value })}
                  placeholder="Your name"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
                <input
                  value={settings.profile.email}
                  onChange={e => handleProfileChange({ email: e.target.value })}
                  placeholder="Email"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mt-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={settings.profile.phone}
                onChange={e => handleProfileChange({ phone: e.target.value })}
                placeholder="Phone"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <input
                value={settings.profile.role}
                onChange={e => handleProfileChange({ role: e.target.value })}
                placeholder="Role"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </SectionCard>

          {/* App Info */}
          <SectionCard title="App Info" icon={<SettingsIcon size={18} />}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">App Name</label>
                <input
                  value={settings.appName}
                  onChange={e => handleChange({ appName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Company Name</label>
                <input
                  value={settings.companyName}
                  onChange={e => handleChange({ companyName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </SectionCard>

          {/* Appearance */}
          <SectionCard title="Appearance" icon={<Palette size={18} />}>
            <div className="mb-4">
              <label className="text-gray-400 text-xs mb-2 block">Accent Color</label>
              <div className="flex gap-2">
                {ACCENT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => handleChange({ accentColor: opt.key })}
                    className={`w-8 h-8 rounded-full ${opt.class} ${settings.accentColor === opt.key ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : ''}`}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="text-gray-400 text-xs mb-2 block">Theme</label>
              <div className="flex gap-2">
                {(['dark', 'light'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => handleChange({ theme: t })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                      settings.theme === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="text-gray-400 text-xs mb-2 block">Language</label>
              <div className="flex gap-2">
                {(['en', 'ar'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => handleChange({ language: l })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      settings.language === l ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {l === 'ar' ? 'العربية' : 'English'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="compact"
                checked={settings.compactMode}
                onChange={e => handleChange({ compactMode: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600"
              />
              <label htmlFor="compact" className="text-gray-300 text-sm">Compact Mode</label>
            </div>
          </SectionCard>

          {/* Currency & Date */}
          <SectionCard title="Regional" icon={<SettingsIcon size={18} />}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Currency</label>
                <input
                  value={settings.currency}
                  onChange={e => handleChange({ currency: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Date Format</label>
                <select
                  value={settings.dateFormat}
                  onChange={e => handleChange({ dateFormat: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
              </div>
            </div>
          </SectionCard>

          {/* Notifications */}
          <SectionCard title="Notifications" icon={<Bell size={18} />}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Daily Digest</p>
                  <p className="text-gray-500 text-xs">Summary of today's tasks and activities</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.dailyDigestEnabled}
                  onChange={e => handleNotificationChange({ dailyDigestEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600"
                />
              </div>
              {settings.notifications.dailyDigestEnabled && (
                <input
                  type="time"
                  value={settings.notifications.dailyDigestTime}
                  onChange={e => handleNotificationChange({ dailyDigestTime: e.target.value })}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Client Check-in Reminder</p>
                  <p className="text-gray-500 text-xs">Alert when clients haven't been contacted</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.clientCheckinEnabled}
                  onChange={e => handleNotificationChange({ clientCheckinEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600"
                />
              </div>
              {settings.notifications.clientCheckinEnabled && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Every</span>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={settings.notifications.clientCheckinFrequencyDays}
                    onChange={e => handleNotificationChange({ clientCheckinFrequencyDays: parseInt(e.target.value) || 1 })}
                    className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white text-sm text-center"
                  />
                  <span className="text-gray-400 text-sm">days</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Overdue Alerts</p>
                  <p className="text-gray-500 text-xs">Alert for overdue tasks and behind projects</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.overdueAlertEnabled}
                  onChange={e => handleNotificationChange({ overdueAlertEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600"
                />
              </div>
            </div>
          </SectionCard>

          {/* Task Settings */}
          <SectionCard title="Task Settings" icon={<CheckSquare size={18} />}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Auto Rollover</p>
                  <p className="text-gray-500 text-xs">Automatically move overdue tasks to today</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.taskSettings.autoRollover}
                  onChange={e => handleTaskSettingsChange({ autoRollover: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Default Due Time</label>
                  <input
                    type="time"
                    value={settings.taskSettings.defaultDueTime}
                    onChange={e => handleTaskSettingsChange({ defaultDueTime: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Rollover Time</label>
                  <input
                    type="time"
                    value={settings.taskSettings.rolloverTime}
                    onChange={e => handleTaskSettingsChange({ rolloverTime: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Default Priority</label>
                <select
                  value={settings.taskSettings.defaultPriority}
                  onChange={e => handleTaskSettingsChange({ defaultPriority: e.target.value as TaskPriority })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </SectionCard>

          {/* Visible Modules */}
          <SectionCard title="Visible Modules" icon={<SettingsIcon size={18} />}>
            <div className="flex flex-wrap gap-2">
              {MODULE_OPTIONS.map(mod => (
                <button
                  key={mod.key}
                  onClick={() => {
                    const next = settings.visibleModules.includes(mod.key)
                      ? settings.visibleModules.filter(m => m !== mod.key)
                      : [...settings.visibleModules, mod.key];
                    handleChange({ visibleModules: next });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    settings.visibleModules.includes(mod.key)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {mod.label}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Dashboard Widgets */}
          <SectionCard title="Dashboard Widgets" icon={<SettingsIcon size={18} />}>
            <div className="flex flex-wrap gap-2">
              {WIDGET_OPTIONS.map(w => (
                <button
                  key={w.key}
                  onClick={() => {
                    const next = settings.dashboardWidgets.includes(w.key)
                      ? settings.dashboardWidgets.filter(dw => dw !== w.key)
                      : [...settings.dashboardWidgets, w.key];
                    handleChange({ dashboardWidgets: next });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    settings.dashboardWidgets.includes(w.key)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {activeTab === 'pipeline' && (
        <PipelineSettings settings={settings} onChange={handleChange} />
      )}

      {activeTab === 'team' && (
        <TeamSettings />
      )}

      {activeTab === 'dropdowns' && (
        <DropdownSettings settings={settings} onChange={handleDropdownChange} />
      )}

      {activeTab === 'data' && (
        <DataSection
          data={data}
          onClearTasks={() => setConfirm('clearTasks')}
          onClearDeals={() => setConfirm('clearDeals')}
          onClearClients={() => setConfirm('clearClients')}
          onReset={() => setConfirm('reset')}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        title="Confirm Action"
        message={
          confirm === 'clearTasks' ? 'Are you sure you want to clear all tasks?' :
          confirm === 'clearDeals' ? 'Are you sure you want to clear all deals?' :
          confirm === 'clearClients' ? 'Are you sure you want to clear all data? This will delete all clients, contacts, deals, and projects.' :
          confirm === 'reset' ? 'Are you sure you want to reset to defaults? All data will be lost.' :
          ''
        }
        onConfirm={() => {
          if (confirm === 'clearTasks') clearAllTasks();
          if (confirm === 'clearDeals') clearAllDeals();
          if (confirm === 'clearClients') clearAllClients();
          if (confirm === 'reset') resetToDefaults();
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />

      <ImportModal
        open={importOpen}
        type={importType}
        onClose={() => setImportOpen(false)}
        onImport={rows => {
          if (importType === 'clients') importClients(rows as any);
          else importContacts(rows as any);
          setImportOpen(false);
        }}
      />

      <input
        type="file"
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
        id="import-backup"
      />
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-blue-400">{icon}</div>
        <h3 className="text-white font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function PipelineSettings({ settings, onChange }: { settings: AppSettings; onChange: (s: Partial<AppSettings>) => void }) {
  const [dragged, setDragged] = useState<number | null>(null);

  const handleDragStart = (idx: number) => setDragged(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragged === null || dragged === idx) return;
    const stages = [...settings.pipelineStages];
    const [moved] = stages.splice(dragged, 1);
    stages.splice(idx, 0, moved);
    setDragged(idx);
    onChange({ pipelineStages: stages.map((s, i) => ({ ...s, order: i })) });
  };

  const addStage = () => {
    const id = generateId();
    onChange({
      pipelineStages: [
        ...settings.pipelineStages,
        { id, nameEn: 'New Stage', color: '#64748b', order: settings.pipelineStages.length, type: 'normal' as const },
      ],
    });
  };

  const updateStage = (idx: number, partial: Partial<PipelineStageConfig>) => {
    const stages = [...settings.pipelineStages];
    stages[idx] = { ...stages[idx], ...partial };
    onChange({ pipelineStages: stages });
  };

  const removeStage = (idx: number) => {
    const stages = settings.pipelineStages.filter((_, i) => i !== idx);
    onChange({ pipelineStages: stages.map((s, i) => ({ ...s, order: i })) });
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Pipeline Stages" icon={<TrendingUp size={18} />}>
        <div className="space-y-2">
          {settings.pipelineStages.map((stage, idx) => (
            <div
              key={stage.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => handleDragOver(e, idx)}
              className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl cursor-move group"
            >
              <GripVertical size={16} className="text-gray-600" />
              <input
                type="color"
                value={stage.color}
                onChange={e => updateStage(idx, { color: e.target.value })}
                className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
              />
              <input
                value={stage.nameEn}
                onChange={e => updateStage(idx, { nameEn: e.target.value })}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <select
                value={stage.type}
                onChange={e => updateStage(idx, { type: e.target.value as 'normal' | 'lost' })}
                className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-sm"
              >
                <option value="normal">Normal</option>
                <option value="lost">Lost</option>
              </select>
              <button
                onClick={() => removeStage(idx)}
                className="p-1.5 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addStage}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Stage
        </button>
      </SectionCard>
    </div>
  );
}

function TeamSettings() {
  const { data, addTeamMember, updateTeamMember, deleteTeamMember } = useCRM();
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({ name: '', role: '', email: '', phones: '', department: '', active: true });

  const reset = () => {
    setForm({ name: '', role: '', email: '', phones: '', department: '', active: true });
    setEditing(null);
  };

  const handleSubmit = async () => {
    const payload = {
      name: form.name,
      role: form.role,
      email: form.email,
      phones: form.phones.split(',').map(p => p.trim()).filter(Boolean),
      department: form.department,
      active: form.active,
    };
    if (editing) {
      await updateTeamMember(editing.id, payload);
    } else {
      await addTeamMember(payload as any);
    }
    reset();
  };

  const startEdit = (m: TeamMember) => {
    setEditing(m);
    setForm({
      name: m.name,
      role: m.role,
      email: m.email,
      phones: m.phones.join(', '),
      department: m.department,
      active: m.active,
    });
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Team Members" icon={<Users size={18} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Name"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            placeholder="Role"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="Email"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            value={form.phones}
            onChange={e => setForm(f => ({ ...f, phones: e.target.value }))}
            placeholder="Phones (comma separated)"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            value={form.department}
            onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
            placeholder="Department"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600"
            />
            <label htmlFor="active" className="text-gray-300 text-sm">Active</label>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
          >
            {editing ? 'Update' : 'Add'} Member
          </button>
          {editing && (
            <button
              onClick={reset}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {data.team.map(m => (
            <div key={m.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl group">
              <div>
                <p className="text-white text-sm font-medium">{m.name}</p>
                <p className="text-gray-500 text-xs">{m.role} • {m.department}</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(m)} className="p-1.5 text-gray-400 hover:text-blue-400">
                  <SettingsIcon size={14} />
                </button>
                <button onClick={() => deleteTeamMember(m.id)} className="p-1.5 text-gray-400 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function DropdownSettings({ settings, onChange }: { settings: AppSettings; onChange: (key: keyof AppSettings['dropdowns'], value: string[]) => void }) {
  const [editKey, setEditKey] = useState<keyof AppSettings['dropdowns'] | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (key: keyof AppSettings['dropdowns']) => {
    setEditKey(key);
    setEditValue(settings.dropdowns[key].join('\n'));
  };

  const save = () => {
    if (editKey) {
      onChange(editKey, editValue.split('\n').map(s => s.trim()).filter(Boolean));
      setEditKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Dropdown Values" icon={<Tag size={18} />}>
        <div className="space-y-3">
          {(Object.keys(settings.dropdowns) as Array<keyof AppSettings['dropdowns']>).map(key => (
            <div key={key} className="p-3 bg-gray-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white text-sm font-medium capitalize">{key}</p>
                <button
                  onClick={() => startEdit(key)}
                  className="text-blue-400 hover:text-blue-300 text-xs"
                >
                  Edit
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {settings.dropdowns[key].map(v => (
                  <span key={v} className="px-2 py-0.5 bg-gray-700 rounded text-gray-300 text-xs">{v}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {editKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-white font-semibold mb-4 capitalize">Edit {editKey}</h3>
            <textarea
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              rows={8}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="One value per line"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={save}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
              >
                Save
              </button>
              <button
                onClick={() => setEditKey(null)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DataSection({ data, onClearTasks, onClearDeals, onClearClients, onReset }: any) {
  return (
    <div>
      <SectionCard title="Data Management" icon={<Upload size={18} />}>
        <div className="crm-card rounded-2xl p-5 mb-4">
          <p className="crm-text-secondary text-sm mb-1">Database</p>
          <p className="crm-text-muted text-xs mt-1">Supabase PostgreSQL</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
            <div>
              <p className="text-white text-sm font-medium">Export Backup</p>
              <p className="text-gray-500 text-xs">Download all data as JSON</p>
            </div>
            <button
              onClick={() => data.exportData()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
            >
              <Download size={16} />
              Export
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
            <div>
              <p className="text-white text-sm font-medium">Import Backup</p>
              <p className="text-gray-500 text-xs">Restore from JSON backup file</p>
            </div>
            <label
              htmlFor="import-backup"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium cursor-pointer"
            >
              <Upload size={16} />
              Import
            </label>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
            <div>
              <p className="text-white text-sm font-medium">Clear All Tasks</p>
              <p className="text-gray-500 text-xs">Delete all tasks permanently</p>
            </div>
            <button
              onClick={onClearTasks}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium"
            >
              <Trash2 size={16} />
              Clear
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
            <div>
              <p className="text-white text-sm font-medium">Clear All Deals</p>
              <p className="text-gray-500 text-xs">Delete all deals permanently</p>
            </div>
            <button
              onClick={onClearDeals}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium"
            >
              <Trash2 size={16} />
              Clear
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
            <div>
              <p className="text-white text-sm font-medium">Clear All Data</p>
              <p className="text-gray-500 text-xs">Delete all clients, contacts, deals, and projects</p>
            </div>
            <button
              onClick={onClearClients}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
            <div>
              <p className="text-white text-sm font-medium">Reset to Defaults</p>
              <p className="text-gray-500 text-xs">Reset app to factory defaults</p>
            </div>
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
