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
} from 'lucide-react';
import { AdminMember, AuthorizedUser } from '../types';
import { AdminMemberModal } from './AdminMemberModal';
import { RankCustomizationModal } from './RankCustomizationModal';
import {
  getRankColor,
  DEFAULT_RANK_COLORS,
  PresetRankItem,
  DEFAULT_PRESET_RANKS,
  groupRanksByTier,
} from '../utils/ranksConfig';
import {
  canActorManageStaffMember,
  removeStaffMemberAndRevokePermissions,
  isOwnerUser,
  getUserAuthorityLevel,
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

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRankFilter, setSelectedRankFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'points-desc' | 'points-asc' | 'name' | 'newest'>('points-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRankCustomizationOpen, setIsRankCustomizationOpen] = useState(false);
  const [targetedRankForCustomization, setTargetedRankForCustomization] = useState<string>('Support');
  const [editingAdmin, setEditingAdmin] = useState<AdminMember | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedDiscordSummary, setCopiedDiscordSummary] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if current user has edit permission (Owner or Authorized supervisors)
  const canManageStaff = currentUser !== null;

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
    setActionFeedback({ type: 'success', text: `تم تغيير رتبة (${targetStaff.name}) إلى [${newRank}] بنجاح!` });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Add / Edit Save Handler
  const handleSaveAdmin = (savedAdmin: AdminMember) => {
    const existingIndex = staffList.findIndex((a) => a.id === savedAdmin.id);
    let updated: AdminMember[];
    if (existingIndex >= 0) {
      updated = [...staffList];
      updated[existingIndex] = savedAdmin;
    } else {
      updated = [savedAdmin, ...staffList];
    }
    onUpdateStaffList(updated);
    setActionFeedback({ type: 'success', text: `تم حفظ بيانات الإداري (${savedAdmin.name}) بنجاح!` });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Delete Handler with Hierarchy Check & Permission Revocation
  const handleDeleteAdmin = (adminId: string, adminName: string) => {
    const targetStaff = staffList.find((s) => s.id === adminId);
    if (!targetStaff) return;

    const check = canActorManageStaffMember(currentUser, targetStaff, staffList, activeRanks);
    if (!check.allowed) {
      setActionFeedback({ type: 'error', text: check.reason || 'لا تملك صلاحيات كافية لإزالة هذا الإداري.' });
      setTimeout(() => setActionFeedback(null), 4000);
      return;
    }

    if (
      window.confirm(
        `هل أنت متأكد من إزالة الإداري (${adminName}) من طاقم الإدارة وسحب كامل صلاحياته الإدارية؟\n\n(ملاحظة: لا يمكن إزالة الإداري إلا من قِبَل المالك الأساسي أو رتبة أعلى منه).`
      )
    ) {
      const res = removeStaffMemberAndRevokePermissions(adminId, currentUser, staffList, activeRanks);
      if (res.success) {
        onUpdateStaffList(res.updatedStaffList);
        setActionFeedback({ type: 'success', text: res.message });
        setTimeout(() => setActionFeedback(null), 4500);
      } else {
        setActionFeedback({ type: 'error', text: res.message });
        setTimeout(() => setActionFeedback(null), 4500);
      }
    }
  };

  // Copy Discord Tag
  const handleCopyTag = (tag: string, id: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Copy Discord Leaderboard Summary
  const handleCopyDiscordSummary = () => {
    if (staffList.length === 0) return;
    let md = `👑 **قائمة طاقم إدارة سيرفر Majan State ونقاط النشاط** 👑\n━━━━━━━━━━━━━━━━━━━━\n`;
    
    // Sort by points desc
    const sorted = [...staffList].sort((a, b) => (b.points || 0) - (a.points || 0));
    
    sorted.forEach((member, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '▫️';
      md += `${medal} **#${idx + 1}** ${member.name} (${member.discordTag || '@staff'}) — **${member.rank}** | ⚡ **${member.points || 0} نقطة**\n`;
    });

    md += `\n━━━━━━━━━━━━━━━━━━━━\n📊 تم التحديث تلقائياً من نظام الإدارة المعتمد`;

    navigator.clipboard.writeText(md);
    setCopiedDiscordSummary(true);
    setTimeout(() => setCopiedDiscordSummary(false), 2000);
  };

  // Get Custom Rank Color Style (Prefers rank-specific color from the 25 ranks system)
  const getRankBadgeStyle = (rankName: string, explicitColor?: string) => {
    const color = (explicitColor && explicitColor.startsWith('#') && explicitColor !== '#F97316')
      ? explicitColor
      : getRankColor(rankName, rankColors, activeRanks);

    return {
      backgroundColor: `${color}20`,
      borderColor: `${color}88`,
      color: color,
      boxShadow: `0 0 12px ${color}30`,
    };
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> متواجد</span>;
      case 'vacation':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-bold">🟡 إجازة</span>;
      case 'busy':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-400 text-[11px] font-bold">🔴 منشغل</span>;
      case 'trainee':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-600/20 border border-zinc-500/40 text-zinc-300 text-[11px] font-bold">⚪ متدرب</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> نشط</span>;
    }
  };

  // Stats calculation: Total Staff and Top 3 Admins in Points
  const totalStaff = staffList.length;
  const activeCount = staffList.filter((a) => !a.status || a.status === 'active').length;

  const sortedByPoints = useMemo(() => {
    return [...staffList].sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [staffList]);

  const top1Admin = sortedByPoints[0] || null;
  const top2Admin = sortedByPoints[1] || null;
  const top3Admin = sortedByPoints[2] || null;

  // Filter and Sort
  const filteredStaff = useMemo(() => {
    return staffList
      .filter((admin) => {
        // Search filter
        if (searchTerm.trim()) {
          const s = searchTerm.toLowerCase().trim();
          const matchName = admin.name?.toLowerCase().includes(s);
          const matchTag = admin.discordTag?.toLowerCase().includes(s);
          const matchRank = admin.rank?.toLowerCase().includes(s);
          const matchNotes = admin.notes?.toLowerCase().includes(s);
          if (!matchName && !matchTag && !matchRank && !matchNotes) return false;
        }

        // Rank filter
        if (selectedRankFilter !== 'all') {
          if (admin.rank !== selectedRankFilter) return false;
        }

        // Status filter
        if (selectedStatusFilter !== 'all') {
          if ((admin.status || 'active') !== selectedStatusFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'points-desc') return (b.points || 0) - (a.points || 0);
        if (sortBy === 'points-asc') return (a.points || 0) - (b.points || 0);
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '', 'ar');
        if (sortBy === 'newest') return (b.joinDate || '').localeCompare(a.joinDate || '');
        return 0;
      });
  }, [staffList, searchTerm, selectedRankFilter, selectedStatusFilter, sortBy]);

  // Unique rank options for filtering
  const allRanks = useMemo(() => {
    const ranksSet = new Set<string>();
    staffList.forEach((a) => {
      if (a.rank) ranksSet.add(a.rank);
    });
    return Array.from(ranksSet);
  }, [staffList]);

  return (
    <div className="min-h-screen bg-[#06050a] text-white font-sans pb-24 selection:bg-orange-500 selection:text-black relative overflow-hidden" dir="rtl">
      
      {/* Ambient background glow mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-[radial-gradient(circle,rgba(249,115,22,0.15)_0%,rgba(249,115,22,0.03)_50%,transparent_75%)] blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[500px] bg-[radial-gradient(circle,rgba(249,115,22,0.08)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute -bottom-20 -left-40 w-[600px] h-[500px] bg-[radial-gradient(circle,rgba(249,115,22,0.08)_0%,transparent_70%)] blur-3xl" />
      </div>

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#090810]/90 backdrop-blur-2xl border-b border-orange-500/25 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3 relative z-10">
          
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
                    قائمة طاقم الإدارة
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[10px] font-black hidden md:inline">
                    سيرفر Majan State
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 hidden sm:block">
                  إدارة أعضاء الإدارة، الرتب الـ 25 مع ألوان RGB المخصصة ونقاط التقييم
                </p>
              </div>
            </div>
          </div>

          {/* Actions: Rank Colors, Discord Export, Add Button */}
          <div className="flex items-center gap-2.5">
            {currentUser && (
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#120f1d] border border-orange-500/30">
                <span className="text-xs text-zinc-400">المشرف:</span>
                <span className="text-xs font-bold text-orange-300 flex items-center gap-1">
                  {currentUser.role === 'owner' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                  {currentUser.name}
                </span>
              </div>
            )}

            {/* Rank Customizer (Names & RGB Colors) Button */}
            <button
              onClick={() => {
                setTargetedRankForCustomization(activeRanks[0]?.id || 'rank-1');
                setIsRankCustomizationOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#1f1936] to-[#251d42] hover:from-orange-500/20 hover:to-amber-500/20 border border-orange-500/50 hover:border-orange-400 text-orange-300 hover:text-white text-xs font-black transition shadow-[0_0_15px_rgba(249,115,22,0.15)] cursor-pointer"
              title="إدارة وإضافة وتعديل وحذف الرتب الإدارية وألوانها (RGB)"
            >
              <Sliders className="w-4 h-4 text-orange-400" />
              <span className="hidden sm:inline">إدارة وتخصيص الرتب (RGB)</span>
              <span className="sm:hidden">إدارة الرتب</span>
            </button>

            {/* Discord Export Summary Button (Only for Owner) */}
            {currentUser?.role === 'owner' && staffList.length > 0 && (
              <button
                onClick={handleCopyDiscordSummary}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141120] hover:bg-[#1d1830] border border-orange-500/40 text-orange-300 hover:text-white text-xs font-bold transition cursor-pointer"
                title="نسخ ملخص الطاقم للديسكورد (خاص بالمالك فقط)"
              >
                {copiedDiscordSummary ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-black">تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 text-orange-400" />
                    <span>نسخ لديسكورد (المالك)</span>
                  </>
                )}
              </button>
            )}

            {/* Add Admin Button */}
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
                onClick={() => setIsRankCustomizationOpen(true)}
                className="text-orange-400 hover:underline flex items-center gap-1 font-bold text-[10px]"
              >
                <Sliders className="w-3 h-3" /> أسماء وألوان الـ 25 رتبة
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
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold border truncate"
                      style={getRankBadgeStyle(top1Admin.rank, top1Admin.rankColor)}
                    >
                      {top1Admin.rank}
                    </span>
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
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold border truncate"
                      style={getRankBadgeStyle(top2Admin.rank, top2Admin.rankColor)}
                    >
                      {top2Admin.rank}
                    </span>
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
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold border truncate"
                      style={getRankBadgeStyle(top3Admin.rank, top3Admin.rankColor)}
                    >
                      {top3Admin.rank}
                    </span>
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
                placeholder="ابحث بالاسم، الرتبة، يوزر الديسكورد، أو الملاحظات..."
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
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-orange-500 text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="عرض الشبكة (بطاقات)"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-orange-500 text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="عرض الجدول المفصل"
                >
                  <ListIcon className="w-4 h-4" />
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
                setSelectedStatusFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-bold transition cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredStaff.map((admin, idx) => {
              const dedicatedColor = getRankColor(admin.rank, rankColors);
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

                    {/* Rank & Quick Rank Selector */}
                    {(() => {
                      const manageCheck = canActorManageStaffMember(currentUser, admin, staffList, activeRanks);
                      const canManageThis = manageCheck.allowed;
                      return (
                        <>
                          <div className="mb-4 flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#141122] border border-zinc-800/80">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetedRankForCustomization(admin.rank);
                                  setIsRankCustomizationOpen(true);
                                }}
                                className="px-3 py-1 rounded-xl text-xs font-black border truncate transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
                                style={badgeStyle}
                                title="انقر لتعديل وتخصيص اسم ولون هذه الرتبة"
                              >
                                <span>{admin.rank}</span>
                                <Edit3 className="w-3 h-3 opacity-70" />
                              </button>
                            </div>

                            {/* Quick Rank Change Dropdown */}
                            <select
                              value={admin.rank}
                              disabled={!canManageThis}
                              onChange={(e) => handleQuickRankChange(admin.id, e.target.value)}
                              className={`text-[11px] font-bold bg-[#0a0812] border rounded-lg px-2 py-1 text-zinc-300 outline-none ${
                                canManageThis
                                  ? 'border-zinc-700 focus:border-orange-500 cursor-pointer'
                                  : 'border-zinc-800/80 opacity-60 cursor-not-allowed'
                              }`}
                              title={canManageThis ? 'تغيير رتبة الإداري مباشرة' : (manageCheck.reason || 'صلاحيات غير كافية')}
                            >
                              {activeTiers.map((tier) => (
                                <optgroup key={tier.id} label={tier.title}>
                                  {tier.ranks.map((r) => (
                                    <option key={r.id} value={r.name}>
                                      #{r.number} - {r.name}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>

                          {/* Notes / Duties if present */}
                          {admin.notes && (
                            <div className="mb-4 p-2.5 rounded-xl bg-[#110e1c] border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                              <strong className="text-zinc-300 block mb-0.5">المهام / الملاحظات:</strong>
                              {admin.notes}
                            </div>
                          )}

                          {/* Points Counter & Control Bar */}
                          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                            {/* Points counter */}
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-400 font-bold">نقاط النشاط:</span>
                                <span className="text-lg font-black text-amber-400 tracking-tight">
                                  {admin.points || 0} <span className="text-[10px] text-zinc-500">نقطة</span>
                                </span>
                              </div>
                            </div>

                            {/* Fast Points Adjust buttons */}
                            {canManageThis ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleAdjustPoints(admin.id, 1)}
                                  className="px-2 py-1 rounded-lg bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-400 text-xs font-bold transition cursor-pointer"
                                  title="إضافة نقطة (+1)"
                                >
                                  +1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustPoints(admin.id, 5)}
                                  className="px-2 py-1 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-300 text-xs font-black transition cursor-pointer"
                                  title="إضافة 5 نقاط (+5)"
                                >
                                  +5
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustPoints(admin.id, -1)}
                                  className="px-2 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold transition cursor-pointer"
                                  title="خصم نقطة (-1)"
                                >
                                  -1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustPoints(admin.id, -5)}
                                  className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-black transition cursor-pointer"
                                  title="خصم 5 نقاط (-5)"
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
                        </>
                      );
                    })()}

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="rounded-3xl bg-[#0c0a15]/95 border border-zinc-800 overflow-hidden shadow-xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[#120f1f] border-b border-zinc-800 text-xs font-bold text-zinc-400">
                    <th className="p-4">الإداري</th>
                    <th className="p-4">الرتبة الإدارية (RGB)</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4 text-center">نقاط النشاط</th>
                    <th className="p-4 text-center">تعديل سريع للنقاط</th>
                    <th className="p-4">المهام والملاحظات</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-xs">
                  {filteredStaff.map((admin) => {
                    const badgeStyle = getRankBadgeStyle(admin.rank, admin.rankColor);
                    return (
                      <tr key={admin.id} className="hover:bg-[#141122]/60 transition">
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
                              {admin.discordTag && (
                                <span className="text-[11px] text-zinc-400 font-mono">{admin.discordTag}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Rank Badge */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetedRankForCustomization(admin.rank);
                                setIsRankCustomizationOpen(true);
                              }}
                              className="px-3 py-1 rounded-xl text-xs font-black border transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
                              style={badgeStyle}
                              title="انقر لتعديل وتخصيص اسم ولون هذه الرتبة"
                            >
                              <span>{admin.rank}</span>
                              <Edit3 className="w-3 h-3 opacity-70" />
                            </button>
                            <select
                              value={admin.rank}
                              onChange={(e) => handleQuickRankChange(admin.id, e.target.value)}
                              className="text-[11px] font-bold bg-[#0a0812] border border-zinc-700 rounded px-1.5 py-0.5 text-zinc-300 outline-none cursor-pointer"
                            >
                              {activeTiers.map((tier) => (
                                <optgroup key={tier.id} label={tier.title}>
                                  {tier.ranks.map((r) => (
                                    <option key={r.id} value={r.name}>
                                      #{r.number} - {r.name}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>
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
                              className="px-2 py-1 rounded bg-green-500/15 hover:bg-green-500/25 text-green-400 font-bold"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustPoints(admin.id, 5)}
                              className="px-2 py-1 rounded bg-green-500/20 hover:bg-green-500/30 text-green-300 font-black"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustPoints(admin.id, -1)}
                              className="px-2 py-1 rounded bg-red-500/15 hover:bg-red-500/25 text-red-400 font-bold"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustPoints(admin.id, -5)}
                              className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 font-black"
                            >
                              -5
                            </button>
                          </div>
                        </td>

                        {/* Notes */}
                        <td className="p-4 max-w-xs text-zinc-400 truncate">
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
                                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-orange-500/20 text-zinc-300 hover:text-orange-400 border border-zinc-700"
                                      title="تعديل"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700"
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

    </div>
  );
};
