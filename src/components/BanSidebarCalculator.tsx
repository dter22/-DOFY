import React, { useState } from 'react';
import { RuleCategory, ViolationItem } from '../types';
import {
  Calculator,
  Trash2,
  Plus,
  Copy,
  Check,
  RotateCcw,
  Clock,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Flame,
  CheckCircle2
} from 'lucide-react';

export interface SelectedBanItem {
  id: string; // unique selection id
  categoryId: string;
  categoryTitle: string;
  violationId: string;
  violationName: string;
  occurrenceIndex: number; // 0 = first, 1 = second, 2 = third, 3 = fourth
  occurrenceText: string;
  penaltyText: string;
  days: number;
  isPerm: boolean;
}

interface BanSidebarCalculatorProps {
  categories: RuleCategory[];
  selectedItems: SelectedBanItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onAddItem: (item: Omit<SelectedBanItem, 'id'>) => void;
  onUpdateItemOccurrence: (id: string, occurrenceIndex: number) => void;
}

export const parsePenaltyDuration = (penalty: string, tierDays?: number, isPermTier?: boolean) => {
  if (isPermTier || penalty.includes('بيرم') || penalty.includes('دائم') || penalty.includes('نهائي')) {
    return { days: 9999, isPerm: true, label: 'باند بيرم (نهائي)' };
  }
  if (typeof tierDays === 'number' && !isNaN(tierDays) && tierDays >= 0) {
    if (tierDays === 0) return { days: 0, isPerm: false, label: '0 يوم' };
    return { days: tierDays, isPerm: false, label: `${tierDays} يوم` };
  }
  if (penalty.includes('شهرين')) return { days: 60, isPerm: false, label: '60 يوم (شهرين)' };
  if (penalty.includes('شهر')) return { days: 30, isPerm: false, label: '30 يوم (شهر)' };
  if (penalty.includes('3 اسابيع') || penalty.includes('ثلاث اسابيع')) return { days: 21, isPerm: false, label: '21 يوم' };
  if (penalty.includes('اسبوعين')) return { days: 14, isPerm: false, label: '14 يوم (أسبوعين)' };
  if (penalty.includes('اسبوع') || penalty.includes('أسبوع')) return { days: 7, isPerm: false, label: '7 أيام (أسبوع)' };
  if (penalty.includes('5 ايام') || penalty.includes('خمس ايام')) return { days: 5, isPerm: false, label: '5 أيام' };
  if (penalty.includes('4 ايام') || penalty.includes('اربع ايام')) return { days: 4, isPerm: false, label: '4 أيام' };
  if (penalty.includes('3 ايام') || penalty.includes('ثلاث ايام')) return { days: 3, isPerm: false, label: '3 أيام' };
  if (penalty.includes('يومين')) return { days: 2, isPerm: false, label: 'يومين' };
  if (penalty.includes('يوم')) return { days: 1, isPerm: false, label: 'يوم واحد' };
  
  // Try extracting number
  const match = penalty.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    return { days: num, isPerm: false, label: `${num} يوم` };
  }

  return { days: 7, isPerm: false, label: '7 أيام' };
};

export const formatDurationArabic = (totalDays: number, hasPerm: boolean) => {
  if (hasPerm) {
    return 'باند بيرم (دائم / نهائي)';
  }
  if (totalDays === 0) {
    return '0 يوم (لا توجد عقوبة محددة)';
  }

  const months = Math.floor(totalDays / 30);
  const remainingAfterMonths = totalDays % 30;
  const weeks = Math.floor(remainingAfterMonths / 7);
  const days = remainingAfterMonths % 7;

  const parts: string[] = [];
  if (months > 0) {
    parts.push(months === 1 ? 'شهر' : months === 2 ? 'شهرين' : `${months} أشهر`);
  }
  if (weeks > 0) {
    parts.push(weeks === 1 ? 'أسبوع' : weeks === 2 ? 'أسبوعين' : `${weeks} أسابيع`);
  }
  if (days > 0) {
    parts.push(days === 1 ? 'يوم' : days === 2 ? 'يومين' : `${days} أيام`);
  }

  const breakdown = parts.join(' و ');
  return `${totalDays} يوم ${parts.length > 0 ? `(${breakdown})` : ''}`;
};

export const BanSidebarCalculator: React.FC<BanSidebarCalculatorProps> = ({
  categories,
  selectedItems,
  onRemoveItem,
  onClearAll,
  onAddItem,
  onUpdateItemOccurrence,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const [selectedVioId, setSelectedVioId] = useState<string>('');
  const [selectedTierIdx, setSelectedTierIdx] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPickerExpanded, setIsPickerExpanded] = useState<boolean>(true);

  const activeCategory = categories.find((c) => c.id === selectedCatId) || categories[0];
  const activeViolations = activeCategory?.violations || [];
  const activeViolation = activeViolations.find((v) => v.id === selectedVioId) || activeViolations[0];
  const activePunishments = activeCategory?.punishments || [];
  const activePunishment = activePunishments[selectedTierIdx] || activePunishments[0];

  // Calculate Totals
  const hasPerm = selectedItems.some((item) => item.isPerm);
  const totalDays = selectedItems.reduce((acc, item) => (item.isPerm ? acc : acc + item.days), 0);
  const totalSummaryArabic = formatDurationArabic(totalDays, hasPerm);

  // Command generation
  const banCode = hasPerm ? '0' : `${totalDays}d`;
  const reasonsList = selectedItems
    .map((item) => `${item.violationName} [${item.occurrenceText}: ${item.penaltyText}]`)
    .join(' + ');
  const quickTxCommand = `/ban [ID] ${banCode} ${reasonsList || 'مخالفة القوانين'}`;

  const handleAddCurrent = () => {
    if (!activeCategory || !activeViolation || !activePunishment) return;

    const parsed = parsePenaltyDuration(
      activePunishment.penalty,
      activePunishment.days,
      activePunishment.isPerm || activeCategory.isAbsolutePerm
    );

    onAddItem({
      categoryId: activeCategory.id,
      categoryTitle: activeCategory.title,
      violationId: activeViolation.id,
      violationName: activeViolation.name,
      occurrenceIndex: selectedTierIdx,
      occurrenceText: activePunishment.times || `المرة ${selectedTierIdx + 1}`,
      penaltyText: activePunishment.penalty,
      days: parsed.days,
      isPerm: parsed.isPerm,
    });
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <aside
      id="ban-calculator-sidebar"
      className="w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col gap-4"
    >
      {/* MAIN TOTAL RESULT CARD - HIGHLIGHTED AT THE TOP */}
      <div className="relative rounded-2xl bg-gradient-to-b from-[#1c1427] via-[#14101e] to-[#0d0a15] border-2 border-orange-500/60 p-5 shadow-[0_0_35px_rgba(249,115,22,0.25)] overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-amber-500/15 blur-2xl rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-orange-500/20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white font-['Cairo']">
                  حاسبة الباند التراكمية
                </h3>
                <p className="text-[11px] text-zinc-400">
                  حدد المخالفات والتكرار لحساب المجموع فورياً
                </p>
              </div>
            </div>

            {selectedItems.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-400 hover:text-white text-xs flex items-center gap-1 transition cursor-pointer"
                title="تفريغ كل المخالفات المختارة"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">تفريغ</span>
              </button>
            )}
          </div>

          {/* Big Result Box */}
          <div className="p-4 rounded-xl bg-black/60 border border-orange-500/40 text-center space-y-1.5 shadow-inner">
            <div className="text-[11px] font-extrabold text-orange-400 flex items-center justify-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              مجموع مدة الباند الإجمالية:
            </div>

            <div
              className={`text-xl sm:text-2xl font-black font-['Cairo'] transition-all duration-300 ${
                hasPerm
                  ? 'text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse'
                  : totalDays > 0
                  ? 'text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]'
                  : 'text-zinc-500'
              }`}
            >
              {totalSummaryArabic}
            </div>

            {selectedItems.length > 0 && (
              <div className="text-[11px] text-zinc-400 pt-1 flex items-center justify-center gap-2">
                <span>المخالفات المحددة:</span>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-bold text-[10px] border border-orange-500/30">
                  {selectedItems.length} مخالفة
                </span>
              </div>
            )}
          </div>

          {/* Quick Copy Command */}
          {selectedItems.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-bold text-[11px]">أمر الحظر السريع:</span>
                <button
                  onClick={() => handleCopy(quickTxCommand, 'txCmd')}
                  className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-[11px] flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedKey === 'txCmd' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'txCmd' ? 'تم النسخ!' : 'نسخ الأمر'}</span>
                </button>
              </div>
              <div
                dir="ltr"
                className="p-2.5 rounded-lg bg-[#0a0810] border border-zinc-800 text-[11px] font-mono text-orange-300 select-all overflow-x-auto text-left whitespace-nowrap"
              >
                {quickTxCommand}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SELECTED VIOLATIONS LIST */}
      <div className="rounded-2xl bg-[#0e0c16]/90 border border-orange-500/25 p-4 space-y-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-orange-500" />
            المخالفات المضافة للحساب ({selectedItems.length}):
          </h4>
          <span className="text-[10px] text-zinc-400">
            يمكنك تغيير المرة (1-4) مباشرة
          </span>
        </div>

        {selectedItems.length === 0 ? (
          <div className="py-8 text-center px-3 border border-dashed border-zinc-800 rounded-xl bg-black/30">
            <Flame className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-zinc-400 font-medium">لم يتم تحديد أي مخالفة بعد</p>
            <p className="text-[11px] text-zinc-500 mt-1">
              اختر المخالفة وحدد المرة من القائمة أدناه أو اضغط على أي بند في الجدول لإضافته فوراً
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {selectedItems.map((item, index) => {
              const cat = categories.find((c) => c.id === item.categoryId);
              const punishments = cat?.punishments || [];

              return (
                <div
                  key={item.id}
                  className="group relative rounded-xl bg-[#161222] border border-zinc-800 hover:border-orange-500/50 p-3 transition space-y-2 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-orange-400 font-semibold truncate">
                        {item.categoryTitle}
                      </div>
                      <div className="text-xs font-bold text-white leading-snug">
                        {index + 1}. {item.violationName}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition cursor-pointer shrink-0"
                      title="حذف هذه المخالفة من الحسبة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Occurrence Selector Pills (المرة 1، 2، 3، 4) */}
                  <div className="pt-1">
                    <div className="text-[10px] text-zinc-400 font-semibold mb-1">
                      تكرار المخالفة على اللاعب:
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[0, 1, 2, 3].map((tierIdx) => {
                        const tier = punishments[tierIdx];
                        const tierLabel = tier?.times || (tierIdx === 0 ? 'الأولى' : tierIdx === 1 ? 'الثانية' : tierIdx === 2 ? 'الثالثة' : 'الرابعة');
                        const isSelected = item.occurrenceIndex === tierIdx;

                        return (
                          <button
                            key={tierIdx}
                            type="button"
                            onClick={() => onUpdateItemOccurrence(item.id, tierIdx)}
                            className={`px-1.5 py-1 rounded-lg text-[10px] font-extrabold transition text-center cursor-pointer border ${
                              isSelected
                                ? 'bg-orange-500 text-black border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                                : 'bg-[#1e192c] hover:bg-[#28223b] text-zinc-400 border-zinc-800'
                            }`}
                            title={tier?.penalty || 'عقوبة'}
                          >
                            {tierLabel.replace('المرة ', '')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Calculated result for this item */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-800/80">
                    <span className="text-zinc-400">العقوبة المقررة:</span>
                    <span className="font-bold text-orange-300">
                      {item.occurrenceText}: {item.penaltyText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK ADD VIOLATION PICKER */}
      <div className="rounded-2xl bg-[#0e0c16]/90 border border-orange-500/25 p-4 space-y-3 shadow-xl backdrop-blur-md">
        <div
          onClick={() => setIsPickerExpanded(!isPickerExpanded)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-orange-500" />
            <h4 className="text-xs font-bold text-zinc-200">
              إضافة مخالفة جديدة للحاسبة
            </h4>
          </div>
          <button className="text-zinc-400 hover:text-white p-1">
            {isPickerExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isPickerExpanded && (
          <div className="space-y-3 pt-2 border-t border-zinc-800/80">
            {/* Category Select */}
            <div>
              <label className="block text-[11px] font-bold text-orange-400 mb-1">
                1. الفئة:
              </label>
              <select
                value={selectedCatId}
                onChange={(e) => {
                  setSelectedCatId(e.target.value);
                  const cat = categories.find((c) => c.id === e.target.value);
                  if (cat && cat.violations[0]) {
                    setSelectedVioId(cat.violations[0].id);
                  }
                }}
                className="w-full h-9 px-2.5 bg-[#171322] border border-zinc-700 focus:border-orange-500 rounded-xl text-white text-xs font-semibold outline-none transition cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Violation Select */}
            <div>
              <label className="block text-[11px] font-bold text-orange-400 mb-1">
                2. المخالفة:
              </label>
              <select
                value={selectedVioId || activeViolations[0]?.id || ''}
                onChange={(e) => setSelectedVioId(e.target.value)}
                className="w-full h-9 px-2.5 bg-[#171322] border border-zinc-700 focus:border-orange-500 rounded-xl text-white text-xs font-semibold outline-none transition cursor-pointer"
              >
                {activeViolations.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Occurrence (المرة 1-4) */}
            <div>
              <label className="block text-[11px] font-bold text-orange-400 mb-1">
                3. التكرار (المرة):
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map((idx) => {
                  const p = activePunishments[idx];
                  const label = p?.times || (idx === 0 ? 'الأولى' : idx === 1 ? 'الثانية' : idx === 2 ? 'الثالثة' : 'الرابعة');
                  const isSelected = selectedTierIdx === idx;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedTierIdx(idx)}
                      className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-black border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-orange-500 text-black border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                          : 'bg-[#171322] hover:bg-[#221c32] text-zinc-300 border-zinc-800'
                      }`}
                    >
                      <span>{label.replace('المرة ', '')}</span>
                      <span className={`text-[9px] truncate max-w-full ${isSelected ? 'text-black font-black' : 'text-orange-400'}`}>
                        {p?.penalty || '-'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add Button */}
            <button
              type="button"
              onClick={handleAddCurrent}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(249,115,22,0.35)] transition cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>إضافة المخالفة لحساب المجموع</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
