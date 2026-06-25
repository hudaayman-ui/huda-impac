import { AppData, AppSettings } from '../types';

export const DEFAULT_PIPELINE_STAGES = [
  { id: 'lead',        nameEn: 'Lead',         color: '#64748b', order: 0,  type: 'normal' as const },
  { id: 'qualified',   nameEn: 'Qualified',    color: '#3b82f6', order: 1,  type: 'normal' as const },
  { id: 'meeting',     nameEn: 'Meeting',      color: '#8b5cf6', order: 2,  type: 'normal' as const },
  { id: 'sitevisit',   nameEn: 'Site Visit',   color: '#06b6d4', order: 3,  type: 'normal' as const },
  { id: 'proposal',    nameEn: 'Proposal Sent',color: '#f59e0b', order: 4,  type: 'normal' as const },
  { id: 'negotiation', nameEn: 'Negotiation',  color: '#f97316', order: 5,  type: 'normal' as const },
  { id: 'sosent',      nameEn: 'SO Sent',      color: '#ec4899', order: 6,  type: 'normal' as const },
  { id: 'production',  nameEn: 'Production',   color: '#a78bfa', order: 7,  type: 'normal' as const },
  { id: 'handovering', nameEn: 'Handovering',  color: '#34d399', order: 8,  type: 'normal' as const },
  { id: 'payment',     nameEn: 'Payment',      color: '#22c55e', order: 9,  type: 'normal' as const },
  { id: 'lost',        nameEn: 'Lost',         color: '#ef4444', order: 10, type: 'lost'   as const },
];

export const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Impact Furniture CRM',
  companyName: 'Impact Furniture',
  language: 'en',
  currency: 'EGP',
  dateFormat: 'DD/MM/YYYY',
  theme: 'dark',
  accentColor: 'blue',
  compactMode: false,
  visibleModules: ['dashboard', 'clients', 'contacts', 'pipeline', 'projects', 'tasks', 'team'],
  dashboardWidgets: ['todayTasks', 'inactiveDeals', 'behindProjects', 'inactiveClients', 'pipelineSummary', 'recentActivity'],
  profile: {
    name: '',
    email: '',
    phone: '',
    role: '',
    photo: '',
  },
  notifications: {
    dailyDigestEnabled: true,
    dailyDigestTime: '08:00',
    clientCheckinEnabled: true,
    clientCheckinFrequencyDays: 2,
    overdueAlertEnabled: true,
    noActivityDealThreshold: 7,
    clientNotContactedThreshold: 14,
  },
  pipelineStages: DEFAULT_PIPELINE_STAGES,
  taskSettings: {
    defaultDueTime: '17:00',
    autoRollover: true,
    rolloverTime: '00:00',
    defaultPriority: 'medium',
  },
  dropdowns: {
    industries: [
      'Hospitality', 'Real Estate', 'Education', 'Healthcare',
      'Retail', 'Government', 'Corporate Office', 'Other'
    ],
    lostReasons: ['Price too high', 'Chose competitor', 'Project postponed', 'No response', 'Other'],
    departments: ['Sales', 'Design', 'Execution', 'Administration'],
  },
};

// Empty data — app starts fresh with no pre-filled records
export const MOCK_DATA: Omit<AppData, 'settings'> = {
  clients: [],
  contacts: [],
  deals: [],
  projects: [],
  tasks: [],
  team: [],
  activityLog: [],
};
