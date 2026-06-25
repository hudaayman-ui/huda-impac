import { supabase } from './supabase';
import type {
  Client, Contact, Deal, Project, Task, TeamMember, ActivityLog,
  AppSettings, RolloverEntry,
} from '../types';

/* ── Helpers ────────────────────────────────────────────────── */

function snakeToCamel<T>(obj: Record<string, any>): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = k.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase());
    out[key] = v;
  }
  return out as T;
}

function camelToSnake(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const key = k.replace(/[A-Z]/g, ch => '_' + ch.toLowerCase());
    out[key] = v;
  }
  return out;
}

function mapRows<T>(rows: any[] | null): T[] {
  return (rows || []).map(r => snakeToCamel<T>(r));
}

/* ── Clients ────────────────────────────────────────────────── */

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return mapRows<Client>(data);
}

export async function createClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
  const { data, error } = await supabase.from('clients').insert(camelToSnake(client)).select().single();
  if (error) throw error;
  return snakeToCamel<Client>(data);
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<void> {
  const { error } = await supabase.from('clients').update(camelToSnake(updates)).eq('id', id);
  if (error) throw error;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
}

/* ── Contacts ───────────────────────────────────────────────── */

export async function fetchContacts(): Promise<Contact[]> {
  const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return mapRows<Contact>(data);
}

export async function createContact(contact: Omit<Contact, 'id' | 'createdAt'>): Promise<Contact> {
  const { data, error } = await supabase.from('contacts').insert(camelToSnake(contact)).select().single();
  if (error) throw error;
  return snakeToCamel<Contact>(data);
}

export async function updateContact(id: string, updates: Partial<Contact>): Promise<void> {
  const { error } = await supabase.from('contacts').update(camelToSnake(updates)).eq('id', id);
  if (error) throw error;
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) throw error;
}

/* ── Team Members ───────────────────────────────────────────── */

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase.from('team_members').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return mapRows<TeamMember>(data);
}

export async function createTeamMember(member: Omit<TeamMember, 'id' | 'createdAt'>): Promise<TeamMember> {
  const { data, error } = await supabase.from('team_members').insert(camelToSnake(member)).select().single();
  if (error) throw error;
  return snakeToCamel<TeamMember>(data);
}

export async function updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<void> {
  const { error } = await supabase.from('team_members').update(camelToSnake(updates)).eq('id', id);
  if (error) throw error;
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase.from('team_members').delete().eq('id', id);
  if (error) throw error;
}

/* ── Deals ──────────────────────────────────────────────────── */

export async function fetchDeals(): Promise<Deal[]> {
  const { data, error } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const deals = mapRows<Deal>(data);
  // Fetch activities for each deal
  const { data: acts, error: actErr } = await supabase.from('deal_activities').select('*').order('created_at', { ascending: false });
  if (actErr) throw actErr;
  const activities = mapRows<any>(acts);
  const byDeal: Record<string, ActivityLog[]> = {};
  for (const a of activities) {
    if (!byDeal[a.dealId]) byDeal[a.dealId] = [];
    byDeal[a.dealId].push({
      id: a.id,
      entityType: 'deal',
      entityId: a.dealId,
      action: a.action,
      timestamp: a.createdAt,
    });
  }
  for (const d of deals) {
    d.activityLog = byDeal[d.id] || [];
  }
  return deals;
}

export async function createDeal(deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'activityLog'>): Promise<Deal> {
  const { data, error } = await supabase.from('deals').insert(camelToSnake(deal)).select().single();
  if (error) throw error;
  return { ...snakeToCamel<Deal>(data), activityLog: [] };
}

export async function updateDeal(id: string, updates: Partial<Deal>): Promise<void> {
  const { error } = await supabase.from('deals').update(camelToSnake(updates)).eq('id', id);
  if (error) throw error;
}

export async function deleteDeal(id: string): Promise<void> {
  const { error } = await supabase.from('deals').delete().eq('id', id);
  if (error) throw error;
}

export async function addDealActivity(dealId: string, action: string): Promise<void> {
  const { error } = await supabase.from('deal_activities').insert({ deal_id: dealId, action });
  if (error) throw error;
}

/* ── Projects ───────────────────────────────────────────────── */

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return mapRows<Project>(data);
}

export async function createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const { data, error } = await supabase.from('projects').insert(camelToSnake(project)).select().single();
  if (error) throw error;
  return snakeToCamel<Project>(data);
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  const { error } = await supabase.from('projects').update(camelToSnake(updates)).eq('id', id);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

/* ── Tasks ──────────────────────────────────────────────────── */

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const tasks = mapRows<Task>(data);
  // Fetch rollovers for each task
  const { data: rolls, error: rollErr } = await supabase.from('task_rollovers').select('*').order('created_at', { ascending: false });
  if (rollErr) throw rollErr;
  const byTask: Record<string, RolloverEntry[]> = {};
  for (const r of mapRows<any>(rolls)) {
    if (!byTask[r.taskId]) byTask[r.taskId] = [];
    byTask[r.taskId].push({
      fromDate: r.fromDate,
      toDate: r.toDate,
      note: r.note,
    });
  }
  for (const t of tasks) {
    t.rolloverHistory = byTask[t.id] || [];
  }
  return tasks;
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'rolloverHistory'>): Promise<Task> {
  const { data, error } = await supabase.from('tasks').insert(camelToSnake(task)).select().single();
  if (error) throw error;
  return { ...snakeToCamel<Task>(data), rolloverHistory: [] };
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const { error } = await supabase.from('tasks').update(camelToSnake(updates)).eq('id', id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function createTaskRollover(taskId: string, entry: RolloverEntry): Promise<void> {
  const { error } = await supabase.from('task_rollovers').insert({
    task_id: taskId,
    from_date: entry.fromDate,
    to_date: entry.toDate,
    note: entry.note,
  });
  if (error) throw error;
}

/* ── Activity Logs ──────────────────────────────────────────── */

export async function fetchActivityLogs(): Promise<ActivityLog[]> {
  const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500);
  if (error) throw error;
  return mapRows<ActivityLog>(data).map(a => ({
    ...a,
    timestamp: a.timestamp || new Date().toISOString(),
  }));
}

export async function createActivityLog(log: Omit<ActivityLog, 'id'>): Promise<void> {
  const { error } = await supabase.from('activity_logs').insert({
    entity_type: log.entityType,
    entity_id: log.entityId,
    action: log.action,
  });
  if (error) throw error;
}

/* ── App Settings ───────────────────────────────────────────── */

export async function fetchSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
  if (error) throw error;
  const row = snakeToCamel<any>(data);
  return dbRowToSettings(row);
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<void> {
  const dbUpdates = settingsToDbRow(updates);
  const { error } = await supabase.from('app_settings').update(dbUpdates).eq('id', 1);
  if (error) throw error;
}

/* ── Settings helpers: DB <-> App format ────────────────────── */

function dbRowToSettings(row: any): AppSettings {
  return {
    appName: row.appName || 'Impact Furniture CRM',
    companyName: row.companyName || 'Impact Furniture',
    companyLogo: row.companyLogo,
    language: row.language || 'en',
    currency: row.currency || 'EGP',
    dateFormat: row.dateFormat || 'DD/MM/YYYY',
    theme: row.theme || 'dark',
    accentColor: row.accentColor || 'blue',
    compactMode: row.compactMode ?? false,
    visibleModules: row.visibleModules || ['clients', 'contacts', 'pipeline', 'projects', 'tasks', 'team'],
    dashboardWidgets: row.dashboardWidgets || ['todayTasks', 'inactiveDeals', 'behindProjects', 'inactiveClients', 'pipelineSummary', 'recentActivity'],
    profile: row.profile || { name: '', email: '', phone: '', role: '', photo: '' },
    notifications: row.notifications || {
      dailyDigestEnabled: true, dailyDigestTime: '08:00',
      clientCheckinEnabled: true, clientCheckinFrequencyDays: 2,
      overdueAlertEnabled: true, noActivityDealThreshold: 7, clientNotContactedThreshold: 14,
    },
    pipelineStages: (row.pipelineStages || []).map((s: any) => ({
      id: s.id, nameEn: s.nameEn, color: s.color, order: s.order, type: s.type,
    })),
    taskSettings: row.taskSettings || {
      defaultDueTime: '17:00', autoRollover: true, rolloverTime: '00:00', defaultPriority: 'medium',
    },
    dropdowns: row.dropdowns || {
      industries: ['Hospitality', 'Real Estate', 'Education', 'Healthcare', 'Retail', 'Government', 'Corporate Office', 'Other'],
      lostReasons: ['Price too high', 'Chose competitor', 'Project postponed', 'No response', 'Other'],
      departments: ['Sales', 'Design', 'Execution', 'Administration'],
    },
  };
}

function settingsToDbRow(settings: Partial<AppSettings>): Record<string, any> {
  const out: Record<string, any> = {};
  if (settings.appName !== undefined) out.app_name = settings.appName;
  if (settings.companyName !== undefined) out.company_name = settings.companyName;
  if (settings.companyLogo !== undefined) out.company_logo = settings.companyLogo;
  if (settings.language !== undefined) out.language = settings.language;
  if (settings.currency !== undefined) out.currency = settings.currency;
  if (settings.dateFormat !== undefined) out.date_format = settings.dateFormat;
  if (settings.theme !== undefined) out.theme = settings.theme;
  if (settings.accentColor !== undefined) out.accent_color = settings.accentColor;
  if (settings.compactMode !== undefined) out.compact_mode = settings.compactMode;
  if (settings.visibleModules !== undefined) out.visible_modules = settings.visibleModules;
  if (settings.dashboardWidgets !== undefined) out.dashboard_widgets = settings.dashboardWidgets;
  if (settings.profile !== undefined) out.profile = settings.profile;
  if (settings.notifications !== undefined) out.notifications = settings.notifications;
  if (settings.pipelineStages !== undefined) out.pipeline_stages = settings.pipelineStages;
  if (settings.taskSettings !== undefined) out.task_settings = settings.taskSettings;
  if (settings.dropdowns !== undefined) out.dropdowns = settings.dropdowns;
  out.updated_at = new Date().toISOString();
  return out;
}

/* ── Bulk operations ────────────────────────────────────────── */

export async function clearAllTasks(): Promise<void> {
  const { error } = await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

export async function clearAllDeals(): Promise<void> {
  const { error } = await supabase.from('deals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

export async function clearAllClients(): Promise<void> {
  // Contacts, deals, projects cascade from clients. Tasks with linked_client_id need manual cleanup.
  const { error: taskErr } = await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (taskErr) throw taskErr;
  const { error } = await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

export async function resetToDefaults(): Promise<void> {
  await clearAllClients();
  const { error: actErr } = await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (actErr) throw actErr;
  const { error: teamErr } = await supabase.from('team_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (teamErr) throw teamErr;
  // Reset settings to defaults
  const { error } = await supabase.from('app_settings').update({
    app_name: 'Impact Furniture CRM',
    company_name: 'Impact Furniture',
    company_logo: null,
    language: 'en',
    currency: 'EGP',
    date_format: 'DD/MM/YYYY',
    theme: 'dark',
    accent_color: 'blue',
    compact_mode: false,
    visible_modules: ['clients', 'contacts', 'pipeline', 'projects', 'tasks', 'team'],
    dashboard_widgets: ['todayTasks', 'inactiveDeals', 'behindProjects', 'inactiveClients', 'pipelineSummary', 'recentActivity'],
    profile: { name: '', email: '', phone: '', role: '', photo: '' },
    notifications: {
      dailyDigestEnabled: true, dailyDigestTime: '08:00',
      clientCheckinEnabled: true, clientCheckinFrequencyDays: 2,
      overdueAlertEnabled: true, noActivityDealThreshold: 7, clientNotContactedThreshold: 14,
    },
    pipeline_stages: [
      { id: 'lead', nameEn: 'Lead', color: '#64748b', order: 0, type: 'normal' },
      { id: 'qualified', nameEn: 'Qualified', color: '#3b82f6', order: 1, type: 'normal' },
      { id: 'meeting', nameEn: 'Meeting', color: '#8b5cf6', order: 2, type: 'normal' },
      { id: 'sitevisit', nameEn: 'Site Visit', color: '#06b6d4', order: 3, type: 'normal' },
      { id: 'proposal', nameEn: 'Proposal Sent', color: '#f59e0b', order: 4, type: 'normal' },
      { id: 'negotiation', nameEn: 'Negotiation', color: '#f97316', order: 5, type: 'normal' },
      { id: 'sosent', nameEn: 'SO Sent', color: '#ec4899', order: 6, type: 'normal' },
      { id: 'production', nameEn: 'Production', color: '#a78bfa', order: 7, type: 'normal' },
      { id: 'handovering', nameEn: 'Handovering', color: '#34d399', order: 8, type: 'normal' },
      { id: 'payment', nameEn: 'Payment', color: '#22c55e', order: 9, type: 'normal' },
      { id: 'lost', nameEn: 'Lost', color: '#ef4444', order: 10, type: 'lost' },
    ],
    task_settings: { defaultDueTime: '17:00', autoRollover: true, rolloverTime: '00:00', defaultPriority: 'medium' },
    dropdowns: {
      industries: ['Hospitality', 'Real Estate', 'Education', 'Healthcare', 'Retail', 'Government', 'Corporate Office', 'Other'],
      lostReasons: ['Price too high', 'Chose competitor', 'Project postponed', 'No response', 'Other'],
      departments: ['Sales', 'Design', 'Execution', 'Administration'],
    },
  }).eq('id', 1);
  if (error) throw error;
}
