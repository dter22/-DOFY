import React, { useState, useEffect } from 'react';
import { X, User, Image as ImageIcon, Award, Hash, FileText, CheckCircle2, Shield, Palette } from 'lucide-react';
import { AdminMember } from '../types';
import { ColorPicker } from './ColorPicker';
import {
  DEFAULT_RANK_COLORS,
  getRankColor,
  PresetRankItem,
  DEFAULT_PRESET_RANKS,
  groupRanksByTier,
} from '../utils/ranksConfig';

interface AdminMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (admin: AdminMember) => void;
  editingAdmin?: AdminMember | null;
  rankColors?: Record<string, string>;
  ranksList?: PresetRankItem[];
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
}) => {
  const activeRanks = ranksList && ranksList.length > 0 ? ranksList : DEFAULT_PRESET_RANKS;
  const activeTiers = groupRanksByTier(activeRanks);

  const [name, setName] = useState('');
  const [discordTag, setDiscordTag] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [rank, setRank] = useState(activeRanks[0]?.name || 'Support');
  const [rankColor, setRankColor] = useState('#06B6D4');
  const [activeTierTab, setActiveTierTab] = useState<'management' | 'middle-management' | 'high-management'>('management');
  const [points, setPoints] = useState<number>(0);
  const [status, setStatus] = useState<'active' | 'vacation' | 'busy' | 'trainee'>('active');
  const [notes, setNotes] = useState('');
  const [isCustomRank, setIsCustomRank] = useState(false);
  const [customRankText, setCustomRankText] = useState('');
  const [error, setError] = useState('');

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

        // Find tier for tab selection
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
      setPoints(0);
      setStatus('active');
      setNotes('');
    }
    setError('');
  }, [editingAdmin, isOpen, rankColors, activeRanks]);

  if (!isOpen) return null;

  const handleRankSelect = (selectedRankName: string) => {
    setRank(selectedRankName);
    setIsCustomRank(false);
    // Automatically set the rank color to this rank's specific color
    const dedicatedColor = getRankColor(selectedRankName, rankColors, activeRanks);
    setRankColor(dedicatedColor);
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

    const finalAdmin: AdminMember = {
      id: editingAdmin ? editingAdmin.id : `admin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      discordTag: discordTag.trim() || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
      rank: finalRank,
      rankColor: rankColor.startsWith('#') ? rankColor : getRankColor(finalRank, rankColors, activeRanks),
      points: Number(points) || 0,
      status,
      notes: notes.trim() || undefined,
      joinDate: editingAdmin?.joinDate || new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString(),
    };

    onSave(finalAdmin);
    onClose();
  };

  const currentTier = activeTiers.find((t) => t.id === activeTierTab) || activeTiers[0];
  const selectedRankDisplay = isCustomRank ? (customRankText || 'رتبة مخصصة') : rank;


  return (
    <div
      id="admin-member-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="admin-member-modal-content"
        className="w-full max-w-3xl bg-[#090710] border-2 border-orange-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(249,115,22,0.3)] max-h-[92vh] overflow-y-auto custom-scrollbar"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-orange-500/20">
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
                اختيار الرتبة من 25 رتبة إدارية مقسمة في 3 مستويات مع لون RGB مخصص لكل رتبة
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
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Preview & URL */}
          <div className="p-4 rounded-2xl bg-[#120f1f] border border-orange-500/20 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-2xl ring-2 ring-orange-500/50 bg-[#1c182c] flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
              {avatarUrl.trim() ? (
                <img
                  src={avatarUrl.trim()}
                  alt="Avatar Preview"
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

          {/* 3 Management Lists (25 Ranks in Order from Smallest to Largest) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#120f1f] border border-orange-500/25 space-y-4">
            
            {/* Header & Live Rank Badge Preview */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-400" />
                <div>
                  <span className="text-sm font-black text-white block">تحديد وتعديل الرتبة الإدارية (من 1 إلى 25):</span>
                  <span className="text-[11px] text-zinc-400">مرتبة تصاعدياً من 1 إلى 25 ولكل رتبة لونها الخاص بها</span>
                </div>
              </div>

              {/* Live Badge Preview */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">المعاينة الحية:</span>
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
                <button
                  type="button"
                  onClick={() => setIsCustomRank(!isCustomRank)}
                  className="text-xs text-orange-400 hover:text-orange-300 underline font-bold cursor-pointer mr-2"
                >
                  {isCustomRank ? 'اختر من القوائم الـ 25' : '+ كتابة رتبة مخصصة'}
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
                {/* 3 Tier Navigation Tabs */}
                <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#0a0812] border border-zinc-800">
                  {activeTiers.map((tier) => {
                    const isSelected = activeTierTab === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setActiveTierTab(tier.id)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                      >
                        <span className="font-black truncate w-full text-center">{tier.title.split(' ')[0]}</span>
                        <span className="text-[10px] opacity-80">{tier.description}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Ranks Grid for the Active Tier with Dedicated Color Indicators */}
                <div className="p-3 rounded-2xl bg-[#0a0812] border border-zinc-800/80">
                  <div className="flex items-center justify-between mb-2 text-xs font-bold text-zinc-400">
                    <span>{currentTier.title}</span>
                    <span className="text-[11px] text-orange-400">انقر على الرتبة لتطبيق لونها الخاص فوراً:</span>
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
              </div>
            )}

            {/* Custom Interactive Color Picker (Matching User's Uploaded Image) */}
            <div className="pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-orange-400" />
                  تعديل لون الرتبة بنظام RGB:
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm"
                    style={{ backgroundColor: rankColor }}
                  />
                  <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-black/40 border border-amber-500/30">
                    {rankColor}
                  </span>
                </div>
              </div>

              {/* Color Picker Component */}
              <ColorPicker color={rankColor} onChange={(newHex) => setRankColor(newHex)} />
            </div>

          </div>

          {/* Points & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-white mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-orange-400" />
                نقاط التقييم والنشاط:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value) || 0)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#120f1f] border border-zinc-700 focus:border-orange-500 text-amber-400 text-sm font-black text-center outline-none transition"
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setPoints((p) => Math.max(0, p + 5))}
                    className="px-2.5 h-11 rounded-xl bg-green-500/15 border border-green-500/30 hover:bg-green-500/25 text-green-400 text-xs font-bold transition cursor-pointer"
                    title="زيادة 5 نقاط"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => setPoints((p) => Math.max(0, p - 5))}
                    className="px-2.5 h-11 rounded-xl bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 text-red-400 text-xs font-bold transition cursor-pointer"
                    title="خصم 5 نقاط"
                  >
                    -5
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1.5">
                حالة الإداري:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#120f1f] border border-zinc-700 focus:border-orange-500 text-white text-sm font-semibold outline-none transition cursor-pointer"
              >
                <option value="active">🟢 متواجد ونشط</option>
                <option value="vacation">🟡 في إجازة رسمية</option>
                <option value="busy">🔴 منشغل / مهام خاصة</option>
                <option value="trainee">⚪ قيد التجربة والتدريب</option>
              </select>
            </div>
          </div>

          {/* Notes / Duties */}
          <div>
            <label className="block text-xs font-bold text-white mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-orange-400" />
              المهام أو الملاحظات الخاصة بالإداري:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="مثال: مسؤول عن تيكتات البلاغات، مراقبة الرومات الصوتية..."
              className="w-full p-3 rounded-xl bg-[#120f1f] border border-zinc-700 focus:border-orange-500 text-white text-xs placeholder-zinc-500 outline-none transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-orange-500/20">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-black font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(249,115,22,0.4)] transition flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>{editingAdmin ? 'حفظ التعديلات' : 'إضافة الإداري'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
