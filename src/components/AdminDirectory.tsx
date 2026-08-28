import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  ArrowRight,
  Search,
  Award,
  Trash2,
  Edit,
  User,
  Shield,
  Crown,
  ChevronDown,
  Sparkles,
  Copy,
  Check,
  LayoutGrid,
  List as ListIcon,
  FileSpreadsheet,
  Settings,
  Flame,
  CheckCircle2,
  Medal,
  Palette,
  Edit3,
  Sliders,
  Lock,
  AlertTriangle,
  Briefcase,
  Layers,
  Filter,
} from 'lucide-react';
import { AdminMember, AuthorizedUser } from '../types';
import { AdminMemberModal } from './AdminMemberModal';
import { RankCustomizationModal } from './RankCustomizationModal';
import { ResponsibilityManagementModal } from './ResponsibilityManagementModal';
import { ResponsibilityDropdownMenu } from './ResponsibilityDropdownMenu';
import { RankDropdownMenu } from './RankDropdownMenu';
import {
  getRankColor,
  DEFAULT_RANK_COLORS,
  PresetRankItem,
  DEFAULT_PRESET_RANKS,
  groupRanksByTier,
} from '../utils/ranksConfig';
import {
  ResponsibilityItem,
  DEFAULT_RESPONSIBILITIES,
  loadSavedResponsibilities,
  saveResponsibilitiesToStorage,
} from '../utils/responsibilitiesConfig';
import {
  canActorManageStaffMember,
  removeStaffMemberAndRevokePermissions,
  isOwnerUser,
  getUserAuthorityLevel,
  hasUserPermission,
} from '../utils/auth';

interface AdminDirectoryProps {
  currentUser: AuthorizedUser | null;
  onBackToRules: () => void;
  staffList: AdminMember[];
  onUpdateStaffList: (newList: AdminMember[]) => void;
  rankColors: Record<string, string>;
  onUpdateRankColors: (newColors: Record<string, string>) => void;
  ranksList?: PresetRankItem[];
  onUpdateRanksList?: (newRanks: PresetRankItem[], updatedStaffList?: AdminMember[]) => void;
}

export const AdminDirectory: React.FC<AdminDirectoryProps> = ({
  currentUser,
  onBackToRules,
  staffList,
  onUpdateStaffList,
  rankColors,
  onUpdateRankColors,
  ranksList = DEFAULT_PRESET_RANKS,
  onUpdateRanksList = () => {},
}) => {
  const activeRanks = ranksList && ranksList.length > 0 ? ranksList : DEFAULT_PRESET_RANKS;
  const activeTiers = groupRanksByTier(activeRanks);

  // Responsibilities State (Loaded from localStorage or Default Censorship Team)
  const [responsibilities, setResponsibilities] = useState<ResponsibilityItem[]>(() => {
    return loadSavedResponsibilities();
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRankFilter, setSelectedRankFilter] = useState('all');
  const [selectedRespFilter, setSelectedRespFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'points-desc' | 'points-asc' | 'name' | 'newest'>('points-desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRankCustomizationOpen, setIsRankCustomizationOpen] = useState(false);
  const [isRespManagementOpen, setIsRespManagementOpen] = useState(false);
  const [targetedRankForCustomization, setTargetedRankForCustomization] = useState<string>('Support');
  const [editingAdmin, setEditingAdmin] = useState<AdminMember | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedDiscordSummary, setCopiedDiscordSummary] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if current user has edit permission on staff directory
  // (Management role has canManageStaff: false => read-only access to directory)
  const canManageStaff =
    currentUser !== null &&
    (isOwnerUser(currentUser) ||
      currentUser.customRoleId === 'commander' ||
      currentUser.role === 'commander' ||
      hasUserPermission(currentUser, 'canManageStaff'));

  const handleUpdateResponsibilities = (newList: ResponsibilityItem[]) => {
    setResponsibilities(newList);
    saveResponsibilitiesToStorage(newList);
  };

  // Quick Points Adjustment
  const handleAdjustPoints = (adminId: string, amount: number) => {
    const updated = staffList.map((admin) => {
      if (admin.id === adminId) {
        const newPoints = Math.max(0, (admin.points || 0) + amount);
        return { ...admin, points: newPoints, lastUpdated: new Date().toISOString() };
      }
      return admin;
    });
    onUpdateStaffList(updated);
  };

  // Quick Rank Change
  const handleQuickRankChange = (adminId: string, newRank: string) => {
    const targetStaff = staffList.find((s) => s.id === adminId);
    if (!targetStaff) return;

    const check = canActorManageStaffMember(currentUser, targetStaff, staffList, activeRanks);
    if (!check.allowed) {
      setActionFeedback({ type: 'error', text: check.reason || 'لا يمكنك تغيير رتبة إداري برتبة مساوية أو أعلى منك.' });
      setTimeout(() => setActionFeedback(null), 4000);
      return;
    }

    const dedicatedColor = getRankColor(newRank, rankColors, activeRanks);
    const updated = staffList.map((admin) => {
      if (admin.id === adminId) {
        return {
          ...admin,
          rank: newRank,
          rankColor: dedicatedColor,
          lastUpdated: new Date().toISOString(),
        };
      }
      return admin;
    });
    onUpdateStaffList(updated);
  };

  // Quick Responsibility Change
  const handleQuickResponsibilityChange = (adminId: string, roleName: string, respColor?: string) => {
    const targetStaff = staffList.find((s) => s.id === adminId);
    if (!targetStaff) return;

    const check = canActorManageStaffMember(currentUser, targetStaff, staffList, activeRanks);
    if (!check.allowed) {
      setActionFeedback({ type: 'error', text: check.reason || 'لا يمكنك تعديل مسؤولية هذا الإداري.' });
      setTimeout(() => setActionFeedback(null), 4000);
      return;
    }

    if (!roleName || roleName === 'none') {
      const updated = staffList.map((admin) => {
        if (admin.id === adminId) {
          return {
            ...admin,
            responsibilityId: undefined,
            responsibilityName: undefined,
            responsibilityRole: undefined,
            responsibilityColor: undefined,
            lastUpdated: new Date().toISOString(),
          };
        }
        return admin;
      });
      onUpdateStaffList(updated);
      return;
    }

    // Find which responsibility contains this role
    let foundResp: ResponsibilityItem | undefined;
    for (const resp of responsibilities) {
      if (resp.roles.some((r) => r.name === roleName)) {
        foundResp = resp;
        break;
      }
    }

    const assignedColor = respColor || foundResp?.color || '#EF4444';

    const updated = staffList.map((admin) => {
      if (admin.id === adminId) {
        return {
          ...admin,
          responsibilityId: foundResp?.id,
          responsibilityName: foundResp?.name,
          responsibilityRole: roleName,
          responsibilityRoles: [roleName],
          responsibilityColor: assignedColor,
          responsibilityColors: { [roleName]: assignedColor },
          lastUpdated: new Date().toISOString(),
        };
      }
      return admin;
    });
    onUpdateStaffList(updated);
  };

  // Quick Multi-Responsibility Change Handler
  const handleQuickMultiResponsibilityChange = (
    adminId: string,
    roles: string[],
    colorsMap: Record<string, string>
  ) => {
    const primaryRole = roles[0] || undefined;
    const primaryColor = primaryRole ? colorsMap[primaryRole] || '#EF4444' : undefined;

    // Find if primary role belongs to a known category
    let foundResp: ResponsibilityItem | undefined;
    if (primaryRole) {
      for (const resp of responsibilities) {
        if (resp.roles.some((r) => r.name === primaryRole)) {
          foundResp = resp;
          break;
        }
      }
    }

    const updated = staffList.map((admin) => {
      if (admin.id === adminId) {
        return {
          ...admin,
          responsibilityId: foundResp?.id,
          responsibilityName: foundResp?.name,
          responsibilityRole: primaryRole,
          responsibilityRoles: roles,
          responsibilityColor: primaryColor,
          responsibilityColors: colorsMap,
          lastUpdated: new Date().toISOString(),
        };
      }
      return admin;
    });
    onUpdateStaffList(updated);
  };

  // Delete Admin & Revoke Permissions
  const handleDeleteAdmin = (adminId: string, adminName: string) => {
    const targetStaff = staffList.find((s) => s.id === adminId);
    if (!targetStaff) return;

    const check = canActorManageStaffMember(currentUser, targetStaff, staffList, activeRanks);
    if (!check.allowed) {
      setActionFeedback({
        type: 'error',
        text: check.reason || 'لا تملك الصلاحيات الكافية لحذف هذا الإداري أو سحب رتبته.',
      });
      setTimeout(() => setActionFeedback(null), 4500);
      return;
    }

    if (window.confirm(`هل أنت متأكد من رغبتك في حذف الإداري [${adminName}] وسحب كافة صلاحياته الإدارية نهائياً؟`)) {
      removeStaffMemberAndRevokePermissions(targetStaff, staffList, onUpdateStaffList);
      setActionFeedback({
        type: 'success',
        text: `تم حذف [${adminName}] وإلغاء رتبته وسحب صلاحيات الدخول الإداري بنجاح.`,
      });
      setTimeout(() => setActionFeedback(null), 4500);
    }
  };

  // Save Admin (Add or Edit)
  const handleSaveAdmin = (adminData: AdminMember) => {
    const exists = staffList.some((a) => a.id === adminData.id);
    let updated: AdminMember[];
    if (exists) {
      updated = staffList.map((a) => (a.id === adminData.id ? adminData : a));
    } else {
      updated = [adminData, ...staffList];
    }
    onUpdateStaffList(updated);
    setIsModalOpen(false);
    setEditingAdmin(null);
  };

  // Copy Discord Tag
  const handleCopyTag = (tag: string, id: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy Discord Formatted Staff Summary (For Owner)
  const handleCopyDiscordSummary = () => {
    const lines = [
      '**📋 كشف جدول الإدارة الرسمي — سيرفر Majan State:**',
      '────────────────────────────',
    ];

    // Group by rank
    activeRanks.forEach((r) => {
      const membersInRank = staffList.filter((s) => s.rank === r.name);
      if (membersInRank.length > 0) {
        lines.push(`\n**[ #${r.number} - ${r.name} ]** (${membersInRank.length})`);
        membersInRank.forEach((m) => {
          const respTag = m.responsibilityRole ? ` [🔴 ${m.responsibilityRole}]` : '';
          const tag = m.discordTag ? ` (${m.discordTag})` : '';
          lines.push(`• ${m.name}${tag}${respTag} — ${m.points || 0} نقطة`);
        });
      }
    });

    // Custom ranks
    const customStaff = staffList.filter((s) => !activeRanks.some((r) => r.name === s.rank));
    if (customStaff.length > 0) {
      lines.push('\n**[ رتب إدارية إضافية ]**');
      customStaff.forEach((m) => {
        const respTag = m.responsibilityRole ? ` [🔴 ${m.responsibilityRole}]` : '';
        const tag = m.discordTag ? ` (${m.discordTag})` : '';
        lines.push(`• ${m.name} - [${m.rank}]${tag}${respTag} — ${m.points || 0} نقطة`);
      });
    }

    lines.push('\n────────────────────────────');
    lines.push(`*إجمالي الطاقم: ${staffList.length} إداري*`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedDiscordSummary(true);
    setTimeout(() => setCopiedDiscordSummary(false), 3000);
  };

  // Filtered & Sorted Staff List
  const filteredStaff = useMemo(() => {
    return staffList
      .filter((admin) => {
        const matchesSearch =
          admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (admin.discordTag && admin.discordTag.toLowerCase().includes(searchTerm.toLowerCase())) ||
          admin.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (admin.responsibilityRole && admin.responsibilityRole.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (admin.responsibilityName && admin.responsibilityName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (admin.notes && admin.notes.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRank = selectedRankFilter === 'all' || admin.rank === selectedRankFilter;
        const matchesStatus = selectedStatusFilter === 'all' || admin.status === selectedStatusFilter;
        const matchesResp =
          selectedRespFilter === 'all' ||
          (selectedRespFilter === 'none' && !admin.responsibilityId && !admin.responsibilityRole) ||
          admin.responsibilityId === selectedRespFilter ||
          admin.responsibilityName === selectedRespFilter ||
          admin.responsibilityRole === selectedRespFilter;

        return matchesSearch && matchesRank && matchesStatus && matchesResp;
      })
      .sort((a, b) => {
        if (sortBy === 'points-desc') return (b.points || 0) - (a.points || 0);
        if (sortBy === 'points-asc') return (a.points || 0) - (b.points || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
        if (sortBy === 'newest') return (b.joinDate || '').localeCompare(a.joinDate || '');
        return 0;
      });
  }, [staffList, searchTerm, selectedRankFilter, selectedStatusFilter, selectedRespFilter, sortBy]);

  // Overall Statistics & Top 3 Admins
  const totalStaff = staffList.length;
  const activeCount = staffList.filter((s) => s.status === 'active' || !s.status).length;
  const sortedByPoints = [...staffList].sort((a, b) => (b.points || 0) - (a.points || 0));
  const top1Admin = sortedByPoints[0] || null;
  const top2Admin = sortedByPoints[1] || null;
  const top3Admin = sortedByPoints[2] || null;

  // Status Badge Helper
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'vacation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            في إجازة
          </span>
        );
      case 'busy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            منشغل
          </span>
        );
      case 'trainee':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            قيد التجربة
          </span>
        );
      case 'active':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            متواجد ونشط
          </span>
        );
    }
  };

  // Rank Badge Style
  const getRankBadgeStyle = (rankName: string, customColor?: string) => {
    const color =
      customColor && customColor.startsWith('#')
        ? customColor
        : getRankColor(rankName, rankColors, activeRanks);
    return {
      backgroundColor: `${color}18`,
      borderColor: `${color}88`,
      color: color,
      boxShadow: `0 0 12px ${color}25`,
    };
  };

  return (
    <div className="min-h-screen bg-[#07050e] text-zinc-100 font-sans pb-16 selection:bg-orange-500 selection:text-black" dir="rtl">
      
      {/* Top Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-orange-600/10 via-amber-600/5 to-transparent pointer-events-none blur-3xl z-0" />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#090710]/95 backdrop-blur-xl border-b border-orange-500/30 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Back & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToRules}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#120f1d] hover:bg-orange-500/20 border border-orange-500/40 hover:border-orange-500 text-orange-400 hover:text-orange-300 text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer group"
              title="العودة لجدول القوانين والعقوبات"
            >
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              <span>العودة لجدول العقوبات</span>
            </button>

            <div className="hidden sm:block h-6 w-px bg-zinc-800" />

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 p-0.5 shadow-[0_0_20px_rgba(249,115,22,0.5)] flex items-center justify-center">
                <div className="w-full h-full bg-[#090810] rounded-[10px] flex items-center justify-center text-orange-400">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-white tracking-wide">
                    جدول الإدارة
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[10px] font-black hidden md:inline">
                    سيرفر Majan State
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 hidden sm:block">
                  إدارة أعضاء الإدارة، الرتب الـ 25، وقائمة المسؤوليات (Censorship Team) مع ألوان RGB
                </p>
              </div>
            </div>
          </div>

          {/* Actions: Rank Customizer, Responsibilities Customizer, Discord Export, Add Button */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-end">
            {currentUser && (
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#120f1d] border border-orange-500/30">
                <span className="text-xs text-zinc-400">المشرف:</span>
                <span className="text-xs font-bold text-orange-300 flex items-center gap-1">
                  {currentUser.role === 'owner' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                  {currentUser.name}
                </span>
              </div>
            )}

            {/* Responsibilities Customizer Button */}
            {canManageStaff && (
              <button
                onClick={() => setIsRespManagementOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-red-950/80 to-[#1f1118] hover:from-red-900/60 hover:to-rose-900/50 border border-red-500/50 hover:border-red-400 text-red-300 hover:text-white text-xs font-black transition shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer"
                title="إدارة وتعديل وإضافة أقسام المسؤوليات والفرق الإدارية"
              >
                <Briefcase className="w-4 h-4 text-red-400" />
                <span className="hidden sm:inline">إدارة المسؤوليات والفرق</span>
                <span className="sm:hidden">المسؤوليات</span>
              </button>
            )}

            {/* Rank Customizer (Names & RGB Colors) Button */}
            {canManageStaff && (
              <button
                onClick={() => {
                  setTargetedRankForCustomization(activeRanks[0]?.id || 'rank-1');
                  setIsRankCustomizationOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#1f1936] to-[#251d42] hover:from-orange-500/20 hover:to-amber-500/20 border border-orange-500/50 hover:border-orange-400 text-orange-300 hover:text-white text-xs font-black transition shadow-[0_0_15px_rgba(249,115,22,0.15)] cursor-pointer"
                title="إدارة وإضافة وتعديل وحذف الرتب الإدارية الـ 25 وألوانها (RGB)"
              >
                <Sliders className="w-4 h-4 text-orange-400" />
                <span className="hidden sm:inline">إدارة الرتب (RGB)</span>
                <span className="sm:hidden">الرتب الـ 25</span>
              </button>
            )}

            {/* Discord Export Summary Button (Only for Owner) */}
            {currentUser?.role === 'owner' && staffList.length > 0 && (
              <button
                onClick={handleCopyDiscordSummary}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141120] hover:bg-[#1d1830] border border-orange-500/40 text-orange-300 hover:text-white text-xs font-bold transition cursor-pointer"
                title="نسخ كشف الطاقم للديسكورد (خاص بالمالك فقط)"
              >
                {copiedDiscordSummary ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-black">تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 text-orange-400" />
                    <span>نسخ لديسكورد</span>
                  </>
                )}
              </button>
            )}

            {/* Add Admin Button (Only if canManageStaff) */}
            {canManageStaff ? (
              <button
                onClick={() => {
                  setEditingAdmin(null);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-black font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(249,115,22,0.5)] transition transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>إضافة إداري</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-400 text-xs font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
                <span>مشاهدة فقط (Management)</span>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">

        {/* Action / Hierarchy Alert Banner */}
        {actionFeedback && (
          <div className="mb-6 relative z-30 animate-fadeIn">
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-3 border shadow-lg ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
              }`}
            >
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <p className="text-xs sm:text-sm font-bold flex-1">{actionFeedback.text}</p>
              <button
                type="button"
                onClick={() => setActionFeedback(null)}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-black/30 hover:bg-black/50 transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
        
        {/* Top 4 Summary Cards (Total Staff + Top 3 Admins by Points) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-8">
          
          {/* Card 1: Total Staff Members */}
          <div className="p-4 rounded-2xl bg-[#0e0c17]/90 border border-orange-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.6)] relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400 font-bold">إجمالي الطاقم الإداري</span>
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {totalStaff} <span className="text-xs font-normal text-zinc-400">إداري</span>
              </div>
            </div>
            <div className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between pt-2 border-t border-zinc-800">
              <span>🟢 {activeCount} متواجد ونشط</span>
              <button
                onClick={() => setIsRespManagementOpen(true)}
                className="text-red-400 hover:underline flex items-center gap-1 font-bold text-[10px]"
              >
                <Briefcase className="w-3 h-3" /> {responsibilities.length} مسؤوليات
              </button>
            </div>
          </div>

          {/* Card 2: Top #1 Leaderboard */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1a140a] via-[#100d18] to-[#0e0c17] border-2 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.25)] relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-amber-300 font-black flex items-center gap-1">
                <Crown className="w-4 h-4 text-amber-400" /> المركز الأول 🥇
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-black">
                #1 المتصدر
              </span>
            </div>
            {top1Admin ? (
              <div className="flex items-center gap-3 mt-1">
                <div className="w-12 h-12 rounded-xl ring-2 ring-amber-500/60 bg-[#1c182c] overflow-hidden shrink-0 shadow-md flex items-center justify-center">
                  {top1Admin.avatarUrl ? (
                    <img src={top1Admin.avatarUrl} alt={top1Admin.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-amber-400 font-black text-lg">{top1Admin.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black text-white truncate">{top1Admin.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold border truncate"
                      style={getRankBadgeStyle(top1Admin.rank, top1Admin.rankColor)}
                    >
                      {top1Admin.rank}
                    </span>
                    {top1Admin.responsibilityRole && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold border truncate"
                        style={{
                          backgroundColor: `${top1Admin.responsibilityColor || '#EF4444'}20`,
                          borderColor: `${top1Admin.responsibilityColor || '#EF4444'}80`,
                          color: top1Admin.responsibilityColor || '#EF4444',
                        }}
                      >
                        {top1Admin.responsibilityRole}
                      </span>
                    )}
                    <span className="text-xs font-black text-amber-400">{top1Admin.points || 0} نقطة</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 mt-2 py-3 text-center">لا يوجد بيانات حتى الآن</div>
            )}
          </div>

          {/* Card 3: Top #2 Leaderboard */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#14141c] via-[#100d18] to-[#0e0c17] border border-slate-400/50 shadow-[0_0_25px_rgba(203,213,225,0.15)] relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-300 font-black flex items-center gap-1">
                <Medal className="w-4 h-4 text-slate-300" /> المركز الثاني 🥈
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-500/20 border border-slate-400/40 text-slate-300 text-[10px] font-bold">
                #2 الوصيف
              </span>
            </div>
            {top2Admin ? (
              <div className="flex items-center gap-3 mt-1">
                <div className="w-12 h-12 rounded-xl ring-2 ring-slate-400/50 bg-[#1c182c] overflow-hidden shrink-0 shadow-md flex items-center justify-center">
                  {top2Admin.avatarUrl ? (
                    <img src={top2Admin.avatarUrl} alt={top2Admin.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-300 font-black text-lg">{top2Admin.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black text-white truncate">{top2Admin.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold border truncate"
                      style={getRankBadgeStyle(top2Admin.rank, top2Admin.rankColor)}
                    >
                      {top2Admin.rank}
                    </span>
                    {top2Admin.responsibilityRole && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold border truncate"
                        style={{
                          backgroundColor: `${top2Admin.responsibilityColor || '#EF4444'}20`,
                          borderColor: `${top2Admin.responsibilityColor || '#EF4444'}80`,
                          color: top2Admin.responsibilityColor || '#EF4444',
                        }}
                      >
                        {top2Admin.responsibilityRole}
                      </span>
                    )}
                    <span className="text-xs font-black text-slate-300">{top2Admin.points || 0} نقطة</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 mt-2 py-2 flex items-center justify-center gap-1.5 border border-dashed border-zinc-800 rounded-xl">
                <span>شاغر — لم يتم تعيين إداري بعد</span>
              </div>
            )}
          </div>

          {/* Card 4: Top #3 Leaderboard */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#17110c] via-[#100d18] to-[#0e0c17] border border-amber-700/50 shadow-[0_0_25px_rgba(180,83,9,0.15)] relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-amber-500 font-black flex items-center gap-1">
                <Medal className="w-4 h-4 text-amber-600" /> المركز الثالث 🥉
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-700/20 border border-amber-700/40 text-amber-500 text-[10px] font-bold">
                #3 برونزي
              </span>
            </div>
            {top3Admin ? (
              <div className="flex items-center gap-3 mt-1">
                <div className="w-12 h-12 rounded-xl ring-2 ring-amber-700/50 bg-[#1c182c] overflow-hidden shrink-0 shadow-md flex items-center justify-center">
                  {top3Admin.avatarUrl ? (
                    <img src={top3Admin.avatarUrl} alt={top3Admin.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-amber-500 font-black text-lg">{top3Admin.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black text-white truncate">{top3Admin.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold border truncate"
                      style={getRankBadgeStyle(top3Admin.rank, top3Admin.rankColor)}
                    >
                      {top3Admin.rank}
                    </span>
                    {top3Admin.responsibilityRole && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold border truncate"
                        style={{
                          backgroundColor: `${top3Admin.responsibilityColor || '#EF4444'}20`,
                          borderColor: `${top3Admin.responsibilityColor || '#EF4444'}80`,
                          color: top3Admin.responsibilityColor || '#EF4444',
                        }}
                      >
                        {top3Admin.responsibilityRole}
                      </span>
                    )}
                    <span className="text-xs font-black text-amber-500">{top3Admin.points || 0} نقطة</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 mt-2 py-2 flex items-center justify-center gap-1.5 border border-dashed border-zinc-800 rounded-xl">
                <span>شاغر — لم يتم تعيين إداري بعد</span>
              </div>
            )}
          </div>

        </div>

        {/* Search, Filters, and Controls Toolbar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0d0b16]/90 border border-orange-500/20 shadow-xl mb-6 backdrop-blur-md">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-orange-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بالاسم، الرتبة، المسؤولية (Censorship Team)، يوزر الديسكورد، أو المهام..."
                className="w-full h-11 pr-10 pl-4 rounded-xl bg-[#141120] border border-zinc-700/80 focus:border-orange-500 text-white text-xs sm:text-sm placeholder-zinc-500 outline-none transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                >
                  مسح
                </button>
              )}
            </div>

            {/* Filters and View toggles */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              
              {/* Responsibility Filter */}
              <div className="flex-1 sm:flex-none">
                <select
                  value={selectedRespFilter}
                  onChange={(e) => setSelectedRespFilter(e.target.value)}
                  className="w-full sm:w-auto h-11 px-3 rounded-xl bg-[#141120] border border-red-500/40 focus:border-red-400 text-red-300 text-xs font-bold outline-none transition cursor-pointer"
                >
                  <option value="all">كل المسؤوليات والفرق</option>
                  {responsibilities.map((resp) => (
                    <optgroup key={resp.id} label={resp.name}>
                      <option value={resp.id}>فريق {resp.name} بالكامل</option>
                      {resp.roles.map((rl) => (
                        <option key={rl.id || rl.name} value={rl.name}>
                          • {rl.name} ({rl.labelArabic})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="none">بدون مسؤولية مخصصة</option>
                </select>
              </div>

              {/* Rank Filter */}
              <div className="flex-1 sm:flex-none">
                <select
                  value={selectedRankFilter}
                  onChange={(e) => setSelectedRankFilter(e.target.value)}
                  className="w-full sm:w-auto h-11 px-3 rounded-xl bg-[#141120] border border-zinc-700/80 focus:border-orange-500 text-white text-xs font-semibold outline-none transition cursor-pointer"
                >
                  <option value="all">كل الرتب الإدارية ({activeRanks.length})</option>
                  {activeRanks.map((r) => (
                    <option key={r.id} value={r.name}>
                      #{r.number} - {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex-1 sm:flex-none">
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full sm:w-auto h-11 px-3 rounded-xl bg-[#141120] border border-zinc-700/80 focus:border-orange-500 text-white text-xs font-semibold outline-none transition cursor-pointer"
                >
                  <option value="all">كل الحالات</option>
                  <option value="active">🟢 متواجد ونشط</option>
                  <option value="vacation">🟡 في إجازة</option>
                  <option value="busy">🔴 منشغل</option>
                  <option value="trainee">⚪ قيد التجربة</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex-1 sm:flex-none">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full sm:w-auto h-11 px-3 rounded-xl bg-[#141120] border border-zinc-700/80 focus:border-orange-500 text-white text-xs font-semibold outline-none transition cursor-pointer"
                >
                  <option value="points-desc">النقاط: من الأعلى للأقل</option>
                  <option value="points-asc">النقاط: من الأقل للأعلى</option>
                  <option value="name">أبجدياً بالاسم</option>
                  <option value="newest">تاريخ الانضمام</option>
                </select>
              </div>

              {/* Grid / Table View Switcher */}
              <div className="flex items-center p-1 rounded-xl bg-[#141120] border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-orange-500 text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="عرض جدول الإدارة"
                >
                  <ListIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">جدول الإدارة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-orange-500 text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="عرض البطاقات"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">بطاقات</span>
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* Staff Members Display */}
        {filteredStaff.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#0e0c17]/60 border border-zinc-800 backdrop-blur-md">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">لم يتم العثور على أي إداري</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
              لا يوجد إداريين يطابقون خيارات البحث أو التصفية المحددة
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedRankFilter('all');
                setSelectedRespFilter('all');
                setSelectedStatusFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-bold transition cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW: جدول الإدارة */
          <div className="rounded-3xl bg-[#0c0a15]/95 border-2 border-orange-500/35 overflow-visible shadow-2xl backdrop-blur-md min-h-[750px] flex flex-col">
            
            {/* Table Header Banner */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-[#171226] via-[#120f1f] to-[#0c0a15] border-b border-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <div className="w-full h-full bg-[#0d0a14] rounded-[10px] flex items-center justify-center text-orange-400">
                    <ListIcon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>جدول الإدارة</span>
                    <span className="text-xs px-3 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold">
                      {filteredStaff.length} إداري
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    كشف شامل لجميع الإداريين، الرتب الـ 25، المسؤوليات وفرق العمل، والنقاط
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRespManagementOpen(true)}
                  className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>تعديل المسؤوليات</span>
                </button>
              </div>
            </div>

            {/* Table Data */}
            <div className="overflow-x-auto flex-1 min-h-[600px]">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[#120f1f] border-b border-zinc-800 text-xs font-bold text-zinc-400">
                    <th className="p-4 w-12 text-center">#</th>
                    <th className="p-4">الإداري</th>
                    <th className="p-4">الرتبة الإدارية (RGB)</th>
                    <th className="p-4">المسؤوليات / فرق العمل</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4 text-center">نقاط النشاط</th>
                    <th className="p-4 text-center">تعديل سريع للنقاط</th>
                    <th className="p-4">المهام والملاحظات</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-xs">
                  {filteredStaff.map((admin, idx) => {
                    const badgeStyle = getRankBadgeStyle(admin.rank, admin.rankColor);
                    const isTop3 = sortedByPoints.slice(0, 3).some((top) => top.id === admin.id);
                    const topRankIndex = sortedByPoints.findIndex((top) => top.id === admin.id);

                    const adminRespList =
                      admin.responsibilityRoles && admin.responsibilityRoles.length > 0
                        ? admin.responsibilityRoles
                        : admin.responsibilityRole
                        ? [admin.responsibilityRole]
                        : [];

                    return (
                      <tr key={admin.id} className="hover:bg-[#141122]/70 transition">
                        {/* Index / Rank # */}
                        <td className="p-4 text-center font-bold text-zinc-500">
                          {isTop3 ? (
                            <span title={`المركز #${topRankIndex + 1}`}>
                              {topRankIndex === 0 ? '🥇' : topRankIndex === 1 ? '🥈' : '🥉'}
                            </span>
                          ) : (
                            idx + 1
                          )}
                        </td>

                        {/* Name & Avatar */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl ring-2 bg-[#1c182c] overflow-hidden shrink-0 flex items-center justify-center"
                              style={{ borderColor: `${badgeStyle.color}88` }}
                            >
                              {admin.avatarUrl ? (
                                <img
                                  src={admin.avatarUrl}
                                  alt={admin.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <User className="w-5 h-5 text-zinc-500" />
                              )}
                            </div>
                            <div>
                              <strong className="text-sm font-black text-white block">{admin.name}</strong>
                              {admin.discordTag ? (
                                <button
                                  type="button"
                                  onClick={() => handleCopyTag(admin.discordTag!, admin.id)}
                                  className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-orange-400 font-mono transition"
                                  title="نسخ المعرف"
                                >
                                  <span>{admin.discordTag}</span>
                                  {copiedId === admin.id ? (
                                    <Check className="w-3 h-3 text-green-400" />
                                  ) : (
                                    <Copy className="w-3 h-3 opacity-60" />
                                  )}
                                </button>
                              ) : (
                                <span className="text-[11px] text-zinc-500">بدون معرف</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Rank Badge with Floating RGB RankDropdownMenu */}
                        <td className="p-4">
                          <RankDropdownMenu
                            currentRankName={admin.rank}
                            currentRankColor={admin.rankColor}
                            activeTiers={activeTiers}
                            onSelectRank={(newRank) => handleQuickRankChange(admin.id, newRank)}
                            onCustomizeRank={(rankName) => {
                              setTargetedRankForCustomization(rankName);
                              setIsRankCustomizationOpen(true);
                            }}
                            disabled={!canManageStaff}
                            size="sm"
                          />
                        </td>

                        {/* Multiple Responsibilities Badges with custom RGB Menu */}
                        <td className="p-4">
                          <ResponsibilityDropdownMenu
                            values={adminRespList}
                            value={admin.responsibilityRole || 'none'}
                            responsibilities={responsibilities}
                            onChange={(newRole, newColor) =>
                              handleQuickResponsibilityChange(admin.id, newRole, newColor)
                            }
                            onChangeMulti={(newRoles, colorsMap) =>
                              handleQuickMultiResponsibilityChange(admin.id, newRoles, colorsMap)
                            }
                            disabled={!canManageStaff}
                            size="sm"
                          />
                        </td>

                        {/* Status */}
                        <td className="p-4">{getStatusBadge(admin.status)}</td>

                        {/* Points */}
                        <td className="p-4 text-center">
                          <span className="text-base font-black text-amber-400">
                            {admin.points || 0} <span className="text-[10px] text-zinc-500 font-normal">نقطة</span>
                          </span>
                        </td>

                        {/* Points Controls */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAdjustPoints(admin.id, 1)}
                              className="px-2 py-1 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-400 font-bold cursor-pointer"
                              title="زيادة 1 نقطة"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustPoints(admin.id, 5)}
                              className="px-2 py-1 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 font-black cursor-pointer"
                              title="زيادة 5 نقاط"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustPoints(admin.id, -1)}
                              className="px-2 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 font-bold cursor-pointer"
                              title="خصم 1 نقطة"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustPoints(admin.id, -5)}
                              className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-black cursor-pointer"
                              title="خصم 5 نقاط"
                            >
                              -5
                            </button>
                          </div>
                        </td>

                        {/* Notes */}
                        <td className="p-4 max-w-xs text-zinc-300 truncate font-medium">
                          {admin.notes || '—'}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-center">
                          {(() => {
                            const manageCheck = canActorManageStaffMember(currentUser, admin, staffList, activeRanks);
                            const canManageThis = manageCheck.allowed;
                            return (
                              <div className="flex items-center justify-center gap-1.5">
                                {canManageThis ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingAdmin(admin);
                                        setIsModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-orange-500/20 text-zinc-300 hover:text-orange-400 border border-zinc-700 transition cursor-pointer"
                                      title="تعديل"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 transition cursor-pointer"
                                      title="إزالة وسحب الصلاحيات"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <div
                                    className="p-1.5 rounded-lg bg-zinc-900/80 text-zinc-600 border border-zinc-800/80 flex items-center justify-center cursor-not-allowed"
                                    title={manageCheck.reason || 'لا تملك صلاحيات أعلى من هذا الإداري'}
                                  >
                                    <Lock className="w-3.5 h-3.5 text-zinc-500" />
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredStaff.map((admin) => {
              const badgeStyle = getRankBadgeStyle(admin.rank, admin.rankColor);
              const isTop3 = sortedByPoints.slice(0, 3).some((top) => top.id === admin.id);
              const topRankIndex = sortedByPoints.findIndex((top) => top.id === admin.id);

              return (
                <div
                  key={admin.id}
                  className="rounded-3xl bg-[#0c0a15]/95 border border-zinc-800 hover:border-orange-500/50 shadow-xl hover:shadow-[0_10px_30px_rgba(249,115,22,0.15)] transition-all duration-300 p-5 flex flex-col justify-between group relative overflow-hidden backdrop-blur-md"
                >
                  {/* Subtle top ambient colored border */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 transition-all"
                    style={{ backgroundColor: badgeStyle.color }}
                  />

                  {/* Header Row: Avatar, Name, Status, Medal */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div
                          className="w-13 h-13 rounded-2xl ring-2 bg-[#1c182c] overflow-hidden shrink-0 shadow-md flex items-center justify-center relative"
                          style={{ borderColor: `${badgeStyle.color}88` }}
                        >
                          {admin.avatarUrl ? (
                            <img
                              src={admin.avatarUrl}
                              alt={admin.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <User className="w-6 h-6 text-zinc-500" />
                          )}
                        </div>

                        {/* Name & Discord Tag */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-base font-black text-white truncate">
                              {admin.name}
                            </h3>
                            {isTop3 && (
                              <span title={`المركز #${topRankIndex + 1} بالنقاط`}>
                                {topRankIndex === 0 ? '🥇' : topRankIndex === 1 ? '🥈' : '🥉'}
                              </span>
                            )}
                          </div>
                          
                          {admin.discordTag ? (
                            <button
                              type="button"
                              onClick={() => handleCopyTag(admin.discordTag!, admin.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-orange-400 transition cursor-pointer mt-0.5"
                              title="نسخ معرف الديسكورد"
                            >
                              <span className="truncate">{admin.discordTag}</span>
                              {copiedId === admin.id ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-60" />
                              )}
                            </button>
                          ) : (
                            <span className="text-[11px] text-zinc-500 block">بدون معرف</span>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <div>{getStatusBadge(admin.status)}</div>
                    </div>

                    {/* Rank & Responsibility Badges */}
                    <div className="mb-4 space-y-2 p-2.5 rounded-2xl bg-[#141122] border border-zinc-800/80">
                      
                      {/* Main Rank with RankDropdownMenu */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-zinc-400 font-bold">الرتبة (RGB):</span>
                        <RankDropdownMenu
                          currentRankName={admin.rank}
                          currentRankColor={admin.rankColor}
                          activeTiers={activeTiers}
                          onSelectRank={(newRank) => handleQuickRankChange(admin.id, newRank)}
                          onCustomizeRank={(rankName) => {
                            setTargetedRankForCustomization(rankName);
                            setIsRankCustomizationOpen(true);
                          }}
                          disabled={!canManageStaff}
                          size="sm"
                        />
                      </div>

                      {/* Responsibility Role Dropdown Menu (RGB) */}
                      <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-bold">المسؤوليات (RGB):</span>
                        <ResponsibilityDropdownMenu
                          values={
                            admin.responsibilityRoles && admin.responsibilityRoles.length > 0
                              ? admin.responsibilityRoles
                              : admin.responsibilityRole
                              ? [admin.responsibilityRole]
                              : []
                          }
                          value={admin.responsibilityRole || 'none'}
                          responsibilities={responsibilities}
                          onChange={(newRole, newColor) =>
                            handleQuickResponsibilityChange(admin.id, newRole, newColor)
                          }
                          onChangeMulti={(newRoles, colorsMap) =>
                            handleQuickMultiResponsibilityChange(admin.id, newRoles, colorsMap)
                          }
                          disabled={!canManageStaff}
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* Notes / Duties preview */}
                    {admin.notes && (
                      <div className="mb-4 text-xs text-zinc-400 line-clamp-2 bg-[#090710]/50 p-2.5 rounded-xl border border-zinc-800/50">
                        {admin.notes}
                      </div>
                    )}
                  </div>

                  {/* Points & Actions Footer */}
                  <div className="pt-4 border-t border-zinc-800/80">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-zinc-400 font-bold">نقاط النشاط:</span>
                      <span className="text-lg font-black text-amber-400">
                        {admin.points || 0} <span className="text-xs font-normal text-zinc-500">نقطة</span>
                      </span>
                    </div>

                    {/* Quick Adjust & Controls */}
                    {(() => {
                      const manageCheck = canActorManageStaffMember(currentUser, admin, staffList, activeRanks);
                      const canManageThis = manageCheck.allowed;
                      return (
                        <div className="flex items-center justify-between gap-2">
                          {/* Points Buttons */}
                          {canManageThis ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleAdjustPoints(admin.id, 1)}
                                className="px-2 py-1 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-400 text-xs font-bold transition cursor-pointer"
                                title="زيادة نقطة"
                              >
                                +1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustPoints(admin.id, 5)}
                                className="px-2 py-1 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs font-black transition cursor-pointer"
                                title="زيادة 5 نقاط"
                              >
                                +5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustPoints(admin.id, -1)}
                                className="px-2 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-bold transition cursor-pointer"
                                title="خصم نقطة"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustPoints(admin.id, -5)}
                                className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-black transition cursor-pointer"
                                title="خصم 5 نقاط"
                              >
                                -5
                              </button>
                            </div>
                          ) : (
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1 font-medium bg-zinc-900/60 px-2 py-1 rounded-lg border border-zinc-800/60" title={manageCheck.reason}>
                              <Lock className="w-3 h-3 text-zinc-600" />
                              <span>محمي</span>
                            </div>
                          )}

                          {/* Edit & Delete Action Buttons */}
                          <div className="flex items-center gap-1 mr-1">
                            {canManageThis ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAdmin(admin);
                                    setIsModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-orange-500/20 text-zinc-300 hover:text-orange-400 border border-zinc-700 transition cursor-pointer"
                                  title="تعديل كامل البيانات واللون"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 transition cursor-pointer"
                                  title="إزالة الإداري وسحب الصلاحيات"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <div
                                className="p-1.5 rounded-lg bg-zinc-900/80 text-zinc-600 border border-zinc-800/80 flex items-center justify-center cursor-not-allowed"
                                title={manageCheck.reason || 'لا تملك صلاحيات أعلى من هذا الإداري'}
                              >
                                <Lock className="w-3.5 h-3.5 text-zinc-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Add / Edit Admin Modal */}
      <AdminMemberModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAdmin(null);
        }}
        onSave={handleSaveAdmin}
        editingAdmin={editingAdmin}
        rankColors={rankColors}
        ranksList={activeRanks}
        responsibilities={responsibilities}
        onSaveResponsibilities={handleUpdateResponsibilities}
      />

      {/* Custom Ranks 25 Manager Modal (Names & RGB Colors) */}
      <RankCustomizationModal
        isOpen={isRankCustomizationOpen}
        onClose={() => setIsRankCustomizationOpen(false)}
        ranksList={activeRanks}
        onSaveRanksList={onUpdateRanksList}
        rankColors={rankColors}
        onSaveRankColors={onUpdateRankColors}
        initialRankIdOrName={targetedRankForCustomization}
        staffList={staffList}
      />

      {/* Responsibilities Management Modal */}
      <ResponsibilityManagementModal
        isOpen={isRespManagementOpen}
        onClose={() => setIsRespManagementOpen(false)}
        responsibilities={responsibilities}
        onSaveResponsibilities={handleUpdateResponsibilities}
      />

    </div>
  );
};
