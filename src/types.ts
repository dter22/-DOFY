export interface PunishmentTier {
  times: string; // e.g., 'المرة الأولى'
  penalty: string; // e.g., 'باند اسبوع'
  days?: number;
  isPerm?: boolean;
}

export interface ViolationItem {
  id: string;
  name: string;
  englishTerm?: string;
  description?: string;
  warningNote?: string;
}

export interface RuleCategory {
  id: string;
  title: string;
  subtitle?: string;
  isOriginal?: boolean;
  rowGroup: 'row-1' | 'row-2' | 'row-3' | 'row-4' | string;
  iconName?: string;
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  violationsSectionTitle?: string;
  punishmentsSectionTitle?: string;
  isAbsolutePerm?: boolean;
  violations: ViolationItem[];
  punishments: PunishmentTier[];
}

export type SeverityFilter = 'all' | '3days' | 'week' | '2weeks' | 'month' | 'perm';

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer' | string;

export interface RolePermissions {
  canEditViolations: boolean; // تعديل وإضافة وحذف مخالفات الباند والعقوبات
  canEditCategories: boolean; // إضافة وتعديل وحذف الصناديق والفئات
  canManageStaff: boolean; // إدارة قائمة أعضاء الإدارة وتعديل النقاط
  canUseCalculator: boolean; // استخدام وتوليد أوامر حاسبة الباند
  canExportDiscord: boolean; // تصدير اللائحة بصيغة الديسكورد
  canManageUsers: boolean; // إدارة المشرفين والصلاحيات
}

export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  color: string; // e.g. '#f97316', '#3b82f6', '#10b981', '#a855f7', '#eab308'
  badgeIcon?: string; // 'Crown' | 'Shield' | 'Gavel' | 'Star' | 'Flame' | 'Edit3' | 'Eye'
  isSystem?: boolean;
  permissions: RolePermissions;
  createdAt?: string;
}

export interface ActivationRequest {
  id: string;
  name: string;
  discordTag?: string;
  age?: string | number;
  requestedRole?: string;
  passcodeUsed?: string;
  userCode: string;
  userEmail?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  notes?: string;
  assignedRole?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AuthorizedUser {
  id: string;
  email: string;
  username?: string;
  password?: string;
  name: string;
  age?: string | number;
  userCode?: string; // كود العضو الخاص (مثال: MS-8492)
  role: UserRole;
  customRoleId?: string;
  addedAt: string;
  addedBy: string;
  isActive: boolean;
  avatarUrl?: string;
  notes?: string;
  lastLogin?: string;
}

export interface AdminMember {
  id: string;
  name: string;
  discordTag?: string;
  avatarUrl?: string;
  rank: string;
  rankColor?: string;
  points: number;
  status?: 'active' | 'vacation' | 'busy' | 'trainee';
  notes?: string;
  joinDate?: string;
  lastUpdated?: string;
}
