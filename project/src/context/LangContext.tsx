import React, { createContext, useContext, useState } from 'react';
import { Language } from '../types';

const T: Record<string, Record<Language, string>> = {
  // Nav
  'nav.dashboard': { ar: 'الرئيسية', en: 'Dashboard' },
  'nav.clients': { ar: 'العملاء', en: 'Clients' },
  'nav.contacts': { ar: 'جهات الاتصال', en: 'Contacts' },
  'nav.pipeline': { ar: 'المبيعات', en: 'Pipeline' },
  'nav.projects': { ar: 'المشاريع', en: 'Projects' },
  'nav.tasks': { ar: 'التاسكات', en: 'Tasks' },
  'nav.team': { ar: 'الفريق', en: 'Team' },
  'nav.settings': { ar: 'الإعدادات', en: 'Settings' },
  // Common
  'common.add': { ar: 'إضافة', en: 'Add' },
  'common.edit': { ar: 'تعديل', en: 'Edit' },
  'common.delete': { ar: 'حذف', en: 'Delete' },
  'common.save': { ar: 'حفظ', en: 'Save' },
  'common.cancel': { ar: 'إلغاء', en: 'Cancel' },
  'common.confirm': { ar: 'تأكيد', en: 'Confirm' },
  'common.search': { ar: 'بحث...', en: 'Search...' },
  'common.filter': { ar: 'تصفية', en: 'Filter' },
  'common.export': { ar: 'تصدير', en: 'Export' },
  'common.import': { ar: 'استيراد', en: 'Import' },
  'common.name': { ar: 'الاسم', en: 'Name' },
  'common.notes': { ar: 'ملاحظات', en: 'Notes' },
  'common.status': { ar: 'الحالة', en: 'Status' },
  'common.priority': { ar: 'الأولوية', en: 'Priority' },
  'common.dueDate': { ar: 'تاريخ الاستحقاق', en: 'Due Date' },
  'common.assignedTo': { ar: 'مسند إلى', en: 'Assigned To' },
  'common.client': { ar: 'العميل', en: 'Client' },
  'common.project': { ar: 'المشروع', en: 'Project' },
  'common.actions': { ar: 'إجراءات', en: 'Actions' },
  'common.close': { ar: 'إغلاق', en: 'Close' },
  'common.view': { ar: 'عرض', en: 'View' },
  'common.saved': { ar: 'تم الحفظ ✓', en: 'Saved ✓' },
  'common.today': { ar: 'اليوم', en: 'Today' },
  'common.overdue': { ar: 'متأخر', en: 'Overdue' },
  'common.table': { ar: 'جدول', en: 'Table' },
  'common.kanban': { ar: 'كانبان', en: 'Kanban' },
  // Priorities
  'priority.low': { ar: 'منخفض', en: 'Low' },
  'priority.medium': { ar: 'متوسط', en: 'Medium' },
  'priority.high': { ar: 'عالي', en: 'High' },
  'priority.urgent': { ar: 'عاجل', en: 'Urgent' },
  // Task statuses
  'taskStatus.todo': { ar: 'للتنفيذ', en: 'To Do' },
  'taskStatus.inprogress': { ar: 'جارٍ', en: 'In Progress' },
  'taskStatus.done': { ar: 'منتهي', en: 'Done' },
  // Project statuses
  'projectStatus.active': { ar: 'نشط', en: 'Active' },
  'projectStatus.onhold': { ar: 'معلق', en: 'On Hold' },
  'projectStatus.completed': { ar: 'مكتمل', en: 'Completed' },
  'projectStatus.cancelled': { ar: 'ملغي', en: 'Cancelled' },
  // Clients
  'clients.title': { ar: 'العملاء', en: 'Clients' },
  'clients.add': { ar: 'إضافة عميل', en: 'Add Client' },
  'clients.nameAr': { ar: 'الاسم بالعربية', en: 'Name (Arabic)' },
  'clients.nameEn': { ar: 'الاسم بالإنجليزية', en: 'Name (English)' },
  'clients.industry': { ar: 'القطاع', en: 'Industry' },
  'clients.tier': { ar: 'الدرجة', en: 'Tier' },
  'clients.address': { ar: 'العنوان', en: 'Address' },
  // Deals
  'deals.title': { ar: 'المبيعات', en: 'Pipeline' },
  'deals.add': { ar: 'إضافة صفقة', en: 'Add Deal' },
  'deals.value': { ar: 'القيمة', en: 'Value' },
  'deals.stage': { ar: 'المرحلة', en: 'Stage' },
  'deals.probability': { ar: 'الاحتمالية', en: 'Probability' },
  'deals.closeDate': { ar: 'تاريخ الإغلاق', en: 'Close Date' },
  // Tasks
  'tasks.title': { ar: 'التاسكات', en: 'Tasks' },
  'tasks.add': { ar: 'إضافة مهمة', en: 'Add Task' },
  'tasks.myToday': { ar: 'مهامي اليوم', en: "My Tasks Today" },
  'tasks.rolledOver': { ar: 'انتقلت من', en: 'Rolled over from' },
  // Quick capture
  'quickCapture.title': { ar: 'مهمة سريعة', en: 'Quick Task' },
  'quickCapture.placeholder': { ar: 'عنوان المهمة...', en: 'Task title...' },
  // Dashboard
  'dashboard.todayTasks': { ar: 'مهام اليوم', en: "Today's Tasks" },
  'dashboard.overdueTasks': { ar: 'المهام المتأخرة', en: 'Overdue Tasks' },
  'dashboard.inactiveDeals': { ar: 'صفقات بدون نشاط', en: 'Inactive Deals' },
  'dashboard.behindProjects': { ar: 'مشاريع متأخرة', en: 'Behind Schedule' },
  'dashboard.inactiveClients': { ar: 'عملاء لم يُتواصل معهم', en: 'Unchecked Clients' },
  'dashboard.pipelineSummary': { ar: 'ملخص المبيعات', en: 'Pipeline Summary' },
  'dashboard.recentActivity': { ar: 'آخر الأنشطة', en: 'Recent Activity' },
};

interface LangContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const LangContext = createContext<LangContextType | null>(null);

export function LangProvider({ children, initialLang }: { children: React.ReactNode; initialLang: Language }) {
  const [lang, setLangState] = useState<Language>(initialLang);

  const setLang = (l: Language) => setLangState(l);

  const t = (key: string): string => {
    return T[key]?.[lang] ?? key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t, dir: lang === 'ar' ? 'rtl' : 'ltr' }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be inside LangProvider');
  return ctx;
}
