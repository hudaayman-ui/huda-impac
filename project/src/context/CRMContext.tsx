import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppData, Client, Contact, Deal, Project, Task, TeamMember, AppSettings, ActivityLog } from '../types';
import { loadData, saveData, generateId, todayStr } from '../utils/storage';
import { MOCK_DATA as _MOCK, DEFAULT_SETTINGS as _DEF } from '../data/mockData';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface CRMContextType {
  data: AppData;
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  // Clients
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  // Contacts
  addContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => Contact;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  // Deals
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'activityLog'>) => Deal;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  addDealActivity: (dealId: string, action: string) => void;
  // Projects
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'rolloverHistory'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  rolloverOverdueTasks: () => void;
  // Team
  addTeamMember: (member: Omit<TeamMember, 'id' | 'createdAt'>) => TeamMember;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void;
  // Activity
  addActivity: (log: Omit<ActivityLog, 'id'>) => void;
  // Bulk / Import-Export
  importClients: (clients: Omit<Client, 'id' | 'createdAt'>[]) => void;
  importContacts: (contacts: Omit<Contact, 'id' | 'createdAt'>[]) => void;
  clearAllTasks: () => void;
  clearAllDeals: () => void;
  clearAllClients: () => void;
  resetToDefaults: () => void;
  exportData: () => void;
  importBackup: (data: AppData) => void;
}

const CRMContext = createContext<CRMContextType | null>(null);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => { saveData(data); }, [data]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addActivity = useCallback((log: Omit<ActivityLog, 'id'>) => {
    const entry: ActivityLog = { ...log, id: generateId() };
    setData(prev => ({ ...prev, activityLog: [entry, ...prev.activityLog].slice(0, 500) }));
  }, []);

  // ── Clients ──────────────────────────────────────────────────
  const addClient = useCallback((client: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = { ...client, id: generateId(), createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, clients: [...prev.clients, newClient] }));
    addActivity({ entityType: 'client', entityId: newClient.id, action: `Client added: ${newClient.nameEn || newClient.nameAr}`, timestamp: new Date().toISOString() });
    return newClient;
  }, [addActivity]);

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    setData(prev => ({ ...prev, clients: prev.clients.map(c => c.id === id ? { ...c, ...updates } : c) }));
    addActivity({ entityType: 'client', entityId: id, action: 'Client updated', timestamp: new Date().toISOString() });
  }, [addActivity]);

  const deleteClient = useCallback((id: string) => {
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
  const addContact = useCallback((contact: Omit<Contact, 'id' | 'createdAt'>) => {
    const c: Contact = { ...contact, id: generateId(), createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, contacts: [...prev.contacts, c] }));
    addActivity({ entityType: 'contact', entityId: c.id, action: `Contact added: ${c.fullName}`, timestamp: new Date().toISOString() });
    return c;
  }, [addActivity]);

  const updateContact = useCallback((id: string, updates: Partial<Contact>) => {
    setData(prev => ({ ...prev, contacts: prev.contacts.map(c => c.id === id ? { ...c, ...updates } : c) }));
  }, []);

  const deleteContact = useCallback((id: string) => {
    setData(prev => ({ ...prev, contacts: prev.contacts.filter(c => c.id !== id) }));
  }, []);

  // ── Deals ──────────────────────────────────────────────────
  const addDeal = useCallback((deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'activityLog'>) => {
    const now = new Date().toISOString();
    const d: Deal = { ...deal, id: generateId(), activityLog: [], createdAt: now, updatedAt: now };
    setData(prev => ({ ...prev, deals: [...prev.deals, d] }));
    addActivity({ entityType: 'deal', entityId: d.id, action: `Deal added: ${d.name}`, timestamp: now });
    return d;
  }, [addActivity]);

  const updateDeal = useCallback((id: string, updates: Partial<Deal>) => {
    const now = new Date().toISOString();
    setData(prev => ({ ...prev, deals: prev.deals.map(d => d.id === id ? { ...d, ...updates, updatedAt: now } : d) }));
    if (updates.stageId) addActivity({ entityType: 'deal', entityId: id, action: 'Deal stage changed', timestamp: now });
  }, [addActivity]);

  const deleteDeal = useCallback((id: string) => {
    setData(prev => ({ ...prev, deals: prev.deals.filter(d => d.id !== id) }));
  }, []);

  const addDealActivity = useCallback((dealId: string, action: string) => {
    const log: ActivityLog = { id: generateId(), entityType: 'deal', entityId: dealId, action, timestamp: new Date().toISOString() };
    setData(prev => ({
      ...prev,
      deals: prev.deals.map(d => d.id === dealId ? { ...d, activityLog: [log, ...d.activityLog], updatedAt: new Date().toISOString() } : d),
    }));
  }, []);

  // ── Projects ──────────────────────────────────────────────────
  const addProject = useCallback((project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const p: Project = { ...project, id: generateId(), createdAt: now, updatedAt: now };
    setData(prev => ({ ...prev, projects: [...prev.projects, p] }));
    addActivity({ entityType: 'project', entityId: p.id, action: `Project created: ${p.name}`, timestamp: now });
    return p;
  }, [addActivity]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    const now = new Date().toISOString();
    setData(prev => ({ ...prev, projects: prev.projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: now } : p) }));
    addActivity({ entityType: 'project', entityId: id, action: 'Project updated', timestamp: now });
  }, [addActivity]);

  const deleteProject = useCallback((id: string) => {
    setData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
  }, []);

  // ── Tasks ──────────────────────────────────────────────────
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'rolloverHistory'>) => {
    const now = new Date().toISOString();
    const t: Task = { ...task, id: generateId(), rolloverHistory: [], createdAt: now, updatedAt: now };
    setData(prev => ({ ...prev, tasks: [...prev.tasks, t] }));
    addActivity({ entityType: 'task', entityId: t.id, action: `Task added: ${t.title}`, timestamp: now });
    return t;
  }, [addActivity]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    const now = new Date().toISOString();
    setData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: now } : t) }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  }, []);

  const rolloverOverdueTasks = useCallback(() => {
    setData(prev => {
      if (!prev.settings.taskSettings.autoRollover) return prev;
      const today = todayStr();
      return {
        ...prev,
        tasks: prev.tasks.map(t => {
          if (t.status !== 'done' && t.dueDate < today) {
            const entry = { fromDate: t.dueDate, toDate: today, note: `Rolled over from ${t.dueDate}` };
            return { ...t, dueDate: today, rolloverHistory: [...t.rolloverHistory, entry], updatedAt: new Date().toISOString() };
          }
          return t;
        }),
      };
    });
  }, []);

  // ── Team ──────────────────────────────────────────────────
  const addTeamMember = useCallback((member: Omit<TeamMember, 'id' | 'createdAt'>) => {
    const m: TeamMember = { ...member, id: generateId(), createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, team: [...prev.team, m] }));
    return m;
  }, []);

  const updateTeamMember = useCallback((id: string, updates: Partial<TeamMember>) => {
    setData(prev => ({ ...prev, team: prev.team.map(m => m.id === id ? { ...m, ...updates } : m) }));
  }, []);

  const deleteTeamMember = useCallback((id: string) => {
    setData(prev => ({ ...prev, team: prev.team.filter(m => m.id !== id) }));
  }, []);

  // ── Settings ──────────────────────────────────────────────────
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setData(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }));
  }, []);

  // ── Bulk ──────────────────────────────────────────────────
  const importClients = useCallback((clients: Omit<Client, 'id' | 'createdAt'>[]) => {
    const newClients = clients.map(c => ({ ...c, id: generateId(), createdAt: new Date().toISOString() }));
    setData(prev => ({ ...prev, clients: [...prev.clients, ...newClients] }));
    addToast(`Imported ${newClients.length} clients`);
  }, [addToast]);

  const importContacts = useCallback((contacts: Omit<Contact, 'id' | 'createdAt'>[]) => {
    const newContacts = contacts.map(c => ({ ...c, id: generateId(), createdAt: new Date().toISOString() }));
    setData(prev => ({ ...prev, contacts: [...prev.contacts, ...newContacts] }));
    addToast(`Imported ${newContacts.length} contacts`);
  }, [addToast]);

  const clearAllTasks = useCallback(() => {
    setData(prev => ({ ...prev, tasks: [] }));
    addToast('All tasks cleared');
  }, [addToast]);

  const clearAllDeals = useCallback(() => {
    setData(prev => ({ ...prev, deals: [] }));
    addToast('All deals cleared');
  }, [addToast]);

  const clearAllClients = useCallback(() => {
    setData(prev => ({ ...prev, clients: [], contacts: [], deals: [], projects: [], tasks: [] }));
    addToast('All data cleared');
  }, [addToast]);

  const resetToDefaults = useCallback(() => {
    setData({ ..._MOCK, settings: { ..._DEF } } as AppData);
    addToast('App reset to defaults');
  }, [addToast]);

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
    setData(imported);
    addToast('Backup imported successfully');
  }, [addToast]);

  return (
    <CRMContext.Provider value={{
      data, toasts, addToast, removeToast,
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
