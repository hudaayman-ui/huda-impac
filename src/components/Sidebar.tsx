import React, { useState } from 'react';
import {
  LayoutDashboard, Users, Phone, TrendingUp, FolderOpen,
  CheckSquare, UserCog, Settings, ChevronLeft, ChevronRight,
  Building2, Menu, X
} from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useCRM } from '../context/CRMContext';

export type ActiveView =
  | 'dashboard' | 'clients' | 'client-detail'
  | 'contacts' | 'pipeline' | 'projects'
  | 'tasks' | 'team' | 'settings';

interface SidebarProps {
  active: ActiveView;
  onNavigate: (view: ActiveView) => void;
}

const NAV_ITEMS = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'clients',   icon: Users,           label: 'Clients' },
  { key: 'contacts',  icon: Phone,           label: 'Contacts' },
  { key: 'pipeline',  icon: TrendingUp,      label: 'Pipeline' },
  { key: 'projects',  icon: FolderOpen,      label: 'Projects' },
  { key: 'tasks',     icon: CheckSquare,     label: 'Tasks' },
  { key: 'team',      icon: UserCog,         label: 'Team' },
  { key: 'settings',  icon: Settings,        label: 'Settings' },
] as const;

const ACCENT_COLORS: Record<string, string> = {
  blue:    'bg-blue-600',
  emerald: 'bg-emerald-600',
  rose:    'bg-rose-600',
  amber:   'bg-amber-600',
  cyan:    'bg-cyan-600',
  slate:   'bg-slate-600',
};

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  const { lang, setLang, dir } = useLang();
  const { data } = useCRM();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleModules = data.settings.visibleModules;
  const accentClass = ACCENT_COLORS[data.settings.accentColor] || ACCENT_COLORS.blue;

  const filteredNav = NAV_ITEMS.filter(item =>
    item.key === 'settings' || item.key === 'dashboard' || visibleModules.includes(item.key)
  );

  const navContent = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 border-b border-gray-700/50 ${collapsed ? 'justify-center' : ''}`}>
        <div className={`w-9 h-9 rounded-xl ${accentClass} flex items-center justify-center flex-shrink-0`}>
          <Building2 size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight truncate">{data.settings.appName}</p>
            <p className="text-gray-500 text-xs truncate">{data.settings.companyName}</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {filteredNav.map(({ key, icon: Icon, label }) => {
          const isActive = active === key || (active === 'client-detail' && key === 'clients');
          return (
            <button
              key={key}
              onClick={() => { onNavigate(key as ActiveView); setMobileOpen(false); }}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? `${accentClass} text-white shadow-lg`
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/60'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </div>

      {/* Language + collapse */}
      <div className="p-3 border-t border-gray-700/50 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-700/30">
            <button
              onClick={() => setLang('en')}
              className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${lang === 'en' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >EN</button>
            <button
              onClick={() => setLang('ar')}
              className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${lang === 'ar' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >عربي</button>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-white hover:bg-gray-700/60 transition-colors"
        >
          {collapsed
            ? (dir === 'rtl' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />)
            : (dir === 'rtl' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />)
          }
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-gray-800 rounded-xl text-gray-300 shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} z-50 h-full w-64 sidebar-dark transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full')
        }`}
      >
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>
        {navContent}
      </aside>

      {/* Desktop sidebar — always dark */}
      <aside
        className={`hidden lg:flex flex-col ${collapsed ? 'w-16' : 'w-60'} sidebar-dark h-screen sticky top-0 flex-shrink-0 transition-all duration-300`}
      >
        {navContent}
      </aside>
    </>
  );
}
