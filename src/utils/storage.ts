import { AppData, AppSettings } from '../types';
import { MOCK_DATA, DEFAULT_SETTINGS } from '../data/mockData';

const STORAGE_KEY = 'impact_crm_data';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      // Deep merge settings with defaults to handle schema additions
      parsed.settings = {
        ...DEFAULT_SETTINGS,
        ...parsed.settings,
        notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.settings?.notifications },
        taskSettings: { ...DEFAULT_SETTINGS.taskSettings, ...parsed.settings?.taskSettings },
        dropdowns: { ...DEFAULT_SETTINGS.dropdowns, ...parsed.settings?.dropdowns },
        profile: { ...DEFAULT_SETTINGS.profile, ...parsed.settings?.profile },
        pipelineStages: parsed.settings?.pipelineStages?.length
          ? parsed.settings.pipelineStages
          : DEFAULT_SETTINGS.pipelineStages,
      };
      // Migrate old team members: phone -> phones[]
      if (parsed.team) {
        parsed.team = parsed.team.map((m: any) => ({
          ...m,
          phones: m.phones ?? (m.phone ? [m.phone] : []),
        }));
      }
      // Migrate old clients: remove tier, add new fields
      if (parsed.clients) {
        parsed.clients = parsed.clients.map((c: any) => ({
          ...c,
          status: c.status ?? 'active',
          addresses: c.addresses ?? (c.address ? [c.address] : []),
          brief: c.brief ?? c.notes ?? '',
          salesOwner: c.salesOwner ?? '',
        }));
      }
      return parsed;
    }
  } catch {
    // ignore parse errors, fall through to defaults
  }
  return { ...MOCK_DATA, settings: DEFAULT_SETTINGS };
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveSettings(settings: AppSettings): void {
  const data = loadData();
  data.settings = settings;
  saveData(data);
}

export function getStorageUsage(): string {
  const raw = localStorage.getItem(STORAGE_KEY) || '';
  const bytes = new Blob([raw]).size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function formatDate(dateStr: string, format = 'DD/MM/YYYY'): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return format === 'MM/DD/YYYY' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}

export function isOverdue(dueDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export function isToday(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr);
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.abs(Math.floor((db.getTime() - da.getTime()) / 86400000));
}
