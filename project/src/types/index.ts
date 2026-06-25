export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light' | 'system';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'inprogress' | 'done';
export type ProjectStatus = 'active' | 'onhold' | 'completed' | 'cancelled';
export type ClientStatus = 'active' | 'not_active' | 'pending' | 'closed' | 'on_hold';

export interface Client {
  id: string;
  nameAr: string;
  nameEn: string;
  industry: string;
  status: ClientStatus;
  addresses: string[];
  brief: string;
  notes: string;
  salesOwner: string;
  createdAt: string;
  lastContactedAt?: string;
}

export interface Contact {
  id: string;
  clientId: string;
  fullName: string;
  jobTitle: string;
  phones: string[];
  email: string;
  notes: string;
  createdAt: string;
}

export interface PipelineStageConfig {
  id: string;
  nameEn: string;
  color: string;
  order: number;
  type: 'normal' | 'lost';
}

export interface ActivityLog {
  id: string;
  entityType: 'deal' | 'project' | 'task' | 'client' | 'contact';
  entityId: string;
  action: string;
  timestamp: string;
  userId?: string;
}

export interface Deal {
  id: string;
  name: string;
  clientId: string;
  stageId: string;
  probability: number;
  expectedCloseDate: string;
  assignedTo: string;
  notes: string;
  activityLog: ActivityLog[];
  createdAt: string;
  updatedAt: string;
  lostReason?: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  status: ProjectStatus;
  startDate: string;
  expectedEndDate: string;
  assignedTeam: string[];
  description: string;
  linkedDealId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RolloverEntry {
  fromDate: string;
  toDate: string;
  note: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  reminderTime?: string;
  assignedTo: string;
  linkedProjectId?: string;
  linkedClientId?: string;
  rolloverHistory: RolloverEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  phones: string[];
  email: string;
  department: string;
  active: boolean;
  createdAt: string;
}

export interface NotificationSettings {
  dailyDigestEnabled: boolean;
  dailyDigestTime: string;
  clientCheckinEnabled: boolean;
  clientCheckinFrequencyDays: number;
  overdueAlertEnabled: boolean;
  noActivityDealThreshold: number;
  clientNotContactedThreshold: number;
}

export interface AppSettings {
  appName: string;
  companyName: string;
  companyLogo?: string;
  language: Language;
  currency: string;
  dateFormat: string;
  theme: Theme;
  accentColor: string;
  compactMode: boolean;
  visibleModules: string[];
  dashboardWidgets: string[];
  profile: {
    name: string;
    email: string;
    phone: string;
    role: string;
    photo?: string;
  };
  notifications: NotificationSettings;
  pipelineStages: PipelineStageConfig[];
  taskSettings: {
    defaultDueTime: string;
    autoRollover: boolean;
    rolloverTime: string;
    defaultPriority: TaskPriority;
  };
  dropdowns: {
    industries: string[];
    lostReasons: string[];
    departments: string[];
  };
}

export interface AppData {
  clients: Client[];
  contacts: Contact[];
  deals: Deal[];
  projects: Project[];
  tasks: Task[];
  team: TeamMember[];
  activityLog: ActivityLog[];
  settings: AppSettings;
}
