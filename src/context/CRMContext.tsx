import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppData, Client, Contact, Deal, Project, Task, TeamMember, AppSettings, ActivityLog } from '../types';
import {
  fetchClients, createClient, updateClient as dbUpdateClient, deleteClient as dbDeleteClient,
  fetchContacts, createContact, updateContact as dbUpdateContact, deleteContact as dbDeleteContact,
  fetchDeals, createDeal, updateDeal as dbUpdateDeal, deleteDeal as dbDeleteDeal, addDealActivity as dbAddDealActivity,
  fetchProjects, createProject, updateProject as dbUpdateProject, deleteProject as dbDeleteProject,
  fetchTasks, createTask, updateTask as dbUpdateTask, deleteTask as dbDeleteTask, createTaskRollover,
  fetchTeamMembers, createTeamMember, updateTeamMember as dbUpdateTeamMember, deleteTeamMember as dbDeleteTeamMember,
  fetchSettings, updateSettings as dbUpdateSettings,
  fetchActivityLogs, createActivityLog,
  clearAllTasks as dbClearAllTasks, clearAllDeals as dbClearAllDeals, clearAllClients as dbClearAllClients,
  resetToDefaults as dbResetToDefaults,
} from '../lib/db';
import { generateId, todayStr } from '../utils/storage';
import { DEFAULT_SETTINGS } from '../data/mockData';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface CRMContextType {
  data: AppData;
  toasts: Toast[];
  loading: boolean;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  refreshData: () => Promise<void>;
  // Clients
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  // Contacts
  addContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => Promise<Contact>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  // Deals
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'activityLog'>) => Promise<Deal>;
  updateDeal: (id: string, updates: Partial<Deal>) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  addDealActivity: (dealId: string, action: string) => Promise<void>;
  // Projects
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'rolloverHistory'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  rolloverOverdueTasks: () => Promise<void>;
  // Team
  addTeamMember: (member: Omit<TeamMember, 'id' | 'createdAt'>) => Promise<TeamMember>;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;
  // Settings
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  // Activity
  addActivity: (log: Omit<ActivityLog, 'id'>) => Promise<void>;
  // Bulk / Import-Export
  importClients: (clients: Omit<Client, 'id' | 'createdAt'>[]) => Promise<void>;
  importContacts: (contacts: Omit<Contact, 'id' | 'createdAt'>[]) => Promise<void>;
  clearAllTasks: () => Promise<void>;
  clearAllDeals: () => Promise<void>;
  clearAllClients: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  exportData: () => void;
  importBackup: (data: AppData) => void;
}

const CRMContext = createContext<CRMContextType | null>(null);

const DEFAULT_DATA: AppData = {
  clients: [], contacts: [], deals: [], projects: [], tasks: [], team: [], activityLog: [], settings: DEFAULT_SETTINGS,
};

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [clients, contacts, deals, projects, tasks, team, activityLog, settings] = await Promise.all([
        fetchClients(), fetchContacts(), fetchDeals(), fetchProjects(),
        fetchTasks(), fetchTeamMembers(), fetchActivityLogs(), fetchSettings(),
      ]);
      setData({ clients, contacts, deals, projects, tasks, team, activityLog, settings });
    } catch (err: any) {
      addToast(err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addActivity = useCallback(async (log: Omit<ActivityLog, 'id'>) => {
    await createActivityLog(log);
    setData(prev => ({ ...prev, activityLog: [{ ...log, id: generateId() }, ...prev.activityLog].slice(0, 500) }));
  }, []);

  // ── Clients ──────────────────────────────────────────────────
  const addClient = useCallback(async (client: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient = await createClient(client);
    setData(prev => ({ ...prev, clients: [...prev.clients, newClient] }));
    await addActivity({ entityType: 'client', entityId: newClient.id, action: `Client added: ${newClient.nameEn || newClient.nameAr}`, timestamp: new Date().toISOString() });
    return newClient;
  }, [addActivity]);

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    await dbUpdateClient(id, updates);
    setData(prev => ({ ...prev, clients: prev.clients.map(c => c.id === id ? { ...c, ...updates } : c) }));
    await addActivity({ entityType: 'client', entityId: id, action: 'Client updated', timestamp: new Date().toISOString() });
  }, [addActivity]);

  const deleteClient = useCallback(async (id: string) => {
    await dbDeleteClient(id);
    setData(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.id !== id),
      contacts: prev.contacts.filter(c => c.clientId !== id),
      deals: prev.deals.filter(d => d.clientId !== id),
      projects: prev.projects.filter(p => p.clientId !== id),
      tasks: prev.tasks.filter(t => t.linkedClientId !== id),
    }));
  }, []);

  // ── Contacts ──────────────────────────────────────────────────
  const addContact = useCallback(async (contact: Omit<Contact, 'id' | 'createdAt'>) => {
    const c = await createContact(contact);
    setData(prev => ({ ...prev, contacts: [...prev.contacts, c] }));
    await addActivity({ entityType: 'contact', entityId: c.id, action: `Contact added: ${c.fullName}`, timestamp: new Date().toISOString() });
    return c;
  }, [addActivity]);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    await dbUpdateContact(id, updates);
    setData(prev => ({ ...prev, contacts: prev.contacts.map(c => c.id === id ? { ...c, ...updates } : c) }));
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    await dbDeleteContact(id);
    setData(prev => ({ ...prev, contacts: prev.contacts.filter(c => c.id !== id) }));
  }, []);

  // ── Deals ──────────────────────────────────────────────────
  const addDeal = useCallback(async (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'activityLog'>) => {
    const d = await createDeal(deal);
    setData(prev => ({ ...prev, deals: [...prev.deals, d] }));
    await addActivity({ entityType: 'deal', entityId: d.id, action: `Deal added: ${d.name}`, timestamp: new Date().toISOString() });
    return d;
  }, [addActivity]);

  const updateDeal = useCallback(async (id: string, updates: Partial<Deal>) => {
    await dbUpdateDeal(id, updates);
    setData(prev => ({ ...prev, deals: prev.deals.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d) }));
    if (updates.stageId) {
      await addActivity({ entityType: 'deal', entityId: id, action: 'Deal stage changed', timestamp: new Date().toISOString() });
    }
  }, [addActivity]);

  const deleteDeal = useCallback(async (id: string) => {
    await dbDeleteDeal(id);
    setData(prev => ({ ...prev, deals: prev.deals.filter(d => d.id !== id) }));
  }, []);

  const addDealActivity = useCallback(async (dealId: string, action: string) => {
    await dbAddDealActivity(dealId, action);
    const log: ActivityLog = { id: generateId(), entityType: 'deal', entityId: dealId, action, timestamp: new Date().toISOString() };
    setData(prev => ({
      ...prev,
      deals: prev.deals.map(d => d.id === dealId ? { ...d, activityLog: [log, ...d.activityLog], updatedAt: new Date().toISOString() } : d),
    }));
  }, []);

  // ── Projects ──────────────────────────────────────────────────
  const addProject = useCallback(async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const p = await createProject(project);
    setData(prev => ({ ...prev, projects: [...prev.projects, p] }));
    await addActivity({ entityType: 'project', entityId: p.id, action: `Project created: ${p.name}`, timestamp: new Date().toISOString() });
    return p;
  }, [addActivity]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    await dbUpdateProject(id, updates);
    setData(prev => ({ ...prev, projects: prev.projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p) }));
    await addActivity({ entityType: 'project', entityId: id, action: 'Project updated', timestamp: new Date().toISOString() });
  }, [addActivity]);

  const deleteProject = useCallback(async (id: string) => {
    await dbDeleteProject(id);
    setData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
  }, []);

  // ── Tasks ──────────────────────────────────────────────────
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'rolloverHistory'>) => {
    const t = await createTask(task);
    setData(prev => ({ ...prev, tasks: [...prev.tasks, t] }));
    await addActivity({ entityType: 'task', entityId: t.id, action: `Task added: ${t.title}`, timestamp: new Date().toISOString() });
    return t;
  }, [addActivity]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    await dbUpdateTask(id, updates);
    setData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t) }));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await dbDeleteTask(id);
    setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  }, []);

  const rolloverOverdueTasks = useCallback(async () => {
    if (!data.settings.taskSettings.autoRollover) return;
    const today = todayStr();
    const toRoll = data.tasks.filter(t => t.status !== 'done' && t.dueDate < today);
    for (const t of toRoll) {
      const entry = { fromDate: t.dueDate, toDate: today, note: `Rolled over from ${t.dueDate}` };
      await createTaskRollover(t.id, entry);
      await dbUpdateTask(t.id, { dueDate: today });
    }
    if (toRoll.length > 0) {
      await refreshData();
    }
  }, [data.tasks, data.settings.taskSettings.autoRollover, refreshData]);

  // ── Team ──────────────────────────────────────────────────
  const addTeamMember = useCallback(async (member: Omit<TeamMember, 'id' | 'createdAt'>) => {
    const m = await createTeamMember(member);
    setData(prev => ({ ...prev, team: [...prev.team, m] }));
    return m;
  }, []);

  const updateTeamMember = useCallback(async (id: string, updates: Partial<TeamMember>) => {
    await dbUpdateTeamMember(id, updates);
    setData(prev => ({ ...prev, team: prev.team.map(m => m.id === id ? { ...m, ...updates } : m) }));
  }, []);

  const deleteTeamMember = useCallback(async (id: string) => {
    await dbDeleteTeamMember(id);
    setData(prev => ({ ...prev, team: prev.team.filter(m => m.id !== id) }));
  }, []);

  // ── Settings ──────────────────────────────────────────────────
  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    await dbUpdateSettings(updates);
    setData(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }));
  }, []);

  // ── Bulk ──────────────────────────────────────────────────
  const importClients = useCallback(async (clients: Omit<Client, 'id' | 'createdAt'>[]) => {
    for (const c of clients) {
      await createClient(c);
    }
    await refreshData();
    addToast(`Imported ${clients.length} clients`);
  }, [refreshData, addToast]);

  const importContacts = useCallback(async (contacts: Omit<Contact, 'id' | 'createdAt'>[]) => {
    for (const c of contacts) {
      await createContact(c);
    }
    await refreshData();
    addToast(`Imported ${contacts.length} contacts`);
  }, [refreshData, addToast]);

  const clearAllTasks = useCallback(async () => {
    await dbClearAllTasks();
    setData(prev => ({ ...prev, tasks: [] }));
    addToast('All tasks cleared');
  }, [addToast]);

  const clearAllDeals = useCallback(async () => {
    await dbClearAllDeals();
    setData(prev => ({ ...prev, deals: [] }));
    addToast('All deals cleared');
  }, [addToast]);

  const clearAllClients = useCallback(async () => {
    await dbClearAllClients();
    setData(prev => ({ ...prev, clients: [], contacts: [], deals: [], projects: [], tasks: [] }));
    addToast('All data cleared');
  }, [addToast]);

  const resetToDefaults = useCallback(async () => {
    await dbResetToDefaults();
    await refreshData();
    addToast('App reset to defaults');
  }, [refreshData, addToast]);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `impact-crm-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Data exported successfully');
  }, [data, addToast]);

  const importBackup = useCallback((imported: AppData) => {
    // Import backup by inserting all records into Supabase
    (async () => {
      try {
        for (const c of imported.clients) await createClient(c);
        for (const c of imported.contacts) await createContact(c);
        for (const m of imported.team) await createTeamMember(m);
        for (const d of imported.deals) await createDeal(d);
        for (const p of imported.projects) await createProject(p);
        for (const t of imported.tasks) await createTask(t);
        for (const a of imported.activityLog) await createActivityLog(a);
        await dbUpdateSettings(imported.settings);
        await refreshData();
        addToast('Backup imported successfully');
      } catch (err: any) {
        addToast(err.message || 'Import failed', 'error');
      }
    })();
  }, [refreshData, addToast]);

  return (
    <CRMContext.Provider value={{
      data, toasts, loading, addToast, removeToast, refreshData,
      addClient, updateClient, deleteClient,
      addContact, updateContact, deleteContact,
      addDeal, updateDeal, deleteDeal, addDealActivity,
      addProject, updateProject, deleteProject,
      addTask, updateTask, deleteTask, rolloverOverdueTasks,
      addTeamMember, updateTeamMember, deleteTeamMember,
      updateSettings, addActivity,
      importClients, importContacts,
      clearAllTasks, clearAllDeals, clearAllClients,
      resetToDefaults, exportData, importBackup,
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be inside CRMProvider');
  return ctx;
}
