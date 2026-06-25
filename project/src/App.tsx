import React, { useState, useEffect } from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import { LangProvider, useLang } from './context/LangContext';
import Sidebar, { ActiveView } from './components/Sidebar';
import ToastContainer from './components/ToastContainer';
import QuickCapture from './components/QuickCapture';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Contacts from './pages/Contacts';
import Pipeline from './pages/Pipeline';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import Settings from './pages/Settings';
import { Deal } from './types';

function CRMApp() {
  const { data, addProject, addToast } = useCRM();
  const { lang, dir } = useLang();

  // Navigation history stack for back-button support
  const [viewStack, setViewStack] = useState<Array<{ view: ActiveView; clientId?: string }>>([
    { view: 'dashboard' },
  ]);
  const currentNav = viewStack[viewStack.length - 1];
  const view = currentNav.view;
  const selectedClientId = currentNav.clientId ?? null;

  const [wonDeal, setWonDeal] = useState<Deal | null>(null);

  // Apply theme class + RTL/LTR
  useEffect(() => {
    const html = document.documentElement;
    html.dir = dir;
    html.lang = lang;
    if (data.settings.theme === 'light') {
      html.classList.add('light');
    } else {
      html.classList.remove('light');
    }
  }, [dir, lang, data.settings.theme]);

  const pushView = (newView: ActiveView, clientId?: string) => {
    setViewStack(prev => [...prev, { view: newView, clientId }]);
  };

  const handleNavigate = (newView: ActiveView) => {
    // If navigating to same view, just reset to it without growing stack
    setViewStack([{ view: 'dashboard' }, ...(newView !== 'dashboard' ? [{ view: newView }] : [])]);
  };

  const handleBack = () => {
    if (viewStack.length > 1) {
      setViewStack(prev => prev.slice(0, -1));
    }
  };

  const handleViewClient = (id: string) => {
    pushView('client-detail', id);
  };

  const handleDealWon = (deal: Deal) => {
    setWonDeal(deal);
  };

  const handleCreateProject = () => {
    if (!wonDeal) return;
    addProject({
      name: wonDeal.name,
      clientId: wonDeal.clientId,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      expectedEndDate: wonDeal.expectedCloseDate,
      assignedTeam: wonDeal.assignedTo ? [wonDeal.assignedTo] : [],
      description: wonDeal.notes,
      linkedDealId: wonDeal.id,
    });
    addToast('Project created successfully 🎉');
    setWonDeal(null);
    handleNavigate('projects');
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <Sidebar active={view} onNavigate={handleNavigate} />

      <main
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-base)' }}
      >
        {view === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
        {view === 'clients' && <Clients onViewClient={handleViewClient} />}
        {view === 'client-detail' && selectedClientId && (
          <ClientDetail clientId={selectedClientId} onBack={handleBack} />
        )}
        {view === 'contacts' && <Contacts />}
        {view === 'pipeline' && <Pipeline onDealWon={handleDealWon} />}
        {view === 'projects' && <Projects />}
        {view === 'tasks' && <Tasks />}
        {view === 'team' && <Team />}
        {view === 'settings' && <Settings />}
      </main>

      <QuickCapture />
      <ToastContainer />

      {wonDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="crm-modal rounded-2xl p-6 w-full max-w-sm mx-4 text-center shadow-2xl animate-slide-up">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="crm-text-primary font-bold text-xl mb-2">Deal Moved to Next Stage!</h3>
            <p className="crm-text-secondary text-sm mb-6">{wonDeal.name}</p>
            <p className="crm-text-secondary text-sm mb-6">
              Would you like to create a project for this deal?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setWonDeal(null)}
                className="flex-1 py-3 crm-btn-secondary rounded-xl text-sm font-medium transition-colors"
              >
                Later
              </button>
              <button
                onClick={handleCreateProject}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const savedLang = (() => {
    try {
      const raw = localStorage.getItem('impact_crm_data');
      if (raw) return JSON.parse(raw)?.settings?.language || 'en';
    } catch { }
    return 'en';
  })();

  return (
    <CRMProvider>
      <LangProvider initialLang={savedLang as 'ar' | 'en'}>
        <CRMApp />
      </LangProvider>
    </CRMProvider>
  );
}
