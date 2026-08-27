import React, { useState, useEffect } from 'react';
import {
  X,
  Palette,
  Check,
  Shield,
  Award,
  Layers,
  LayoutGrid,
  Zap,
  Type,
  Edit3,
  Sliders,
  Plus,
  Trash2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import {
  PresetRankItem,
  DEFAULT_PRESET_RANKS,
  DEFAULT_RANK_COLORS,
  groupRanksByTier,
  getRankColor,
} from '../utils/ranksConfig';
import { AdminMember } from '../types';

interface RankCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ranksList: PresetRankItem[];
  onSaveRanksList: (newRanks: PresetRankItem[], updatedStaffList?: AdminMember[]) => void;
  rankColors: Record<string, string>;
  onSaveRankColors: (newColors: Record<string, string>) => void;
  initialRankIdOrName?: string;
  staffList?: AdminMember[];
}

// Quick Preset Colors
const QUICK_COLOR_SWATCHES = [
  { name: 'أحمر ناري', hex: '#EF4444' },
  { name: 'قرمزي', hex: '#DC2626' },
  { name: 'وردي ياقوتي', hex: '#E11D48' },
  { name: 'فوشيا ملكي', hex: '#C026D3' },
  { name: 'بنفسجي', hex: '#9333EA' },
  { name: 'أرجواني غامق', hex: '#7C3AED' },
  { name: 'أزرق نيلي', hex: '#6366F1' },
  { name: 'أزرق ملكي', hex: '#2563EB' },
  { name: 'أزرق سماوي', hex: '#0EA5E9' },
  { name: 'سيان مشع', hex: '#06B6D4' },
  { name: 'تركواز', hex: '#14B8A6' },
  { name: 'أخضر زمردي', hex: '#10B981' },
  { name: 'أخضر غامق', hex: '#059669' },
  { name: 'أصفر ليموني', hex: '#84CC16' },
  { name: 'ذهبي إمبراطوري', hex: '#EAB308' },
  { name: 'كهرماني', hex: '#F59E0B' },
  { name: 'برتقالي مشع', hex: '#F97316' },
  { name: 'برتقالي ناري', hex: '#EA580C' },
  { name: 'رمادي فضي', hex: '#94A3B8' },
  { name: 'أبيض ناصع', hex: '#FFFFFF' },
];

export const RankCustomizationModal: React.FC<RankCustomizationModalProps> = ({
  isOpen,
  onClose,
  ranksList,
  onSaveRanksList,
  rankColors,
  onSaveRankColors,
  initialRankIdOrName,
  staffList = [],
}) => {
  const [currentRanks, setCurrentRanks] = useState<PresetRankItem[]>(() => [...ranksList]);
  const [currentColors, setCurrentColors] = useState<Record<string, string>>(() => ({ ...rankColors }));
  const [selectedRankId, setSelectedRankId] = useState<string>('rank-1');
  const [activeTab, setActiveTab] = useState<'editor' | 'table'>('editor');
  const [activeTierTab, setActiveTierTab] = useState<'management' | 'middle-management' | 'high-management'>('management');
  const [syncAdminsOnSave, setSyncAdminsOnSave] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // New Rank Modal / Form State
  const [isAddingRank, setIsAddingRank] = useState<boolean>(false);
  const [newRankName, setNewRankName] = useState<string>('');
  const [newRankTier, setNewRankTier] = useState<'management' | 'middle-management' | 'high-management'>('management');
  const [newRankColor, setNewRankColor] = useState<string>('#F97316');

  // Sync state whenever opened
  useEffect(() => {
    if (isOpen) {
      setCurrentRanks([...ranksList]);
      setCurrentColors({ ...rankColors });
      setIsAddingRank(false);
      setNewRankName('');

      if (initialRankIdOrName) {
        const found = ranksList.find(
          (r) =>
            r.id === initialRankIdOrName ||
            r.name.toLowerCase() === initialRankIdOrName.toLowerCase() ||
            r.defaultName.toLowerCase() === initialRankIdOrName.toLowerCase()
        );
        if (found) {
          setSelectedRankId(found.id);
          setActiveTierTab(found.tierId);
        } else if (ranksList[0]) {
          setSelectedRankId(ranksList[0].id);
          setActiveTierTab(ranksList[0].tierId);
        }
      } else if (ranksList[0]) {
        setSelectedRankId(ranksList[0].id);
        setActiveTierTab(ranksList[0].tierId);
      }
    }
  }, [isOpen, ranksList, rankColors, initialRankIdOrName]);

  if (!isOpen) return null;

  const selectedRank = currentRanks.find((r) => r.id === selectedRankId) || currentRanks[0] || {
    id: 'temp',
    number: 1,
    name: 'بدون رتبة',
    defaultName: 'بدون رتبة',
    tierId: 'management' as const,
    tierTitle: 'Management',
  };

  const selectedRankColor =
    currentColors[selectedRank.name] ||
    currentColors[selectedRank.id] ||
    currentColors[selectedRank.defaultName] ||
    DEFAULT_RANK_COLORS[selectedRank.defaultName] ||
    '#F97316';

  // Handler to change rank name
  const handleNameChange = (rankId: string, newName: string) => {
    setCurrentRanks((prev) =>
      prev.map((r) => (r.id === rankId ? { ...r, name: newName } : r))
    );
  };

  // Handler to change rank color
  const handleColorChange = (rankIdOrName: string, newHex: string) => {
    const targetRank = currentRanks.find((r) => r.id === rankIdOrName || r.name === rankIdOrName);
    const key = targetRank ? targetRank.name : rankIdOrName;
    setCurrentColors((prev) => ({
      ...prev,
      [key]: newHex,
      ...(targetRank ? { [targetRank.id]: newHex, [targetRank.defaultName]: newHex } : {}),
    }));
  };

  // Handler to change rank tier
  const handleTierChange = (rankId: string, newTierId: 'management' | 'middle-management' | 'high-management') => {
    const tierTitle =
      newTierId === 'management'
        ? 'Management (الإدارة الأساسية)'
        : newTierId === 'middle-management'
        ? 'Middle Management (الإدارة الوسطى)'
        : 'High Management (الإدارة العليا)';

    setCurrentRanks((prev) =>
      prev.map((r) => (r.id === rankId ? { ...r, tierId: newTierId, tierTitle } : r))
    );
  };

  // Handler to Add a New Rank
  const handleAddNewRank = () => {
    if (!newRankName.trim()) return;

    const newNumber = currentRanks.length > 0 ? Math.max(...currentRanks.map((r) => r.number)) + 1 : 1;
    const newId = `rank-${Date.now()}`;
    const tierTitle =
      newRankTier === 'management'
        ? 'Management (الإدارة الأساسية)'
        : newRankTier === 'middle-management'
        ? 'Middle Management (الإدارة الوسطى)'
        : 'High Management (الإدارة العليا)';

    const newRankItem: PresetRankItem = {
      id: newId,
      number: newNumber,
      name: newRankName.trim(),
      defaultName: newRankName.trim(),
      tierId: newRankTier,
      tierTitle,
    };

    const updatedRanks = [...currentRanks, newRankItem];
    setCurrentRanks(updatedRanks);
    setCurrentColors((prev) => ({
      ...prev,
      [newRankItem.name]: newRankColor,
      [newRankItem.id]: newRankColor,
    }));

    setSelectedRankId(newId);
    setActiveTierTab(newRankTier);
    setIsAddingRank(false);
    setNewRankName('');
  };

  // Handler to Delete a Rank
  const handleDeleteRank = (rankId: string, rankName: string) => {
    if (currentRanks.length <= 1) {
      alert('لا يمكن حذف جميع الرتب، يجب الإبقاء على رتبة واحدة على الأقل في السيرفر.');
      return;
    }

    if (window.confirm(`هل أنت متأكد من حذف رتبة (${rankName}) نهائياً؟`)) {
      const filtered = currentRanks.filter((r) => r.id !== rankId);
      // Re-number ranks sequentially from 1 to N
      const renumbered = filtered.map((r, idx) => ({
        ...r,
        number: idx + 1,
      }));

      setCurrentRanks(renumbered);
      if (selectedRankId === rankId) {
        if (renumbered.length > 0) {
          setSelectedRankId(renumbered[0].id);
          setActiveTierTab(renumbered[0].tierId);
        }
      }
    }
  };

  // Save all changes
  const handleSave = () => {
    let updatedStaff: AdminMember[] | undefined = undefined;

    // Synchronize current staff members if enabled
    if (syncAdminsOnSave && staffList.length > 0) {
      const nameChangeMap: Record<string, string> = {};
      ranksList.forEach((oldRank) => {
        const matchingNewRank = currentRanks.find((nr) => nr.id === oldRank.id);
        if (matchingNewRank && matchingNewRank.name !== oldRank.name) {
          nameChangeMap[oldRank.name] = matchingNewRank.name;
          nameChangeMap[oldRank.defaultName] = matchingNewRank.name;
        }
      });

      if (Object.keys(nameChangeMap).length > 0) {
        updatedStaff = staffList.map((member) => {
          const newRankName = nameChangeMap[member.rank];
          if (newRankName) {
            const newColor = currentColors[newRankName] || member.rankColor;
            return {
              ...member,
              rank: newRankName,
              rankColor: newColor,
              lastUpdated: new Date().toISOString(),
            };
          }
          return member;
        });
      }
    }

    onSaveRanksList(currentRanks, updatedStaff);
    onSaveRankColors(currentColors);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const tiersGrouped = groupRanksByTier(currentRanks);
  const currentTier = tiersGrouped.find((t) => t.id === activeTierTab) || tiersGrouped[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-5xl bg-[#090710] border-2 border-orange-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(249,115,22,0.35)] max-h-[94vh] overflow-y-auto custom-scrollbar flex flex-col justify-between"
        dir="rtl"
      >
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-0.5 shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center">
                <div className="w-full h-full bg-[#0d0a14] rounded-[14px] flex items-center justify-center text-orange-400">
                  <Edit3 className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>إدارة وتخصيص رتب السيرفر (إضافة، تعديل، حذف، ألوان RGB)</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold">
                    {currentRanks.length} رتبة
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  يمكنك إضافة رتب جديدة، حذف الرتب غير المرغوبة، إعادة تسميتها وتغيير لون RGB الخاص بكل رتبة بحرية كاملة
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Bar / Mode Tabs & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-2.5 rounded-2xl bg-[#120f1f] border border-zinc-800">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>المحرر التفاعلي وتخصيص الرتبة</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'table'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>جدول تعديل الأسماء والحذف السريع</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Add New Rank Trigger Button */}
              <button
                type="button"
                onClick={() => setIsAddingRank(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>إضافة رتبة جديدة</span>
              </button>

              <label className="flex items-center gap-1.5 text-[11px] text-zinc-300 bg-[#090710] px-3 py-1.5 rounded-xl border border-zinc-700/80 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncAdminsOnSave}
                  onChange={(e) => setSyncAdminsOnSave(e.target.checked)}
                  className="rounded border-zinc-700 text-orange-500 focus:ring-orange-500 w-3.5 h-3.5 accent-orange-500"
                />
                <span>تحديث مسميات الإداريين تلقائياً</span>
              </label>
            </div>
          </div>

          {/* ADD RANK FORM MODAL / PANEL */}
          {isAddingRank && (
            <div className="mb-5 p-4 rounded-2xl bg-[#140e24] border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-fadeIn">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span className="text-sm font-black text-white">إضافة رتبة إدارية جديدة إلى السيرفر:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingRank(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    اسم الرتبة الجديدة:
                  </label>
                  <input
                    type="text"
                    value={newRankName}
                    onChange={(e) => setNewRankName(e.target.value)}
                    placeholder="مثال: مسؤول الفعاليات، محقق عام..."
                    className="w-full h-10 px-3 rounded-xl bg-[#090710] border border-zinc-700 focus:border-emerald-500 text-white text-xs font-bold outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    المستوى الإداري (Tier):
                  </label>
                  <select
                    value={newRankTier}
                    onChange={(e) => setNewRankTier(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl bg-[#090710] border border-zinc-700 focus:border-emerald-500 text-white text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="management">Management (الإدارة الأساسية)</option>
                    <option value="middle-management">Middle Management (الإدارة الوسطى)</option>
                    <option value="high-management">High Management (الإدارة العليا)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      لون الرتبة (RGB):
                    </label>
                    <div className="flex items-center gap-2 bg-[#090710] border border-zinc-700 h-10 px-2.5 rounded-xl">
                      <input
                        type="color"
                        value={newRankColor}
                        onChange={(e) => setNewRankColor(e.target.value.toUpperCase())}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <span className="font-mono text-xs text-zinc-200 font-bold">{newRankColor}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddNewRank}
                    disabled={!newRankName.trim()}
                    className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shrink-0"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>تأكيد الإضافة</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: INTERACTIVE STEP-BY-STEP RANK EDITOR */}
          {activeTab === 'editor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Tiers and Ranks Browser (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* 3 Tier Switchers */}
                <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#120f1f] border border-zinc-800">
                  {tiersGrouped.map((tier) => {
                    const isSelected = activeTierTab === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setActiveTierTab(tier.id)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                      >
                        <span className="font-black truncate w-full text-center">{tier.title.split(' ')[0]}</span>
                        <span className="text-[10px] opacity-80">{tier.ranks.length} رتب</span>
                      </button>
                    );
                  })}
                </div>

                {/* Ranks Cards List in Active Tier */}
                <div className="p-3.5 rounded-2xl bg-[#120f1f] border border-orange-500/20 max-h-[380px] overflow-y-auto custom-scrollbar space-y-2">
                  <div className="flex items-center justify-between mb-1 px-1">
                    <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-orange-400" />
                      <span>رتب {currentTier.title} ({currentTier.ranks.length}):</span>
                    </span>
                    <span className="text-[11px] text-orange-400 font-bold">انقر لاختيار الرتبة لتعديلها أو حذفها</span>
                  </div>

                  {currentTier.ranks.length === 0 ? (
                    <div className="p-6 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                      لا توجد رتب في هذا المستوى الإداري حالياً. يمكنك إضافة رتبة أو نقل رتبة إليه.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentTier.ranks.map((r) => {
                        const rColor =
                          currentColors[r.name] ||
                          currentColors[r.id] ||
                          currentColors[r.defaultName] ||
                          DEFAULT_RANK_COLORS[r.defaultName] ||
                          '#F97316';
                        const isSelected = selectedRankId === r.id;

                        return (
                          <div
                            key={r.id}
                            onClick={() => setSelectedRankId(r.id)}
                            className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between gap-2 cursor-pointer group select-none ${
                              isSelected
                                ? 'border-white ring-2 ring-orange-500 bg-[#1e1930] shadow-[0_0_20px_rgba(249,115,22,0.25)]'
                                : 'border-zinc-800 bg-[#0c0a16] hover:bg-[#161226] hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span
                                className="w-4 h-4 rounded-full shrink-0 shadow-sm border border-white/80 transition-transform group-hover:scale-110"
                                style={{
                                  backgroundColor: rColor,
                                  boxShadow: `0 0 10px ${rColor}80`,
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className={`text-xs font-bold truncate ${isSelected ? 'text-white font-black' : 'text-zinc-300'}`}>
                                  {r.name}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className="px-2 py-0.5 rounded text-[11px] font-mono font-bold border"
                                style={{
                                  backgroundColor: `${rColor}22`,
                                  borderColor: `${rColor}77`,
                                  color: rColor,
                                }}
                              >
                                #{r.number}
                              </span>

                              {/* Delete single rank quick action */}
                              {currentRanks.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteRank(r.id, r.name);
                                  }}
                                  className="p-1 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/15 transition"
                                  title="حذف هذه الرتبة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quick Swatches / Colors */}
                <div className="p-3 rounded-2xl bg-[#120f1f] border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      ألوان سريعة للرتبة الحالية ({selectedRank.name}):
                    </span>
                    <span className="text-[10px] text-zinc-500">انقر لتطبيق اللون فوراً</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => handleColorChange(selectedRank.id, swatch.hex)}
                        className="w-6 h-6 rounded-lg border border-white/40 hover:scale-125 transition-transform shadow-sm cursor-pointer relative group"
                        style={{ backgroundColor: swatch.hex }}
                        title={`${swatch.name} (${swatch.hex})`}
                      />
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Selected Rank Name, Tier & RGB Color Editor (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Name & Tier Editing Card */}
                <div className="p-4 rounded-2xl bg-[#120f1f] border border-orange-500/30 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Type className="w-4 h-4 text-orange-400" />
                      تعديل اسم ومستوى الرتبة رقم #{selectedRank.number}:
                    </span>

                    {currentRanks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRank(selectedRank.id, selectedRank.name)}
                        className="text-[11px] text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 cursor-pointer"
                        title="حذف هذه الرتبة نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف الرتبة</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      اسم الرتبة:
                    </label>
                    <input
                      type="text"
                      value={selectedRank.name}
                      onChange={(e) => handleNameChange(selectedRank.id, e.target.value)}
                      placeholder="مثال: دعم فني، مشرف عام، رئيس الطاقم..."
                      className="w-full h-11 px-3.5 rounded-xl bg-[#090710] border border-orange-500/70 focus:border-amber-400 text-white text-sm font-black outline-none transition shadow-inner"
                    />
                  </div>

                  {/* Move to another tier */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      نقل الرتبة إلى مستوى إداري آخر:
                    </label>
                    <select
                      value={selectedRank.tierId}
                      onChange={(e) => handleTierChange(selectedRank.id, e.target.value as any)}
                      className="w-full h-9 px-3 rounded-lg bg-[#090710] border border-zinc-700 focus:border-orange-500 text-xs text-zinc-200 font-bold outline-none cursor-pointer"
                    >
                      <option value="management">Management (الإدارة الأساسية)</option>
                      <option value="middle-management">Middle Management (الإدارة الوسطى)</option>
                      <option value="high-management">High Management (الإدارة العليا)</option>
                    </select>
                  </div>

                  {/* Live Badge Preview */}
                  <div className="pt-2 border-t border-zinc-800 text-center">
                    <span className="text-[11px] text-zinc-400 block mb-1">شكل الشارة والتوهج:</span>
                    <div className="py-2 flex items-center justify-center">
                      <span
                        className="px-6 py-2.5 rounded-2xl text-base font-black border shadow-2xl transition-all tracking-wide"
                        style={{
                          backgroundColor: `${selectedRankColor}25`,
                          borderColor: `${selectedRankColor}`,
                          color: selectedRankColor,
                          boxShadow: `0 0 25px ${selectedRankColor}50`,
                        }}
                      >
                        #{selectedRank.number} • {selectedRank.name || 'بدون اسم'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Full RGB Color Picker for Selected Rank */}
                <ColorPicker
                  color={selectedRankColor}
                  onChange={(newHex) => handleColorChange(selectedRank.id, newHex)}
                />

              </div>

            </div>
          )}

          {/* TAB 2: FAST INLINE TABLE FOR ALL RANKS */}
          {activeTab === 'table' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#120f1f] border border-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold text-white">
                    تعديل أسماء وألوان وحذف الرتب في جدول سريع ({currentRanks.length} رتبة):
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingRank(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-black font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة رتبة جديدة للجدول</span>
                </button>
              </div>

              <div className="border border-zinc-800 rounded-2xl overflow-hidden max-h-[460px] overflow-y-auto custom-scrollbar bg-[#090710]">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#141122] text-zinc-400 font-bold border-b border-zinc-800 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 w-14 text-center">الرقم</th>
                      <th className="p-3 w-48">المستوى الإداري</th>
                      <th className="p-3">اسم الرتبة (يمكنك كتابة أي اسم)</th>
                      <th className="p-3 w-40 text-center">اللون (RGB/HEX)</th>
                      <th className="p-3 w-48 text-center">المعاينة</th>
                      <th className="p-3 w-16 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {currentRanks.map((r) => {
                      const rColor =
                        currentColors[r.name] ||
                        currentColors[r.id] ||
                        currentColors[r.defaultName] ||
                        DEFAULT_RANK_COLORS[r.defaultName] ||
                        '#F97316';

                      return (
                        <tr key={r.id} className="hover:bg-[#120f1f]/80 transition">
                          <td className="p-3 text-center font-mono font-bold text-orange-400">
                            #{r.number}
                          </td>
                          <td className="p-3 text-zinc-300 font-medium">
                            <select
                              value={r.tierId}
                              onChange={(e) => handleTierChange(r.id, e.target.value as any)}
                              className="bg-[#141120] border border-zinc-700 text-xs rounded-lg px-2 py-1 text-zinc-300 outline-none"
                            >
                              <option value="management">الإدارة الأساسية</option>
                              <option value="middle-management">الإدارة الوسطى</option>
                              <option value="high-management">الإدارة العليا</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={r.name}
                              onChange={(e) => handleNameChange(r.id, e.target.value)}
                              className="w-full h-9 px-3 rounded-lg bg-[#141120] border border-zinc-700 focus:border-orange-500 text-white font-bold text-xs outline-none transition"
                              placeholder="اسم الرتبة..."
                            />
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="color"
                                value={rColor}
                                onChange={(e) => handleColorChange(r.id, e.target.value.toUpperCase())}
                                className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                                title="اختر اللون"
                              />
                              <span className="font-mono text-[11px] text-zinc-300 font-bold">
                                {rColor}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className="inline-block px-3 py-1 rounded-xl text-xs font-black border truncate max-w-[170px]"
                              style={{
                                backgroundColor: `${rColor}22`,
                                borderColor: `${rColor}88`,
                                color: rColor,
                                boxShadow: `0 0 10px ${rColor}33`,
                              }}
                            >
                              #{r.number} • {r.name || 'بدون اسم'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {currentRanks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteRank(r.id, r.name)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 transition cursor-pointer"
                                title="حذف هذه الرتبة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 mt-5 border-t border-orange-500/20">
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-orange-400" />
            <span>إجمالي الرتب الحالية: <strong className="text-white font-bold">{currentRanks.length} رتبة</strong></span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer text-center"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none px-7 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-black font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(249,115,22,0.4)] transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>تم حفظ وتطبيق الرتب بنجاح!</span>
                </>
              ) : (
                <>
                  <SaveIcon className="w-4 h-4 stroke-[2.5]" />
                  <span>حفظ وتطبيق الرتب الآن</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

function SaveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
