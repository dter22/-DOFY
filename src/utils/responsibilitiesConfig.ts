// Responsibilities & Teams System Configuration (المسؤوليات وفرق العمل الإدارية)
import { DepartmentApplication, DepartmentSettings } from '../types';
import { syncWithServer } from './auth';

export interface ResponsibilityRole {
  id: string;
  name: string; // e.g. 'Censorship Team' (Member), 'Censorship Supervisor', 'Censorship Manager'
  type: 'member' | 'supervisor' | 'manager' | 'custom';
  labelArabic: string; // 'عضو' | 'المشرف' | 'القائد' | 'مخصص'
}

export interface ResponsibilityItem {
  id: string;
  name: string; // e.g. 'Censorship Team' (فريق الرقابة)
  color: string; // e.g. '#EF4444' (Red)
  description?: string;
  roles: ResponsibilityRole[];
  createdAt?: string;
}

export const DEFAULT_RESPONSIBILITIES: ResponsibilityItem[] = [
  {
    id: 'resp-censorship',
    name: 'Censorship Team',
    color: '#EF4444', // Red
    description: 'فريق الرقابة والتفتيش الإداري (قسم خاص ومغلق)',
    roles: [
      {
        id: 'role-censorship-member',
        name: 'Censorship Team',
        type: 'member',
        labelArabic: 'عضو',
      },
      {
        id: 'role-censorship-supervisor',
        name: 'Censorship Supervisor',
        type: 'supervisor',
        labelArabic: 'المشرف',
      },
      {
        id: 'role-censorship-manager',
        name: 'Censorship Manager',
        type: 'manager',
        labelArabic: 'القائد',
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'resp-event',
    name: 'Event Team',
    color: '#F59E0B', // Amber / Gold
    description: 'فريق تنظيم وإدارة الفعاليات والأنشطة',
    roles: [
      {
        id: 'role-event-member',
        name: 'Event Team',
        type: 'member',
        labelArabic: 'عضو',
      },
      {
        id: 'role-event-supervisor',
        name: 'Event Supervisor',
        type: 'supervisor',
        labelArabic: 'المشرف',
      },
      {
        id: 'role-event-manager',
        name: 'Event Manager',
        type: 'manager',
        labelArabic: 'القائد',
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'resp-interview',
    name: 'Interview Team',
    color: '#3B82F6', // Blue
    description: 'فريق المقابلات واختبارات القبول الإداري',
    roles: [
      {
        id: 'role-interview-member',
        name: 'Interview Team',
        type: 'member',
        labelArabic: 'عضو',
      },
      {
        id: 'role-interview-supervisor',
        name: 'Interview Supervisor',
        type: 'supervisor',
        labelArabic: 'المشرف',
      },
      {
        id: 'role-interview-manager',
        name: 'Interview Manager',
        type: 'manager',
        labelArabic: 'القائد',
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'resp-ticket',
    name: 'Ticket Team',
    color: '#8B5CF6', // Purple / Violet
    description: 'فريق خدمة التذاكر والدعم الفني',
    roles: [
      {
        id: 'role-ticket-member',
        name: 'Ticket Team',
        type: 'member',
        labelArabic: 'عضو',
      },
      {
        id: 'role-ticket-supervisor',
        name: 'Ticket Supervisor',
        type: 'supervisor',
        labelArabic: 'المشرف',
      },
      {
        id: 'role-ticket-manager',
        name: 'Ticket Manager',
        type: 'manager',
        labelArabic: 'القائد',
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'resp-compensation',
    name: 'Compensation Team',
    color: '#EC4899', // Pink / Rose
    description: 'فريق التعويضات والمراجعة المالية (قسم خاص ومغلق)',
    roles: [
      {
        id: 'role-compensation-member',
        name: 'Compensation Team',
        type: 'member',
        labelArabic: 'عضو',
      },
      {
        id: 'role-compensation-supervisor',
        name: 'Compensation Supervisor',
        type: 'supervisor',
        labelArabic: 'المشرف',
      },
      {
        id: 'role-compensation-manager',
        name: 'Compensation Manager',
        type: 'manager',
        labelArabic: 'القائد',
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const LOCAL_STORAGE_RESPONSIBILITIES_KEY = 'server_custom_responsibilities_v1';
const LOCAL_STORAGE_DEPT_SETTINGS_KEY = 'server_dept_application_settings_v1';
const LOCAL_STORAGE_DEPT_APPLICATIONS_KEY = 'server_department_applications_v1';

/**
 * Checks if a department is strictly excluded from public applications
 * (Censorship Team and Compensation Team)
 */
export function isDepartmentRestrictedFromApplications(departmentNameOrId: string): boolean {
  if (!departmentNameOrId) return false;
  const norm = departmentNameOrId.trim().toLowerCase();
  return (
    norm.includes('censorship') ||
    norm.includes('compensation') ||
    norm.includes('رقابة') ||
    norm.includes('تعويض')
  );
}

export function loadSavedResponsibilities(): ResponsibilityItem[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_RESPONSIBILITIES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading responsibilities from storage:', e);
  }
  return DEFAULT_RESPONSIBILITIES;
}

export function saveResponsibilitiesToStorage(responsibilities: ResponsibilityItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_RESPONSIBILITIES_KEY, JSON.stringify(responsibilities));
  } catch (e) {
    console.error('Error saving responsibilities to storage:', e);
  }
}

// Department Application Settings (Open / Closed status per department)
export function loadDepartmentSettings(): Record<string, DepartmentSettings> {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_DEPT_SETTINGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading department settings:', e);
  }
  // Default: Event Team, Interview Team, Ticket Team open by default, Censorship & Compensation restricted
  return {
    'resp-censorship': { isOpen: false, isRestricted: true, openNote: 'قسم خاص - ترقية داخلية فقط' },
    'Censorship Team': { isOpen: false, isRestricted: true, openNote: 'قسم خاص - ترقية داخلية فقط' },
    'resp-compensation': { isOpen: false, isRestricted: true, openNote: 'قسم خاص - ترقية داخلية فقط' },
    'Compensation Team': { isOpen: false, isRestricted: true, openNote: 'قسم خاص - ترقية داخلية فقط' },
    'resp-event': { isOpen: true, isRestricted: false },
    'Event Team': { isOpen: true, isRestricted: false },
    'resp-interview': { isOpen: true, isRestricted: false },
    'Interview Team': { isOpen: true, isRestricted: false },
    'resp-ticket': { isOpen: true, isRestricted: false },
    'Ticket Team': { isOpen: true, isRestricted: false },
  };
}

export function saveDepartmentSettings(settings: Record<string, DepartmentSettings>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_DEPT_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving department settings:', e);
  }
  syncWithServer('/api/department-settings', 'POST', { settings });
}

// Department Applications (Submitted Applications)
export function loadDepartmentApplications(): DepartmentApplication[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_DEPT_APPLICATIONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading department applications:', e);
  }
  return [];
}

export function saveDepartmentApplications(applications: DepartmentApplication[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_DEPT_APPLICATIONS_KEY, JSON.stringify(applications));
  } catch (e) {
    console.error('Error saving department applications:', e);
  }
  syncWithServer('/api/department-applications', 'POST', { applications });
}
