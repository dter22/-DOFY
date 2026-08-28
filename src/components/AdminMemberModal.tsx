import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Image as ImageIcon,
  Award,
  Hash,
  FileText,
  CheckCircle2,
  Shield,
  Palette,
  Briefcase,
  Plus,
  Sliders,
  Sparkles,
  Tag,
  Check,
  Crown,
} from 'lucide-react';
import { AdminMember } from '../types';
import { ColorPicker } from './ColorPicker';
import {
  DEFAULT_RANK_COLORS,
  getRankColor,
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
import { ResponsibilityManagementModal } from './ResponsibilityManagementModal';

interface AdminMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (admin: AdminMember) => void;
  editingAdmin?: AdminMember | null;
  rankColors?: Record<string, string>;
  ranksList?: PresetRankItem[];
  responsibilities?: ResponsibilityItem[];
  onSaveResponsibilities?: (newList: ResponsibilityItem[]) => void;
}

// 25 Ordered Ranks Categorized into 3 Management Tiers
export const MANAGEMENT_TIERS = groupRanksByTier(DEFAULT_PRESET_RANKS);
export const ALL_PRESET_RANKS = DEFAULT_PRESET_RANKS;

export const AdminMemberModal: React.FC<AdminMemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAdmin,
  rankColors,
  ranksList = DEFAULT_PRESET_RANKS,
  responsibilities = DEFAULT_RESPONSIBILITIES,
  onSaveResponsibilities,
}) => {
  const activeRanks = ranksList && ranksList.length > 0 ? ranksList : DEFAULT_PRESET_RANKS;
  const activeTiers = groupRanksByTier(activeRanks);
  const activeResponsibilities =
    responsibilities && responsibilities.length > 0 ? responsibilities : DEFAULT_RESPONSIBILITIES;

  const [name, setName] = useState('');
  const [discordTag, setDiscordTag] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [rank, setRank] = useState(activeRanks[0]?.name || 'Support');
  const [rankColor, setRankColor] = useState('#06B6D4');
  const [activeTierTab, setActiveTierTab] = useState<
    'management' | 'middle-management' | 'high-management' | 'responsibilities'
  >('management');

  // Multiple Responsibility Assignment State
  const [selectedRespRoles, setSelectedRespRoles] = useState<string[]>([]);
  const [respColorsMap, setRespColorsMap] = useState<Record<string, string>>({});

  const [points, setPoints] = useState<number>(0);
  const [status, setStatus] = useState<'active' | 'vacation' | 'busy' | 'trainee'>('active');
  const [notes, setNotes] = useState('');
  const [isCustomRank, setIsCustomRank] = useState(false);
  const [customRankText, setCustomRankText] = useState('');
  const [error, setError] = useState('');
  const [isRespModalOpen, setIsRespModalOpen] = useState(false);

  // Helper to find a role's color and info
  const findRoleMeta = (roleName: string) => {
    for (const resp of activeResponsibilities) {
      const found = resp.roles.find((r) => r.name.toLowerCase() === roleName.toLowerCase());
      if (found) {
        return {
          role: found,
          resp,
          color: resp.color || '#EF4444',
          label: found.labelArabic,
        };
      }
    }
    return {
      role: null,
      resp: null,
      color: '#EF4444',
      label: 'مسؤولية',
    };
  };

  useEffect(() => {
    if (editingAdmin) {
      setName(editingAdmin.name || '');
      setDiscordTag(editingAdmin.discordTag || '');
      setAvatarUrl(editingAdmin.avatarUrl || '');

      const foundRank = activeRanks.find(
        (r) =>
          r.name.toLowerCase() === (editingAdmin.rank || '').toLowerCase() ||
          r.defaultName.toLowerCase() === (editingAdmin.rank || '').toLowerCase()
      );

      if (foundRank) {
        setRank(foundRank.name);
        setIsCustomRank(false);
        setCustomRankText('');
        setActiveTierTab(foundRank.tierId);
      } else {
        setRank('مخصص');
        setIsCustomRank(true);
        setCustomRankText(editingAdmin.rank || '');
      }

      setRankColor(
        editingAdmin.rankColor && editingAdmin.rankColor.startsWith('#')
          ? editingAdmin.rankColor
          : getRankColor(editingAdmin.rank, rankColors, activeRanks)
      );

      // Load multiple responsibility roles
      let initialRoles: string[] = [];
      if (editingAdmin.responsibilityRoles && Array.isArray(editingAdmin.responsibilityRoles)) {
        initialRoles = [...editingAdmin.responsibilityRoles.filter(Boolean)];
      } else if (editingAdmin.responsibilityRole) {
        initialRoles = [editingAdmin.responsibilityRole];
      }

      setSelectedRespRoles(initialRoles);

      // Map colors for all initial roles
      const colorMap: Record<string, string> = { ...(editingAdmin.responsibilityColors || {}) };
      initialRoles.forEach((rName) => {
        if (!colorMap[rName]) {
          const meta = findRoleMeta(rName);
          colorMap[rName] = meta.color;
        }
      });
      setRespColorsMap(colorMap);

      setPoints(typeof editingAdmin.points === 'number' ? editingAdmin.points : 0);
      setStatus(editingAdmin.status || 'active');
      setNotes(editingAdmin.notes || '');
    } else {
      setName('');
      setDiscordTag('');
      setAvatarUrl('');
      const defaultFirstRank = activeRanks[0]?.name || 'Support';
      setRank(defaultFirstRank);
      setActiveTierTab('management');
      setRankColor(getRankColor(defaultFirstRank, rankColors, activeRanks));
      setIsCustomRank(false);
      setCustomRankText('');
      setSelectedRespRoles([]);
      setRespColorsMap({});
      setPoints(0);
      setStatus('active');
      setNotes('');
    }
    setError('');
  }, [editingAdmin, isOpen, rankColors, activeRanks, activeResponsibilities]);

  if (!isOpen) return null;

  const handleRankSelect = (selectedRankName: string) => {
    setRank(selectedRankName);
    setIsCustomRank(false);
    // Automatically set the rank color to this rank's specific color
    const dedicatedColor = getRankColor(selectedRankName, rankColors, activeRanks);
    setRankColor(dedicatedColor);
  };

  // Toggle a responsibility role
  const handleToggleResponsibilityRole = (resp: ResponsibilityItem, roleName: string) => {
    const isCurrentlySelected = selectedRespRoles.includes(roleName);
    let nextRoles: string[];

    if (isCurrentlySelected) {
      nextRoles = selectedRespRoles.filter((r) => r !== roleName);
    } else {
      nextRoles = [...selectedRespRoles, roleName];
    }

    setSelectedRespRoles(nextRoles);

    // Update color map
    const nextMap = { ...respColorsMap };
    if (!isCurrentlySelected) {
      nextMap[roleName] = resp.color || '#EF4444';
    } else {
      delete nextMap[roleName];
    }
    setRespColorsMap(nextMap);
  };

  const handleClearAllResponsibilities = () => {
    setSelectedRespRoles([]);
    setRespColorsMap({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم الإداري');
      return;
    }

    const finalRank = isCustomRank ? customRankText.trim() : rank;
    if (!finalRank) {
      setError('يرجى تحديد أو كتابة رتبة الإداري');
      return;
    }

    // Determine primary responsibility metadata (first one if available)
    const primaryRespRole = selectedRespRoles[0] || undefined;
    const primaryMeta = primaryRespRole ? findRoleMeta(primaryRespRole) : null;

    const finalAdmin: AdminMember = {
      id: editingAdmin ? editingAdmin.id : `admin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      discordTag: discordTag.trim() || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
      rank: finalRank,
      rankColor: rankColor.startsWith('#') ? rankColor : getRankColor(finalRank, rankColors, activeRanks),
      responsibilityId: primaryMeta?.resp?.id || undefined,
      responsibilityName: primaryMeta?.resp?.name || undefined,
      responsibilityRole: primaryRespRole,
      responsibilityRoles: selectedRespRoles,
      responsibilityColor: primaryMeta?.color || (primaryRespRole ? respColorsMap[primaryRespRole] : undefined),
      responsibilityColors: respColorsMap,
      points: Number(points) || 0,
      status,
      notes: notes.trim() || undefined,
      joinDate: editingAdmin?.joinDate || new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString(),
    };

    onSave(finalAdmin);
    onClose();
  };

  const currentTier =
    activeTierTab !== 'responsibilities'
      ? activeTiers.find((t) => t.id === activeTierTab) || activeTiers[0]
      : null;
  const selectedRankDisplay = isCustomRank ? customRankText || 'رتبة مخصصة' : rank;

  return (
    <>
      <div
        id="admin-member-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          id="admin-member-modal-content"
          className="w-full max-w-4xl bg-[#090710] border-2 border-orange-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(249,115,22,0.3)] max-h-[92vh] overflow-y-auto custom-scrollbar"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-0.5 shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center">
                <div className="w-full h-full bg-[#0d0a14] rounded-[14px] flex items-center justify-center text-orange-400">
                  <Shield className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  {editingAdmin ? `تعديل بيانات: ${editingAdmin.name}` : 'إضافة إداري جديد للطاقم'}
                </h2>
                <p className="text-xs text-zinc-400">
                  تحديد الرتبة الإدارية وتعيين أكثر من مسؤولية مع ألوان RGB واضحة بدون قص
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar Preview & URL */}
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#120f1f] border border-zinc-800">
              <div className="w-16 h-16 rounded-2xl bg-[#1a1528] border-2 border-orange-500/40 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <User className="w-8 h-8 text-zinc-500" />
                )}
              </div>
              <div className="w-full">
                <label className="block text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-orange-400" />
                  رابط صورة الديسكورد (Avatar URL):
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://cdn.discordapp.com/avatars/... أو رابط صورة أفتار الشخص"
                  className="w-full h-10 px-3 rounded-xl bg-[#090710] border border-zinc-700 focus:border-orange-500 text-white text-xs placeholder-zinc-500 outline-none transition"
                />
                <span className="text-[11px] text-zinc-400 block mt-1">
                  الصق رابط صورة ديسكورد أو صورة شخصية لتظهر فوراً في بطاقة الإداري
                </span>
              </div>
            </div>

            {/* Admin Name & Discord Tag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-orange-400 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-400" />
                  اسم الإداري <span className="text-red-400">*</span>:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: دوفي / Dofy"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#120f1f] border border-zinc-700 focus:border-orange-500 text-white text-sm font-bold placeholder-zinc-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-orange-400" />
                  يوزر / معرف الديسكورد:
                </label>
                <input
                  type="text"
                  value={discordTag}
                  onChange={(e) => setDiscordTag(e.target.value)}
                  placeholder="مثال: @dofy أو ID الإداري"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#120f1f] border border-zinc-700 focus:border-orange-500 text-white text-sm placeholder-zinc-500 outline-none transition"
                />
              </div>
            </div>

            {/* 4 Navigation Tabs (High, Middle, Management, المسؤوليات) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#120f1f] border border-orange-500/25 space-y-4">
              
              {/* Header & Live Rank Badge Preview */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-400 shrink-0" />
                  <div>
                    <span className="text-sm font-black text-white block">
                      تحديد وتعديل الرتبة الإدارية أو المسؤوليات:
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      اختر الرتبة الأساسية ويمكنك تعيين أكثر من مسؤولية وفريق عمل
                    </span>
                  </div>
                </div>

                {/* Live Badges Preview */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-zinc-400">المعاينة:</span>
                  
                  {/* Main Rank */}
                  <span
                    className="px-3.5 py-1.5 rounded-xl text-xs font-black border shadow-lg transition-all"
                    style={{
                      backgroundColor: `${rankColor}22`,
                      borderColor: `${rankColor}99`,
                      color: rankColor,
                      boxShadow: `0 0 16px ${rankColor}35`,
                    }}
                  >
                    {selectedRankDisplay}
                  </span>

                  {/* All Assigned Responsibilities Badges */}
                  {selectedRespRoles.map((rName) => {
                    const meta = findRoleMeta(rName);
                    const c = respColorsMap[rName] || meta.color;
                    return (
                      <span
                        key={rName}
                        className="px-2.5 py-1 rounded-xl text-xs font-bold border shadow flex items-center gap-1"
                        style={{
                          backgroundColor: `${c}22`,
                          borderColor: `${c}88`,
                          color: c,
                          boxShadow: `0 0 10px ${c}30`,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                        <span>{rName}</span>
                      </span>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setIsCustomRank(!isCustomRank)}
                    className="text-xs text-orange-400 hover:text-orange-300 underline font-bold cursor-pointer mr-1"
                  >
                    {isCustomRank ? 'اختر من القوائم' : '+ كتابة رتبة مخصصة'}
                  </button>
                </div>
              </div>

              {isCustomRank ? (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">اكتب اسم الرتبة المخصصة:</label>
                  <input
                    type="text"
                    value={customRankText}
                    onChange={(e) => setCustomRankText(e.target.value)}
                    placeholder="مثال: مسؤول الفعاليات، رئيس التحقيق، مراقب الرومات..."
                    className="w-full h-11 px-3.5 rounded-xl bg-[#0a0812] border border-orange-500/60 text-white text-sm font-bold placeholder-zinc-500 outline-none transition"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 4 Tabs: High, Middle, Management, المسؤوليات */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-[#0a0812] border border-zinc-800">
                    {/* High */}
                    <button
                      type="button"
                      onClick={() => setActiveTierTab('high-management')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        activeTierTab === 'high-management'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className="font-black truncate w-full text-center">High</span>
                      <span className="text-[10px] opacity-80">الرتب من 21 إلى 25</span>
                    </button>

                    {/* Middle */}
                    <button
                      type="button"
                      onClick={() => setActiveTierTab('middle-management')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        activeTierTab === 'middle-management'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className="font-black truncate w-full text-center">Middle</span>
                      <span className="text-[10px] opacity-80">الرتب من 11 إلى 20</span>
                    </button>

                    {/* Management */}
                    <button
                      type="button"
                      onClick={() => setActiveTierTab('management')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        activeTierTab === 'management'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className="font-black truncate w-full text-center">Management</span>
                      <span className="text-[10px] opacity-80">الرتب من 1 إلى 10</span>
                    </button>

                    {/* المسؤوليات (Responsibilities) */}
                    <button
                      type="button"
                      onClick={() => setActiveTierTab('responsibilities')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        activeTierTab === 'responsibilities'
                          ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                          : 'text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30'
                      }`}
                    >
                      <span className="font-black truncate w-full text-center flex items-center justify-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>المسؤوليات</span>
                      </span>
                      <span className="text-[10px] opacity-80">
                        {selectedRespRoles.length > 0
                          ? `(${selectedRespRoles.length} محددة)`
                          : 'تعيين فرق العمل'}
                      </span>
                    </button>
                  </div>

                  {/* ACTIVE TAB CONTENT */}
                  {activeTierTab === 'responsibilities' ? (
                    /* Responsibilities View with multi-select support and full clear visible names */
                    <div className="p-4 rounded-2xl bg-[#0a0812] border border-red-500/30 space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-sm" />
                          <span className="text-xs font-black text-white">قائمة المسؤوليات وفرق العمل</span>
                          <span className="text-[11px] text-red-300 bg-red-500/15 px-2.5 py-0.5 rounded-full border border-red-500/30 font-bold">
                            يمكنك اختيار أكثر من مسؤولية معاً
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {selectedRespRoles.length > 0 && (
                            <button
                              type="button"
                              onClick={handleClearAllResponsibilities}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-red-500/20 hover:text-red-300 transition cursor-pointer"
                            >
                              إلغاء الكل
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setIsRespModalOpen(true)}
                            className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 flex items-center gap-1 transition cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>إدارة وتعديل المسؤوليات</span>
                          </button>
                        </div>
                      </div>

                      {/* Responsibilities Cards */}
                      <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                        {activeResponsibilities.map((resp) => {
                          const respColor = resp.color || '#EF4444';

                          return (
                            <div
                              key={resp.id}
                              className="p-3.5 rounded-2xl bg-[#130f1e] border transition space-y-3"
                              style={{
                                borderColor: `${respColor}40`,
                                backgroundColor: `${respColor}0a`,
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full shadow-sm"
                                    style={{
                                      backgroundColor: respColor,
                                      boxShadow: `0 0 10px ${respColor}`,
                                    }}
                                  />
                                  <strong className="text-sm font-black text-white">
                                    {resp.name}
                                  </strong>
                                  {resp.description && (
                                    <span className="text-xs text-zinc-400 hidden sm:inline">
                                      ({resp.description})
                                    </span>
                                  )}
                                </div>

                                <span
                                  className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg border"
                                  style={{
                                    borderColor: `${respColor}60`,
                                    color: respColor,
                                    backgroundColor: `${respColor}15`,
                                  }}
                                >
                                  {respColor}
                                </span>
                              </div>

                              {/* Roles: عضو (Member), المشرف (Supervisor), القائد (Manager) with full visibility & checkboxes */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {resp.roles.map((rl) => {
                                  const isSelectedRole = selectedRespRoles.includes(rl.name);
                                  const isManager = rl.type === 'manager' || rl.labelArabic === 'القائد';
                                  const isSupervisor = rl.type === 'supervisor' || rl.labelArabic === 'المشرف';

                                  return (
                                    <button
                                      key={rl.id || rl.name}
                                      type="button"
                                      onClick={() => handleToggleResponsibilityRole(resp, rl.name)}
                                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between gap-2 text-right cursor-pointer select-none ${
                                        isSelectedRole
                                          ? 'border-white ring-2 shadow-lg'
                                          : 'border-zinc-800 bg-[#0a0812] hover:bg-[#1a1428]'
                                      }`}
                                      style={{
                                        backgroundColor: isSelectedRole ? `${respColor}45` : '#0a0812',
                                        borderColor: isSelectedRole ? '#ffffff' : `${respColor}40`,
                                        color: isSelectedRole ? '#ffffff' : respColor,
                                        boxShadow: isSelectedRole ? `0 0 15px ${respColor}60` : undefined,
                                      }}
                                    >
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div
                                          className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition ${
                                            isSelectedRole
                                              ? 'bg-white text-black border-white'
                                              : 'border-zinc-600 bg-black/40'
                                          }`}
                                        >
                                          {isSelectedRole && <Check className="w-3 h-3 stroke-[3]" />}
                                        </div>

                                        {isManager ? (
                                          <Crown className="w-3.5 h-3.5 shrink-0" style={{ color: isSelectedRole ? '#ffffff' : respColor }} />
                                        ) : isSupervisor ? (
                                          <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: isSelectedRole ? '#ffffff' : respColor }} />
                                        ) : (
                                          <User className="w-3.5 h-3.5 shrink-0 opacity-75" style={{ color: isSelectedRole ? '#ffffff' : respColor }} />
                                        )}

                                        <span className="font-extrabold text-xs leading-snug">
                                          {rl.name}
                                        </span>
                                      </div>

                                      <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-zinc-300 font-bold shrink-0">
                                        {rl.labelArabic}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Selected responsibilities pill summary */}
                      {selectedRespRoles.length > 0 && (
                        <div className="pt-3 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800 flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white">المسؤوليات المعينة حالياً:</span>
                            {selectedRespRoles.map((rName) => {
                              const meta = findRoleMeta(rName);
                              const c = respColorsMap[rName] || meta.color;
                              return (
                                <span
                                  key={rName}
                                  className="font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5"
                                  style={{
                                    color: c,
                                    borderColor: `${c}70`,
                                    backgroundColor: `${c}20`,
                                  }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                                  <span>{rName}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : currentTier ? (
                    /* Ranks Grid for Active Tier (High / Middle / Management) */
                    <div className="p-3 rounded-2xl bg-[#0a0812] border border-zinc-800/80">
                      <div className="flex items-center justify-between mb-2 text-xs font-bold text-zinc-400">
                        <span>{currentTier.title}</span>
                        <span className="text-[11px] text-orange-400">
                          انقر على الرتبة لتطبيق لونها الخاص فوراً:
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {currentTier.ranks.map((r) => {
                          const isSelected = rank === r.name;
                          const dedicatedRankColor = getRankColor(r.name, rankColors, activeRanks);

                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => handleRankSelect(r.name)}
                              className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between gap-1 text-right cursor-pointer group ${
                                isSelected
                                  ? 'bg-orange-500/20 text-orange-300 border-white ring-2 ring-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                                  : 'bg-[#141120] border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 hover:bg-[#1a1628]'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm border border-white/40"
                                  style={{ backgroundColor: dedicatedRankColor }}
                                />
                                <span className="truncate">{r.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-zinc-500 group-hover:text-orange-400">
                                #{r.number}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* RGB Color Customizer for Main Rank */}
              <div className="p-3.5 rounded-2xl bg-[#0a0812] border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-orange-400" />
                    تخصيص لون الرتبة الأساسية (RGB):
                  </span>
                  <span className="text-zinc-500 font-mono text-[11px]">{rankColor}</span>
                </div>
                <ColorPicker
                  color={rankColor}
                  onChange={setRankColor}
                  label="اختر لون الرتبة بدقة عبر عجلة الألوان RGB"
                />
              </div>
            </div>

            {/* Points & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  النقاط الإدارية الحالية:
                </label>
                <input
                  type="number"
                  min="0"
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value, 10) || 0)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#120f1f] border border-zinc-700 focus:border-orange-500 text-white text-sm font-bold outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  الحالة الإدارية الحالية:
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#120f1f] border border-zinc-700 focus:border-orange-500 text-white text-sm font-bold outline-none transition cursor-pointer"
                >
                  <option value="active">🟢 متواجد ونشط (Active)</option>
                  <option value="vacation">🟡 في إجازة (Vacation)</option>
                  <option value="busy">🔴 منشغل (Busy)</option>
                  <option value="trainee">⚪ قيد التجربة (Trainee)</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-orange-400" />
                ملاحظات أو مهام خاصة بالإداري:
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أضف أي مهام، ملاحظات أو تكليفات خاصة بالإداري..."
                rows={2}
                className="w-full p-3 rounded-xl bg-[#120f1f] border border-zinc-700 focus:border-orange-500 text-white text-xs placeholder-zinc-500 outline-none transition resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-black font-black text-xs shadow-[0_0_20px_rgba(249,115,22,0.4)] transition transform active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>{editingAdmin ? 'حفظ التعديلات' : 'إضافة الإداري'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Responsibility Management Modal (if opened from within) */}
      <ResponsibilityManagementModal
        isOpen={isRespModalOpen}
        onClose={() => setIsRespModalOpen(false)}
        responsibilities={activeResponsibilities}
        onSaveResponsibilities={(newList) => {
          if (onSaveResponsibilities) {
            onSaveResponsibilities(newList);
          }
        }}
      />
    </>
  );
};
