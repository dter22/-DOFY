import React, { useState, useEffect } from 'react';
import {
  Crown,
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  Check,
  KeyRound,
  Trash2,
  Power,
  RefreshCw,
  Download,
  Upload,
  Sparkles,
  Lock,
  Mail,
  User,
  ChevronDown,
  Info,
  Plus,
  Edit,
  Gavel,
  Sliders,
  Palette,
  Star,
  Flame,
  Edit3,
  Eye,
  CheckSquare,
  Square,
  Clock,
  Send,
  UserCheck,
  UserX,
  BadgeAlert,
} from 'lucide-react';
import { AuthorizedUser, UserRole, CustomRole, RolePermissions, ActivationRequest } from '../types';
import {
  getMasterPasscode,
  setMasterPasscode,
  updateUserRole,
  updateUserAccountDetails,
  toggleUserStatus,
  removeUserAccount,
  exportUsersDatabase,
  importUsersDatabase,
  loadCustomRoles,
  saveCustomRoles,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  getRoleById,
  loadActivationRequests,
  saveActivationRequests,
  approveActivationRequest,
  rejectActivationRequest,
  deleteActivationRequest,
  addOrPromoteByUserCode,
  resetUsersToOwnerOnly,
  OWNER_EMAIL,
} from '../utils/auth';

interface OwnerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AuthorizedUser[];
  onRefreshUsers: () => void;
  currentUser: AuthorizedUser | null;
  onNotify: (msg: string) => void;
}

const COLOR_PRESETS = [
  '#f97316', // Orange
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#71717a', // Zinc
];

const BADGE_ICONS = [
  { id: 'Shield', label: 'درع', icon: Shield },
  { id: 'Gavel', label: 'مطرقة/باند', icon: Gavel },
  { id: 'Crown', label: 'تاج', icon: Crown },
  { id: 'Star', label: 'نجمة', icon: Star },
  { id: 'Flame', label: 'شعلة', icon: Flame },
  { id: 'Edit3', label: 'قلم', icon: Edit3 },
  { id: 'Eye', label: 'عين', icon: Eye },
];

export const OwnerDashboardModal: React.FC<OwnerDashboardModalProps> = ({
  isOpen,
  onClose,
  users,
  onRefreshUsers,
  currentUser,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'add_by_code' | 'users' | 'roles' | 'backup_code' | 'export_import'>('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | string>('all');

  // Requests state
  const [requests, setRequests] = useState<ActivationRequest[]>([]);
  const [selectedReqRole, setSelectedReqRole] = useState<{ [reqId: string]: string }>({});

  // Custom Roles state
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() => loadCustomRoles());
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Role Form State
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [roleColor, setRoleColor] = useState('#f97316');
  const [roleIcon, setRoleIcon] = useState('Shield');
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({
    canEditViolations: true,
    canEditCategories: false,
    canManageStaff: false,
    canUseCalculator: true,
    canExportDiscord: false,
    canManageUsers: false,
  });

  // Direct Add by User Code State
  const [targetCode, setTargetCode] = useState('');
  const [targetName, setTargetName] = useState('');
  const [targetAge, setTargetAge] = useState('');
  const [targetRole, setTargetRole] = useState('editor');

  // Master Passcode
  const [currentPasscode, setCurrentPasscodeState] = useState(getMasterPasscode());
  const [newPasscode, setNewPasscode] = useState('');
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Edit User State
  const [editingUser, setEditingUser] = useState<AuthorizedUser | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserUsername, setEditUserUsername] = useState('');
  const [editUserAge, setEditUserAge] = useState('');
  const [editUserCode, setEditUserCode] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState('viewer');
  const [editUserActive, setEditUserActive] = useState(true);

  // Backup Import/Export
  const [importJsonText, setImportJsonText] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refreshRequests = () => {
    const loaded = loadActivationRequests();
    setRequests(loaded);
  };

  useEffect(() => {
    if (isOpen) {
      refreshRequests();
      setCustomRoles(loadCustomRoles());
      setCurrentPasscodeState(getMasterPasscode());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;

  const refreshRolesList = () => {
    const loaded = loadCustomRoles();
    setCustomRoles(loaded);
  };

  // --- EDIT USER HANDLERS ---
  const handleOpenEditUser = (u: AuthorizedUser) => {
    setEditingUser(u);
    setEditUserName(u.name);
    setEditUserUsername(u.username || '');
    setEditUserAge(u.age ? String(u.age) : '');
    setEditUserCode(u.userCode || '');
    setEditUserEmail(u.email);
    setEditUserRole(u.customRoleId || u.role);
    setEditUserActive(u.isActive !== false);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const res = updateUserAccountDetails(editingUser.id, {
      name: editUserName,
      username: editUserUsername,
      age: editUserAge,
      userCode: editUserCode,
      email: editUserEmail,
      role: editUserRole,
      isActive: editUserActive,
    });
    if (res.success) {
      onRefreshUsers();
      setEditingUser(null);
      onNotify('تم تحديث بيانات وحساب المستخدم بنجاح');
      setFeedback({ type: 'success', text: `تم تحديث بيانات الحساب (${editUserName || editUserEmail}) بنجاح!` });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  // --- REQUESTS HANDLERS ---
  const handleUpdateRequestRole = (req: ActivationRequest, newRoleId: string) => {
    const allRequests = loadActivationRequests();
    const foundReq = allRequests.find((r) => r.id === req.id);
    if (foundReq) {
      foundReq.assignedRole = newRoleId;
      foundReq.status = 'approved';
      foundReq.reviewedBy = 'Dofy';
      foundReq.reviewedAt = new Date().toISOString();
      saveActivationRequests(allRequests);
    }

    // Promote / update user directly
    addOrPromoteByUserCode(req.userCode, newRoleId, {
      name: req.name,
      age: req.age ? String(req.age) : undefined,
    });

    refreshRequests();
    onRefreshUsers();
    const roleObj = getRoleById(newRoleId);
    const msg = `تم تعديل رتبة (${req.name}) إلى [${roleObj.name}] بنجاح!`;
    setFeedback({ type: 'success', text: msg });
    onNotify(msg);
  };

  const handleApproveRequest = (req: ActivationRequest) => {
    const roleToAssign = selectedReqRole[req.id] || customRoles.find(r => r.name === req.requestedRole)?.id || 'editor';
    const res = approveActivationRequest(req.id, roleToAssign, 'Dofy');
    if (res.success) {
      refreshRequests();
      onRefreshUsers();
      onNotify(res.message);
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleRejectRequest = (reqId: string) => {
    rejectActivationRequest(reqId, 'Dofy');
    refreshRequests();
    onNotify('تم رفض طلب التفعيل');
    setFeedback({ type: 'success', text: 'تم رفض الطلب بنجاح.' });
  };

  const handleDeleteRequest = (reqId: string) => {
    deleteActivationRequest(reqId);
    refreshRequests();
  };

  const handleResetAllUsersToOwner = () => {
    if (
      window.confirm(
        'هل أنت متأكد من رغبتك في إزالة جميع الحسابات والرتب الإدارية وتصفير القائمة (مع الاحتفاظ بحسابك الأساسي Dofy فقط)؟\nستتمكن بعد ذلك من إعطاء الرتب لكل شخص بنفسك عبر النظام الجديد.'
      )
    ) {
      resetUsersToOwnerOnly();
      onRefreshUsers();
      const msg = 'تم تصفير وإزالة جميع الإداريين بنجاح! لم يتبق سوى حساب المالك Dofy.';
      setFeedback({ type: 'success', text: msg });
      onNotify(msg);
    }
  };

  // --- ADD/PROMOTE BY USER CODE ---
  const handlePromoteByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCode.trim()) {
      setFeedback({ type: 'error', text: 'يرجى إدخال كود العضو الخاص (مثال: MS-8492) أو اسم المستخدم.' });
      return;
    }

    try {
      const res = addOrPromoteByUserCode(targetCode.trim(), targetRole, {
        name: targetName.trim() || undefined,
        age: targetAge.trim() || undefined,
      });

      if (res.success) {
        onRefreshUsers();
        refreshRequests();
        setFeedback({ type: 'success', text: res.message });
        onNotify(res.message);
        setTargetCode('');
        setTargetName('');
        setTargetAge('');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل تعيين الرتبة' });
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.userCode && u.userCode.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (roleFilter === 'all') return true;
    if (roleFilter === 'inactive') return !u.isActive;
    return (u.customRoleId || u.role) === roleFilter;
  });

  // --- ROLE MANAGEMENT HANDLERS ---
  const handleOpenCreateRole = () => {
    setEditingRoleId(null);
    setRoleName('');
    setRoleDesc('');
    setRoleColor('#f97316');
    setRoleIcon('Shield');
    setRolePermissions({
      canEditViolations: true,
      canEditCategories: false,
      canManageStaff: false,
      canUseCalculator: true,
      canExportDiscord: false,
      canManageUsers: false,
    });
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: CustomRole) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleDesc(role.description || '');
    setRoleColor(role.color || '#f97316');
    setRoleIcon(role.badgeIcon || 'Shield');
    setRolePermissions({ ...role.permissions });
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setFeedback({ type: 'error', text: 'يرجى إدخال اسم الرتبة/الرول.' });
      return;
    }

    if (editingRoleId) {
      const success = updateCustomRole(editingRoleId, {
        name: roleName.trim(),
        description: roleDesc.trim(),
        color: roleColor,
        badgeIcon: roleIcon,
        permissions: rolePermissions,
      });
      if (success) {
        refreshRolesList();
        onRefreshUsers();
        setIsRoleModalOpen(false);
        const msg = `تم تحديث بيانات وصلاحيات رول [${roleName}] بنجاح!`;
        setFeedback({ type: 'success', text: msg });
        onNotify(msg);
      }
    } else {
      createCustomRole({
        name: roleName.trim(),
        description: roleDesc.trim(),
        color: roleColor,
        badgeIcon: roleIcon,
        permissions: rolePermissions,
      });
      refreshRolesList();
      setIsRoleModalOpen(false);
      const msg = `تم إنشاء رول [${roleName}] الجديد بنجاح!`;
      setFeedback({ type: 'success', text: msg });
      onNotify(msg);
    }
  };

  const handleDeleteRole = (role: CustomRole) => {
    if (role.isSystem || role.id === 'owner') {
      alert('لا يمكن حذف الرتب الأساسية للنظام.');
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف رول [${role.name}]؟ سيتم تحويل الأعضاء التابعين له إلى رتبة محرر جداول.`)) {
      deleteCustomRole(role.id);
      refreshRolesList();
      onRefreshUsers();
      const msg = `تم حذف رول [${role.name}] بنجاح.`;
      setFeedback({ type: 'success', text: msg });
      onNotify(msg);
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    const success = updateUserRole(userId, newRole as UserRole);
    if (success) {
      onRefreshUsers();
      const updatedUser = users.find((u) => u.id === userId);
      const roleObj = getRoleById(newRole);
      const msg = `تم تعيين رول (${roleObj.name}) للمستخدم (${updatedUser?.name || 'المشرف'}) بنجاح.`;
      setFeedback({ type: 'success', text: msg });
      onNotify(msg);
    } else {
      setFeedback({ type: 'error', text: 'لا يمكن تغيير صلاحية المالك الأساسي.' });
    }
  };

  const handleToggleStatus = (userId: string) => {
    const success = toggleUserStatus(userId);
    if (success) {
      onRefreshUsers();
      setFeedback({ type: 'success', text: 'تم تحديث حالة الحساب بنجاح.' });
    }
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف حساب (${name}) نهائياً وسحب كامل صلاحياته؟`)) {
      const success = removeUserAccount(userId);
      if (success) {
        onRefreshUsers();
        const msg = `تم حذف حساب ${name} بنجاح.`;
        setFeedback({ type: 'success', text: msg });
        onNotify(msg);
      }
    }
  };

  const handleUpdateMasterCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasscode.trim()) {
      setFeedback({ type: 'error', text: 'يرجى إدخال الكود الجديد.' });
      return;
    }
    const success = setMasterPasscode(newPasscode);
    if (success) {
      setCurrentPasscodeState(getMasterPasscode());
      setNewPasscode('');
      const msg = 'تم تحديث كود التفعيل السري بنجاح!';
      setFeedback({ type: 'success', text: msg });
      onNotify(msg);
    }
  };

  const handleCopyPasscode = () => {
    navigator.clipboard.writeText(currentPasscode);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2000);
  };

  const handleCopyUserCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(code);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleExportJSON = () => {
    const data = exportUsersDatabase();
    navigator.clipboard.writeText(data);
    setFeedback({ type: 'success', text: 'تم نسخ نص قاعدة البيانات بالكامل إلى الحافظة بنجاح!' });
  };

  const handleImportJSON = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) {
      setFeedback({ type: 'error', text: 'يرجى لصق نص الـ JSON لاستعادته.' });
      return;
    }
    const res = importUsersDatabase(importJsonText.trim());
    if (res.success) {
      onRefreshUsers();
      setFeedback({ type: 'success', text: res.message });
      setImportJsonText('');
      onNotify(res.message);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const renderIconComponent = (iconName?: string, className?: string) => {
    switch (iconName) {
      case 'Crown':
        return <Crown className={className || 'w-4 h-4'} />;
      case 'Gavel':
        return <Gavel className={className || 'w-4 h-4'} />;
      case 'Star':
        return <Star className={className || 'w-4 h-4'} />;
      case 'Flame':
        return <Flame className={className || 'w-4 h-4'} />;
      case 'Edit3':
        return <Edit3 className={className || 'w-4 h-4'} />;
      case 'Eye':
        return <Eye className={className || 'w-4 h-4'} />;
      default:
        return <Shield className={className || 'w-4 h-4'} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-5xl bg-[#090710] border-2 border-orange-500/60 rounded-3xl shadow-[0_0_80px_rgba(249,115,22,0.35)] overflow-hidden flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Header with Luxury Gold/Orange Crown */}
        <div className="px-5 sm:px-6 py-4 border-b border-orange-500/25 bg-gradient-to-r from-orange-950/60 via-[#141022] to-[#090710] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0d0917] rounded-[14px] flex items-center justify-center text-amber-400">
                <Crown className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white font-['Cairo'] tracking-wide">
                  لوحة المالك الخاصة (Dofy)
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 font-black border border-amber-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> تحكم كامل بالرتب والطلبات
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                مراجعة طلبات التفعيل، ترقية الأعضاء بكود العضو، والتحكم بجميع المسجلين
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 sm:px-6 pt-3 pb-1 border-b border-zinc-800/80 bg-[#0c0916] flex gap-1.5 overflow-x-auto no-scrollbar">
          
          {/* TAB 1: REQUESTS */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('requests');
              setFeedback(null);
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shrink-0 relative ${
              activeTab === 'requests'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>طلبات التفعيل والرتب</span>
            {pendingRequestsCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'requests' ? 'bg-black text-orange-400' : 'bg-red-500 text-white animate-pulse'
              }`}>
                {pendingRequestsCount}
              </span>
            )}
          </button>

          {/* TAB 2: ADD / PROMOTE BY USER CODE */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('add_by_code');
              setFeedback(null);
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'add_by_code'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>ترقية بكود العضو الخاص</span>
          </button>

          {/* TAB 3: ALL USERS */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('users');
              setFeedback(null);
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>سجل جميع المسجلين ({users.length})</span>
          </button>

          {/* TAB 4: CUSTOM ROLES */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('roles');
              setFeedback(null);
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'roles'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-300" />
            <span>تخصيص الرتب ({customRoles.length})</span>
          </button>

          {/* TAB 5: MASTER PASSCODE */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('backup_code');
              setFeedback(null);
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'backup_code'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>كود التفعيل السري</span>
          </button>

          {/* TAB 6: BACKUP & RESTORE */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('export_import');
              setFeedback(null);
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'export_import'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>نسخ واستعادة</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-5 sm:mx-6 mt-3 p-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 border shadow-lg animate-fadeIn ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/15 border-red-500/40 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span className="flex-1 leading-relaxed">{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100 px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          
          {/* ================= TAB 1: ACTIVATION REQUESTS ================= */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <span>طلبات التفعيل والانضمام للإدارة</span>
                    <span className="text-xs font-bold text-zinc-400">
                      ({requests.length} طلب إجمالي)
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    أي شخص يدخل كود التفعيل أو يطلب رتبة يظهر طلبه هنا مع كافة بياناته للموافقة المباشرة
                  </p>
                </div>
                <button
                  type="button"
                  onClick={refreshRequests}
                  className="px-3 py-1.5 rounded-xl bg-[#141022] hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تحديث الطلبات</span>
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="p-10 text-center bg-[#120f1f] border border-zinc-800 rounded-3xl text-zinc-400 space-y-2">
                  <Send className="w-10 h-10 text-zinc-600 mx-auto" />
                  <p className="text-sm font-bold text-zinc-300">لا توجد طلبات تفعيل حالياً</p>
                  <p className="text-xs text-zinc-500">
                    عندما يقوم أي عضو بإرسال كود التفعيل من زر "كود التفعيل" في شريط الموقع، سيظهر طلبه هنا فوراً.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {requests.map((req) => {
                    const isPending = req.status === 'pending';
                    const isApproved = req.status === 'approved';

                    return (
                      <div
                        key={req.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isPending
                            ? 'bg-[#151024] border-orange-500/50 shadow-[0_0_25px_rgba(249,115,22,0.15)]'
                            : isApproved
                            ? 'bg-[#0f1712] border-emerald-500/40 opacity-80'
                            : 'bg-[#1a0f12] border-red-500/30 opacity-70'
                        }`}
                      >
                        {/* Request Info */}
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="text-sm sm:text-base font-black text-white">
                              {req.name}
                            </span>

                            {req.discordTag && (
                              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                                @{req.discordTag}
                              </span>
                            )}

                            {req.age && (
                              <span className="text-xs px-2 py-0.5 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 font-bold">
                                العمر: {req.age} سنة
                              </span>
                            )}

                            {/* Status Badge */}
                            {isPending ? (
                              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1 animate-pulse">
                                <Clock className="w-3 h-3" /> بانتظار موافقتك
                              </span>
                            ) : isApproved ? (
                              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1">
                                <Check className="w-3 h-3" /> تمت الموافقة ({req.assignedRole ? (getRoleById(req.assignedRole)?.name || req.assignedRole) : 'محرر جداول'})
                              </span>
                            ) : (
                              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/40 flex items-center gap-1">
                                <X className="w-3 h-3" /> تم الرفض
                              </span>
                            )}
                          </div>

                          {/* Member Code and Requested Role */}
                          <div className="flex items-center gap-3 text-xs text-zinc-300 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-400">كود العضو:</span>
                              <span className="font-mono font-bold text-orange-400 px-2 py-0.5 rounded bg-black/50 border border-orange-500/30">
                                {req.userCode}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyUserCode(req.userCode)}
                                className="p-1 text-zinc-400 hover:text-white"
                                title="نسخ كود العضو"
                              >
                                {copiedCodeId === req.userCode ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>

                            <div className="text-zinc-300">
                              الرتبة المكتوبة في الطلب: <strong className="text-amber-300 px-2 py-0.5 rounded bg-black/40 border border-amber-500/30">{req.requestedRole || 'لم يحدد'}</strong>
                            </div>

                            {req.passcodeUsed && (
                              <div className="text-zinc-400 font-mono text-[11px]">
                                كود التفعيل: <span className="text-emerald-400">{req.passcodeUsed}</span>
                              </div>
                            )}

                            <span className="text-zinc-500 text-[11px]">
                              {new Date(req.submittedAt).toLocaleString('ar-SA')}
                            </span>
                          </div>

                          {req.notes && (
                            <p className="text-xs text-zinc-400 bg-black/40 p-2 rounded-xl border border-zinc-800">
                              💬 {req.notes}
                            </p>
                          )}
                        </div>

                        {/* Approval & Role Controls */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                          {isPending && (
                            <>
                              {/* Role Selector */}
                              <div className="relative">
                                <select
                                  value={selectedReqRole[req.id] || customRoles.find(r => r.name === req.requestedRole)?.id || 'editor'}
                                  onChange={(e) =>
                                    setSelectedReqRole({ ...selectedReqRole, [req.id]: e.target.value })
                                  }
                                  className="appearance-none bg-[#1c142c] border border-orange-500/40 focus:border-orange-500 rounded-xl px-3 py-2 pr-3 pl-7 text-xs font-bold text-white outline-none cursor-pointer"
                                >
                                  {customRoles.map((r) => (
                                    <option key={r.id} value={r.id} className="bg-[#120e20] text-white">
                                      تعيين: {r.name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 absolute left-2 top-2.5 pointer-events-none text-zinc-400" />
                              </div>

                              {/* Approve Button */}
                              <button
                                type="button"
                                onClick={() => handleApproveRequest(req)}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs flex items-center gap-1.5 transition shadow-md cursor-pointer"
                              >
                                <UserCheck className="w-4 h-4" />
                                <span>موافقة وترقية</span>
                              </button>

                              {/* Reject Button */}
                              <button
                                type="button"
                                onClick={() => handleRejectRequest(req.id)}
                                className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition cursor-pointer"
                                title="رفض الطلب"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Role Changer for Approved Request */}
                          {isApproved && (
                            <div className="flex items-center gap-1.5 bg-[#120e20] px-2.5 py-1.5 rounded-xl border border-emerald-500/40 shadow-sm">
                              <span className="text-[11px] font-bold text-emerald-300 pl-1 flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                تعديل الرتبة:
                              </span>
                              <div className="relative">
                                <select
                                  value={req.assignedRole || 'editor'}
                                  onChange={(e) => handleUpdateRequestRole(req, e.target.value)}
                                  className="appearance-none bg-[#1c142c] border border-emerald-500/50 focus:border-emerald-400 rounded-lg px-3 py-1.5 pr-3 pl-7 text-xs font-bold text-amber-300 outline-none cursor-pointer hover:border-emerald-400 transition"
                                  title="تغيير رتبة هذا العضو فوراً"
                                >
                                  {customRoles.map((r) => (
                                    <option key={r.id} value={r.id} className="bg-[#120e20] text-white">
                                      {r.name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 absolute left-2 top-2 pointer-events-none text-zinc-400" />
                              </div>
                            </div>
                          )}

                          {/* Re-activate for Rejected Request */}
                          {!isPending && !isApproved && (
                            <div className="flex items-center gap-1.5">
                              <div className="relative">
                                <select
                                  value={selectedReqRole[req.id] || 'editor'}
                                  onChange={(e) =>
                                    setSelectedReqRole({ ...selectedReqRole, [req.id]: e.target.value })
                                  }
                                  className="appearance-none bg-[#1c142c] border border-orange-500/40 focus:border-orange-500 rounded-lg px-2.5 py-1.5 pr-2.5 pl-6 text-xs font-bold text-white outline-none cursor-pointer"
                                >
                                  {customRoles.map((r) => (
                                    <option key={r.id} value={r.id} className="bg-[#120e20] text-white">
                                      {r.name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 absolute left-1.5 top-2 pointer-events-none text-zinc-400" />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleApproveRequest(req)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                                title="الموافقة وتعيين رتبة"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>الموافقة وتعيين</span>
                              </button>
                            </div>
                          )}

                          {/* Delete Request Record */}
                          <button
                            type="button"
                            onClick={() => handleDeleteRequest(req.id)}
                            className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer"
                            title="حذف السجل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: DIRECT ADD / PROMOTE BY USER CODE ================= */}
          {activeTab === 'add_by_code' && (
            <div className="p-5 rounded-3xl bg-[#120f1f] border border-orange-500/30 space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-orange-400" />
                  <span>ترقية وتعيين إداري بواسطة كود العضو الخاص (أسهل وأضمن طريقة)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  اطلب من العضو إعطائك كوده الخاص (المعروض في حسابه أو نافذة التفعيل مثل <code className="text-orange-400">MS-8492</code> أو اسم مستخدمه)، وضعه هنا لترقيته وتعيين رتبته وتعديل بياناته مباشرة!
                </p>
              </div>

              <form onSubmit={handlePromoteByCode} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* User Code or Tag */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-orange-300">
                      كود العضو الخاص (User Code) أو اسم المستخدم: <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={targetCode}
                      onChange={(e) => setTargetCode(e.target.value)}
                      placeholder="مثال: MS-2041 أو sniper_99"
                      dir="ltr"
                      required
                      className="w-full bg-[#181226] border-2 border-orange-500/50 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-mono text-white placeholder-zinc-500 outline-none uppercase"
                    />
                  </div>

                  {/* Name (Optional) */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-300">
                      الاسم الظاهر (اختياري لتحديث اسمه):
                    </label>
                    <input
                      type="text"
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      placeholder="مثال: أحمد الدوسري"
                      className="w-full bg-[#181226] border border-zinc-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none"
                    />
                  </div>

                  {/* Age (Optional) */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-300">
                      العمر (اختياري):
                    </label>
                    <input
                      type="text"
                      value={targetAge}
                      onChange={(e) => setTargetAge(e.target.value)}
                      placeholder="مثال: 22"
                      dir="ltr"
                      className="w-full bg-[#181226] border border-zinc-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none text-left"
                    />
                  </div>

                  {/* Role Selector */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-amber-300">
                      الرتبة والصلاحيات المراد منحها له:
                    </label>
                    <div className="relative">
                      <select
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="w-full appearance-none bg-[#181226] border border-orange-500/40 focus:border-orange-500 rounded-xl px-4 py-2.5 pr-4 pl-10 text-xs sm:text-sm font-bold text-white outline-none cursor-pointer"
                      >
                        {customRoles.map((r) => (
                          <option key={r.id} value={r.id} className="bg-[#120e20] text-white">
                            {r.name} - {r.description}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute left-3 top-3.5 pointer-events-none text-zinc-400" />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 text-black font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(249,115,22,0.45)] transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Crown className="w-4 h-4 stroke-[2.5]" />
                    <span>ترقية العضو وتعيين الرتبة فوراً</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================= TAB 3: ALL REGISTERED USERS ================= */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              
              {/* Actions Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#120f1f] border border-zinc-800/80">
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-orange-400" />
                    <span>إدارة كافة الحسابات والمسجلين</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    يمكنك تعديل أي حساب، تغيير رتبته، تجميده، أو تصفير الإداريين وإعادة توزيع الرتب عبر النظام الجديد.
                  </p>
                </div>
                {users.length > 1 && (
                  <button
                    type="button"
                    onClick={handleResetAllUsersToOwner}
                    className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="حذف جميع الرتب والإداريين وإبقاء المالك الأساسي فقط"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>تصفير الإداريين (إبقاء المالك فقط)</span>
                  </button>
                )}
              </div>

              {/* Search and Filters Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-orange-400 absolute right-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم، كود العضو (MS-..)، البريد، أو اليوزر..."
                    className="w-full bg-[#120f1f] border border-zinc-800 focus:border-orange-500 rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute left-3 top-2.5 text-xs text-zinc-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Pills with dynamic roles */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setRoleFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      roleFilter === 'all'
                        ? 'bg-orange-500 text-black font-black'
                        : 'bg-[#141022] border border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    الكل ({users.length})
                  </button>
                  {customRoles.map((r) => {
                    const count = users.filter((u) => (u.customRoleId || u.role) === r.id).length;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setRoleFilter(r.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                          roleFilter === r.id
                            ? 'bg-orange-500 text-black font-black'
                            : 'bg-[#141022] border border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {r.name} ({count})
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setRoleFilter('inactive')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      roleFilter === 'inactive'
                        ? 'bg-red-500 text-white font-black'
                        : 'bg-[#141022] border border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    معطل ({users.filter((u) => !u.isActive).length})
                  </button>
                </div>
              </div>

              {/* Users List Container */}
              <div className="space-y-2.5">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center bg-[#120f1f] border border-zinc-800 rounded-2xl text-zinc-400">
                    <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-sm font-bold">لا يوجد مستخدمين مطابقين للبحث</p>
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isOwnerAccount = u.email.toLowerCase() === OWNER_EMAIL.toLowerCase() || u.role === 'owner';
                    const userRoleObj = getRoleById(u.customRoleId || u.role);

                    return (
                      <div
                        key={u.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                          isOwnerAccount
                            ? 'bg-gradient-to-r from-amber-950/30 via-[#141022] to-[#0d0a14] border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                            : u.isActive
                            ? 'bg-[#120f1f] border-zinc-800/90 hover:border-orange-500/40'
                            : 'bg-red-950/20 border-red-900/40 opacity-75'
                        }`}
                      >
                        {/* User Identity Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 border"
                            style={{
                              backgroundColor: isOwnerAccount ? '#f59e0b20' : `${userRoleObj.color}20`,
                              borderColor: isOwnerAccount ? '#f59e0b80' : `${userRoleObj.color}60`,
                              color: isOwnerAccount ? '#fbbf24' : userRoleObj.color,
                            }}
                          >
                            {isOwnerAccount ? (
                              <Crown className="w-5 h-5" />
                            ) : (
                              renderIconComponent(userRoleObj.badgeIcon, 'w-5 h-5')
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-white truncate">
                                {u.name}
                              </span>

                              {u.userCode && (
                                <span className="text-[11px] px-2 py-0.5 rounded bg-black/60 text-orange-400 font-mono font-bold border border-orange-500/30">
                                  {u.userCode}
                                </span>
                              )}

                              {u.age && (
                                <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                                  {u.age} سنة
                                </span>
                              )}

                              {isOwnerAccount ? (
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black border border-amber-500/40 flex items-center gap-1">
                                  <Crown className="w-3 h-3 text-amber-400" />
                                  المالك الأساسي
                                </span>
                              ) : (
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full font-black border flex items-center gap-1"
                                  style={{
                                    backgroundColor: `${userRoleObj.color}15`,
                                    borderColor: `${userRoleObj.color}40`,
                                    color: userRoleObj.color,
                                  }}
                                >
                                  {renderIconComponent(userRoleObj.badgeIcon, 'w-3 h-3')}
                                  {userRoleObj.name}
                                </span>
                              )}

                              {!u.isActive && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/40">
                                  حساب معطل
                                </span>
                              )}
                            </div>

                            {/* Details: Username, Added By */}
                            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap font-mono">
                              {u.username && (
                                <span className="text-zinc-300 text-[11px]">
                                  @{u.username}
                                </span>
                              )}
                              <span className="text-zinc-500 text-[11px]" dir="ltr">
                                {u.email}
                              </span>
                              <span className="text-zinc-600 text-[11px]">
                                • الإضافة: {u.addedAt} ({u.addedBy})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions for this user */}
                        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                          {!isOwnerAccount ? (
                            <>
                              {/* 1-Click Role Changer */}
                              <div className="relative">
                                <select
                                  value={u.customRoleId || u.role}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                  className="appearance-none bg-[#181226] border border-orange-500/30 hover:border-orange-500/60 rounded-xl px-3 py-2 pr-3 pl-8 text-xs font-bold text-white outline-none cursor-pointer transition"
                                  title="تغيير الرتبة فوراً"
                                >
                                  {customRoles.map((r) => (
                                    <option key={r.id} value={r.id} className="bg-[#120f1f] text-white">
                                      {r.name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 absolute left-2.5 top-2.5 pointer-events-none opacity-60 text-white" />
                              </div>

                              {/* Edit User Account Details Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(u)}
                                className="p-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/25 border border-orange-500/30 hover:border-orange-500 text-orange-400 transition cursor-pointer"
                                title="تعديل وتخصيص بيانات الحساب بالكامل"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Toggle Active / Disabled */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(u.id)}
                                className={`p-2 rounded-xl border transition cursor-pointer ${
                                  u.isActive
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                    : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-400'
                                }`}
                                title={u.isActive ? 'تجميد الحساب' : 'تفعيل الحساب'}
                              >
                                <Power className="w-4 h-4" />
                              </button>

                              {/* Delete User */}
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500 text-red-400 transition cursor-pointer"
                                title="حذف الحساب نهائياً"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                              حسابك الأساسي
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 4: CUSTOM ROLES MANAGEMENT ================= */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    قائمة وتخصيص الرتب والصلاحيات
                  </h3>
                  <p className="text-xs text-zinc-400">
                    يمكنك إنشاء رتب جديدة وتحديد صلاحيات كل رتبة بدقة وتغيير لونها وشارتها
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreateRole}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-black font-black text-xs flex items-center gap-1.5 transition shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>إنشاء رتبة جديدة</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {customRoles.map((role) => (
                  <div
                    key={role.id}
                    className="p-4 rounded-2xl bg-[#120f1f] border border-zinc-800 hover:border-orange-500/40 transition flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black border"
                            style={{
                              backgroundColor: `${role.color}20`,
                              borderColor: `${role.color}60`,
                              color: role.color,
                            }}
                          >
                            {renderIconComponent(role.badgeIcon, 'w-4 h-4')}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white">{role.name}</h4>
                            <span className="text-[10px] text-zinc-500 font-mono">{role.id}</span>
                          </div>
                        </div>

                        {role.id === 'owner' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            رتبة المالك
                          </span>
                        ) : role.isSystem ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold">
                            رتبة نظام
                          </span>
                        ) : null}
                      </div>

                      {role.description && (
                        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                          {role.description}
                        </p>
                      )}

                      {/* Permissions List */}
                      <div className="mt-3 pt-3 border-t border-zinc-800/80 grid grid-cols-2 gap-1.5 text-[11px]">
                        <span className={role.permissions.canEditViolations ? 'text-emerald-400 font-bold' : 'text-zinc-600 line-through'}>
                          ✓ تعديل المخالفات
                        </span>
                        <span className={role.permissions.canEditCategories ? 'text-emerald-400 font-bold' : 'text-zinc-600 line-through'}>
                          ✓ تعديل الصناديق
                        </span>
                        <span className={role.permissions.canManageStaff ? 'text-emerald-400 font-bold' : 'text-zinc-600 line-through'}>
                          ✓ إدارة الإدارة
                        </span>
                        <span className={role.permissions.canUseCalculator ? 'text-emerald-400 font-bold' : 'text-zinc-600 line-through'}>
                          ✓ حاسبة الباند
                        </span>
                        <span className={role.permissions.canExportDiscord ? 'text-emerald-400 font-bold' : 'text-zinc-600 line-through'}>
                          ✓ تصدير ديسكورد
                        </span>
                        <span className={role.permissions.canManageUsers ? 'text-emerald-400 font-bold' : 'text-zinc-600 line-through'}>
                          ✓ إدارة الصلاحيات
                        </span>
                      </div>
                    </div>

                    {/* Role Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => handleOpenEditRole(role)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-orange-500/20 text-zinc-300 hover:text-orange-400 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل الصلاحيات</span>
                      </button>
                      {!role.isSystem && role.id !== 'owner' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(role)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                          title="حذف الرتبة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 5: MASTER PASSCODE ================= */}
          {activeTab === 'backup_code' && (
            <div className="p-5 rounded-3xl bg-[#120f1f] border border-orange-500/30 space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-orange-400" />
                  <span>كود التفعيل السري العام (Master Passcode)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  يمكنك إعطاء هذا الكود لمن ترغب به ليقوم بإدخاله في زر "كود التفعيل" في الموقع ليحصل على طلب رتبة إدارية معتمدة.
                </p>
              </div>

              {/* Display Current Code */}
              <div className="p-4 rounded-2xl bg-[#181226] border border-orange-500/40 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-bold block">الكود الحالي الفعال:</span>
                  <span className="text-lg font-mono font-black text-orange-400 tracking-wider">
                    {currentPasscode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPasscode}
                  className="px-4 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500 text-orange-300 hover:text-black font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-orange-500/30"
                >
                  {isCopiedCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ الكود</span>
                    </>
                  )}
                </button>
              </div>

              {/* Change Passcode */}
              <form onSubmit={handleUpdateMasterCode} className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-zinc-300">
                  تغيير كود التفعيل السري:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value)}
                    placeholder="اكتب الكود الجديد هنا (مثال: MAJAN-PRO-2026)"
                    className="flex-1 bg-[#181226] border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 outline-none uppercase"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-xs transition cursor-pointer shrink-0"
                  >
                    تحديث الكود
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================= TAB 6: BACKUP & RESTORE ================= */}
          {activeTab === 'export_import' && (
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-[#120f1f] border border-zinc-800 space-y-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-orange-400" />
                  <span>تصدير نسخة احتياطية من جميع المستخدمين</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  انسخ بيانات جميع المشرفين والأعضاء بصيغة JSON لحفظها خارجياً.
                </p>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="px-4 py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500 text-orange-300 hover:text-black font-bold text-xs flex items-center gap-2 transition cursor-pointer border border-orange-500/40"
                >
                  <Copy className="w-4 h-4" />
                  <span>نسخ بيانات المستخدمين كـ JSON</span>
                </button>
              </div>

              <div className="p-5 rounded-3xl bg-[#120f1f] border border-zinc-800 space-y-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-orange-400" />
                  <span>استعادة قاعدة بيانات المستخدمين</span>
                </h3>
                <form onSubmit={handleImportJSON} className="space-y-3">
                  <textarea
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    placeholder="الصق نص الـ JSON هنا..."
                    rows={4}
                    className="w-full bg-[#181226] border border-zinc-700 focus:border-orange-500 rounded-xl p-3 text-xs font-mono text-white outline-none resize-none"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-xs transition cursor-pointer"
                  >
                    استعادة قاعدة البيانات
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* EDIT USER ACCOUNT MODAL */}
      {editingUser && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingUser(null);
          }}
        >
          <div
            className="w-full max-w-lg bg-[#0e0a17] border-2 border-orange-500/60 rounded-3xl shadow-[0_0_60px_rgba(249,115,22,0.3)] overflow-hidden flex flex-col"
            dir="rtl"
          >
            <div className="p-4 sm:p-5 border-b border-orange-500/30 bg-[#140e22] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    تعديل بيانات الحساب
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    تحديث الاسم، اليوزر، العمر، كود العضو، والرتبة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-4 sm:p-5 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Display Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-300">
                    الاسم الظاهر:
                  </label>
                  <input
                    type="text"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full bg-[#181226] border border-zinc-700 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white outline-none"
                    required
                  />
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-300">
                    اسم المستخدم (Username):
                  </label>
                  <input
                    type="text"
                    value={editUserUsername}
                    onChange={(e) => setEditUserUsername(e.target.value)}
                    placeholder="اختياري"
                    className="w-full bg-[#181226] border border-zinc-700 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white outline-none text-left"
                    dir="ltr"
                  />
                </div>

                {/* Age */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-300">
                    العمر:
                  </label>
                  <input
                    type="text"
                    value={editUserAge}
                    onChange={(e) => setEditUserAge(e.target.value)}
                    placeholder="مثال: 22"
                    className="w-full bg-[#181226] border border-zinc-700 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white outline-none text-left"
                    dir="ltr"
                  />
                </div>

                {/* User Code */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-orange-400">
                    كود العضو الخاص:
                  </label>
                  <input
                    type="text"
                    value={editUserCode}
                    onChange={(e) => setEditUserCode(e.target.value)}
                    className="w-full bg-[#181226] border border-orange-500/40 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono text-orange-400 outline-none text-left uppercase"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-300">
                  البريد الإلكتروني:
                </label>
                <input
                  type="email"
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  disabled={editingUser.email.toLowerCase() === OWNER_EMAIL.toLowerCase() || editingUser.role === 'owner'}
                  className="w-full bg-[#181226] border border-zinc-700 focus:border-orange-500 disabled:opacity-50 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white outline-none text-left"
                  dir="ltr"
                  required
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-orange-400">
                  الرتبة والصلاحية:
                </label>
                <div className="relative">
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value)}
                    disabled={editingUser.email.toLowerCase() === OWNER_EMAIL.toLowerCase() || editingUser.role === 'owner'}
                    className="w-full appearance-none bg-[#181226] border border-orange-500/40 focus:border-orange-500 disabled:opacity-50 rounded-xl px-3.5 py-2.5 pr-3.5 pl-8 text-xs sm:text-sm font-bold text-white outline-none cursor-pointer"
                  >
                    {customRoles.map((r) => (
                      <option key={r.id} value={r.id} className="bg-[#120f1f] text-white">
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute left-3 top-3 pointer-events-none text-zinc-400" />
                </div>
              </div>

              {/* Active / Frozen Toggle */}
              {editingUser.email.toLowerCase() !== OWNER_EMAIL.toLowerCase() && editingUser.role !== 'owner' && (
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-300 select-none">
                    <input
                      type="checkbox"
                      checked={editUserActive}
                      onChange={(e) => setEditUserActive(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 bg-[#181226] text-orange-500 focus:ring-orange-400 accent-orange-500 cursor-pointer"
                    />
                    <span>حساب مفعل (إلغاء التحديد يؤدي لتجميد الحساب ومنع الدخول)</span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-black font-black text-xs transition shadow-lg cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CUSTOM ROLE MODAL */}
      {isRoleModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRoleModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg bg-[#0e0a17] border-2 border-orange-500/60 rounded-3xl shadow-[0_0_60px_rgba(249,115,22,0.3)] overflow-hidden flex flex-col"
            dir="rtl"
          >
            <div className="p-4 sm:p-5 border-b border-orange-500/30 bg-[#140e22] flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-black text-white">
                {editingRoleId ? 'تعديل بيانات وصلاحيات الرتبة' : 'إنشاء رتبة/رول جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="p-4 sm:p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-300">اسم الرتبة:</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="مثال: مراقب عام، مسؤول ديسكورد، نائب الإدارة"
                  className="w-full bg-[#181226] border border-zinc-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-300">الوصف والمهام:</label>
                <input
                  type="text"
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder="وصف مختصر لمسؤوليات هذه الرتبة"
                  className="w-full bg-[#181226] border border-zinc-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none"
                />
              </div>

              {/* Color & Icon Picker */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">اللون المميز:</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setRoleColor(c)}
                        className={`w-6 h-6 rounded-full transition cursor-pointer border ${
                          roleColor === c ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-75'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">الأيقونة:</label>
                  <div className="flex items-center gap-1 flex-wrap">
                    {BADGE_ICONS.map((b) => {
                      const IconC = b.icon;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setRoleIcon(b.id)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            roleIcon === b.id
                              ? 'bg-orange-500 text-black border-orange-400'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                          title={b.label}
                        >
                          <IconC className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="block text-xs font-bold text-orange-400">
                  الصلاحيات المفعلة لهذه الرتبة:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[#181226] border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.canEditViolations}
                      onChange={(e) =>
                        setRolePermissions({ ...rolePermissions, canEditViolations: e.target.checked })
                      }
                      className="w-4 h-4 accent-orange-500"
                    />
                    <span className="text-zinc-200">تعديل وإضافة مخالفات الباند</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[#181226] border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.canEditCategories}
                      onChange={(e) =>
                        setRolePermissions({ ...rolePermissions, canEditCategories: e.target.checked })
                      }
                      className="w-4 h-4 accent-orange-500"
                    />
                    <span className="text-zinc-200">إضافة وتعديل الصناديق</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[#181226] border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.canManageStaff}
                      onChange={(e) =>
                        setRolePermissions({ ...rolePermissions, canManageStaff: e.target.checked })
                      }
                      className="w-4 h-4 accent-orange-500"
                    />
                    <span className="text-zinc-200">إدارة قائمة الإدارة والنقاط</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[#181226] border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.canUseCalculator}
                      onChange={(e) =>
                        setRolePermissions({ ...rolePermissions, canUseCalculator: e.target.checked })
                      }
                      className="w-4 h-4 accent-orange-500"
                    />
                    <span className="text-zinc-200">حاسبة الباند وتوليد الأوامر</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[#181226] border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.canExportDiscord}
                      onChange={(e) =>
                        setRolePermissions({ ...rolePermissions, canExportDiscord: e.target.checked })
                      }
                      className="w-4 h-4 accent-orange-500"
                    />
                    <span className="text-zinc-200">تصدير اللائحة لديسكورد</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[#181226] border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.canManageUsers}
                      onChange={(e) =>
                        setRolePermissions({ ...rolePermissions, canManageUsers: e.target.checked })
                      }
                      className="w-4 h-4 accent-orange-500"
                    />
                    <span className="text-zinc-200">إدارة المشرفين والصلاحيات</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-xs transition shadow-lg cursor-pointer"
                >
                  حفظ الرتبة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
