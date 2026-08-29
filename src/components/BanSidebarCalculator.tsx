import React, { useState } from 'react';
import { RuleCategory, DurationUnit, AuthorizedUser } from '../types';
import { isOwnerUser } from '../utils/auth';
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
  Edit2,
  Sparkles,
  Calendar,
  Infinity as InfinityIcon,
  Timer,
} from 'lucide-react';
import {
  parsePenaltyDuration,
  formatDurationArabic,
  generateBanCode,
  ParsedDuration,
} from '../utils/durationHelper';

export interface SelectedBanItem {
  id: string;
  categoryId: string;
  categoryTitle: string;
  violationId: string;
  violationName: string;
  occurrenceIndex: number;
  occurrenceText: string;
  penaltyText: string;
  hours: number;
  days: number;
  unit: DurationUnit;
  value: number;
  isPerm: boolean;
}

interface BanSidebarCalculatorProps {
  categories: RuleCategory[];
  selectedItems: SelectedBanItem[];
  currentUser?: AuthorizedUser | null;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onAddItem: (item: Omit<SelectedBanItem, 'id'>) => void;
  onUpdateItemOccurrence: (id: string, occurrenceIndex: number) => void;
  onUpdateItemCustomDuration?: (
    id: string,
    unit: DurationUnit,
    value: number,
    isPerm: boolean,
    customText: string
  ) => void;
}

export { parsePenaltyDuration, formatDurationArabic };

export const BanSidebarCalculator: React.FC<BanSidebarCalculatorProps> = ({
  categories,
  selectedItems,
  currentUser,
  onRemoveItem,
  onClearAll,
  onAddItem,
  onUpdateItemOccurrence,
  onUpdateItemCustomDuration,
}) => {
  const isOwner = !!currentUser && isOwnerUser(currentUser);
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const [selectedVioId, setSelectedVioId] = useState<string>('');
  const [selectedTierIdx, setSelectedTierIdx] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPickerExpanded, setIsPickerExpanded] = useState<boolean>(true);

  // Custom Ban Duration Controller state
  const [isCustomDurationActive, setIsCustomDurationActive] = useState<boolean>(false);
  const [customUnit, setCustomUnit] = useState<DurationUnit>('hours');
  const [customValue, setCustomValue] = useState<number>(5);

  // Editing duration on an existing item in the list
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemUnit, setEditItemUnit] = useState<DurationUnit>('hours');
  const [editItemValue, setEditItemValue] = useState<number>(1);

  const activeCategory = categories.find((c) => c.id === selectedCatId) || categories[0];
  const activeViolations = activeCategory?.violations || [];
  const activeViolation = activeViolations.find((v) => v.id === selectedVioId) || activeViolations[0];
  const activePunishments = activeCategory?.punishments || [];
  const activePunishment = activePunishments[selectedTierIdx] || activePunishments[0];

  // Auto-sync custom value when switching active violation if not manually overridden
  const defaultViolationDuration = activeViolation
    ? parsePenaltyDuration(
        activeViolation.penaltyText || activePunishment?.penalty || '',
        activeViolation.durationHours,
        undefined,
        activeViolation.isPerm || activeCategory?.isAbsolutePerm
      )
    : { totalHours: 5, unit: 'hours' as DurationUnit, value: 5, isPerm: false, displayText: '5 ساعات' };

  // Calculate Totals
  const hasPerm = selectedItems.some((item) => item.isPerm);
  const totalHours = selectedItems.reduce((acc, item) => (item.isPerm ? acc : acc + item.hours), 0);
  const totalSummaryArabic = formatDurationArabic(totalHours, hasPerm);

  // Command generation
  const banCode = generateBanCode(totalHours, hasPerm);
  const reasonsList = selectedItems
    .map((item) => `${item.violationName} [${item.penaltyText}]`)
    .join(' + ');
  const quickTxCommand = `/ban [ID] ${banCode} ${reasonsList || 'مخالفة القوانين'}`;

  const handleAddCurrent = () => {
    if (!activeCategory || !activeViolation) return;

    let computedHours = 0;
    let computedDays = 0;
    let computedUnit: DurationUnit = customUnit;
    let computedValue = customValue;
    let computedIsPerm = false;
    let computedText = '';

    if (isCustomDurationActive) {
      if (customUnit === 'perm') {
        computedHours = 999999;
        computedDays = 9999;
        computedIsPerm = true;
        computedText = 'باند نهائي (بيرمنتلي)';
      } else if (customUnit === 'months') {
        const val = Math.max(1, customValue);
        computedHours = val * 720;
        computedDays = val * 30;
        computedValue = val;
        computedText = val === 1 ? 'شهر واحد (30 يوم)' : val === 2 ? 'شهرين (60 يوم)' : `${val} أشهر`;
      } else if (customUnit === 'days') {
        const val = Math.max(1, customValue);
        computedHours = val * 24;
        computedDays = val;
        computedValue = val;
        computedText = val === 1 ? 'يوم واحد (24 ساعة)' : val === 2 ? 'يومين (48 ساعة)' : `${val} أيام`;
      } else {
        const val = Math.max(1, customValue);
        computedHours = val;
        computedDays = Math.ceil(val / 24);
        computedValue = val;
        computedText = val === 1 ? 'ساعة واحدة' : val === 2 ? 'ساعتين' : `${val} ساعات`;
      }
    } else {
      // Use default violation duration or punishment tier
      const penaltyStr = activeViolation.penaltyText || activePunishment?.penalty || '5 ساعات';
      const parsed = parsePenaltyDuration(
        penaltyStr,
        activeViolation.durationHours || activePunishment?.hours,
        activePunishment?.days,
        activeViolation.isPerm || activePunishment?.isPerm || activeCategory.isAbsolutePerm
      );

      computedHours = parsed.totalHours;
      computedDays = Math.ceil(parsed.totalHours / 24);
      computedUnit = parsed.unit;
      computedValue = parsed.value;
      computedIsPerm = parsed.isPerm;
      computedText = parsed.displayText;
    }

    onAddItem({
      categoryId: activeCategory.id,
      categoryTitle: activeCategory.title,
      violationId: activeViolation.id,
      violationName: activeViolation.name,
      occurrenceIndex: selectedTierIdx,
      occurrenceText: activePunishment?.times || `المرة ${selectedTierIdx + 1}`,
      penaltyText: computedText,
      hours: computedHours,
      days: computedDays,
      unit: computedUnit,
      value: computedValue,
      isPerm: computedIsPerm,
    });
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveItemEdit = (itemId: string) => {
    if (!onUpdateItemCustomDuration) return;

    let computedHours = 0;
    let computedDays = 0;
    let isPerm = false;
    let text = '';

    if (editItemUnit === 'perm') {
      computedHours = 999999;
      computedDays = 9999;
      isPerm = true;
      text = 'باند نهائي (بيرمنتلي)';
    } else if (editItemUnit === 'months') {
      const val = Math.max(1, editItemValue);
      computedHours = val * 720;
      computedDays = val * 30;
      text = val === 1 ? 'شهر واحد' : val === 2 ? 'شهرين' : `${val} أشهر`;
    } else if (editItemUnit === 'days') {
      const val = Math.max(1, editItemValue);
      computedHours = val * 24;
      computedDays = val;
      text = val === 1 ? 'يوم واحد' : val === 2 ? 'يومين' : `${val} أيام`;
    } else {
      const val = Math.max(1, editItemValue);
      computedHours = val;
      computedDays = Math.ceil(val / 24);
      text = val === 1 ? 'ساعة واحدة' : val === 2 ? 'ساعتين' : `${val} ساعات`;
    }

    onUpdateItemCustomDuration(itemId, editItemUnit, editItemValue, isPerm, text);
    setEditingItemId(null);
  };

  return (
    <aside
      id="ban-calculator-sidebar"
      className="w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col gap-4"
    >
      {/* MAIN TOTAL RESULT CARD */}
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
                  حساب فوري دقيق بالساعات، الأيام، الشهور والنهائي
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
                  : totalHours > 0
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
                {!hasPerm && totalHours > 0 && (
                  <span className="text-zinc-500 text-[10px]">({totalHours} ساعة كاملة)</span>
                )}
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
            يمكنك تخصيص وتعديل مدة أي بند
          </span>
        </div>

        {selectedItems.length === 0 ? (
          <div className="py-8 text-center px-3 border border-dashed border-zinc-800 rounded-xl bg-black/30">
            <Flame className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-zinc-400 font-medium">لم يتم تحديد أي مخالفة بعد</p>
            <p className="text-[11px] text-zinc-500 mt-1">
              اختر المخالفة أو حدد مدة مخصصة (ساعات / أيام / شهور / نهائي) وأضفها
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {selectedItems.map((item, index) => {
              const cat = categories.find((c) => c.id === item.categoryId);
              const punishments = cat?.punishments || [];
              const isEditing = editingItemId === item.id;

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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (isEditing) {
                            setEditingItemId(null);
                          } else {
                            setEditingItemId(item.id);
                            setEditItemUnit(item.unit || (item.isPerm ? 'perm' : item.hours >= 24 ? 'days' : 'hours'));
                            setEditItemValue(item.value || (item.hours >= 24 ? Math.floor(item.hours / 24) : item.hours));
                          }
                        }}
                        className={`p-1 rounded-lg transition cursor-pointer text-xs ${
                          isEditing
                            ? 'bg-orange-500 text-black'
                            : 'hover:bg-orange-500/20 text-zinc-400 hover:text-orange-300'
                        }`}
                        title="تعديل وقت الباند لهذا البند"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition cursor-pointer shrink-0"
                        title="حذف هذه المخالفة من الحسبة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Duration Editor for Item */}
                  {isEditing ? (
                    <div className="p-2.5 rounded-lg bg-[#0e0a18] border border-orange-500/40 space-y-2 mt-2">
                      <div className="text-[10px] font-bold text-orange-400">
                        تعديل مدة هذا البند (ساعات / أيام / شهور / نهائي):
                      </div>

                      {/* Unit Selector */}
                      <div className="grid grid-cols-4 gap-1">
                        {(['hours', 'days', 'months', 'perm'] as DurationUnit[]).map((unitKey) => (
                          <button
                            key={unitKey}
                            type="button"
                            onClick={() => setEditItemUnit(unitKey)}
                            className={`py-1 rounded-md text-[10px] font-bold transition cursor-pointer border ${
                              editItemUnit === unitKey
                                ? 'bg-orange-500 text-black border-orange-400 font-extrabold'
                                : 'bg-[#181326] text-zinc-400 border-zinc-800 hover:text-white'
                            }`}
                          >
                            {unitKey === 'hours' && 'ساعات'}
                            {unitKey === 'days' && 'أيام'}
                            {unitKey === 'months' && 'شهور'}
                            {unitKey === 'perm' && 'نهائي'}
                          </button>
                        ))}
                      </div>

                      {/* Value Input (if not perm) */}
                      {editItemUnit !== 'perm' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditItemValue(Math.max(1, editItemValue - 1))}
                            className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={editItemUnit === 'hours' ? 720 : editItemUnit === 'days' ? 365 : 24}
                            value={editItemValue}
                            onChange={(e) => setEditItemValue(Math.max(1, parseInt(e.target.value) || 1))}
                            className="flex-1 h-7 px-2 bg-black/60 border border-zinc-700 rounded text-center text-xs font-bold text-white outline-none focus:border-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => setEditItemValue(editItemValue + 1)}
                            className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                          <span className="text-[11px] text-zinc-400 font-semibold min-w-12">
                            {editItemUnit === 'hours' ? 'ساعة' : editItemUnit === 'days' ? 'يوم' : 'شهر'}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingItemId(null)}
                          className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-[10px] cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveItemEdit(item.id)}
                          className="px-3 py-1 rounded bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-[10px] transition cursor-pointer"
                        >
                          تطبيق التعديل
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Occurrence Selector Pills */}
                      <div className="pt-1">
                        <div className="grid grid-cols-4 gap-1">
                          {[0, 1, 2, 3].map((tierIdx) => {
                            const tier = punishments[tierIdx];
                            const tierLabel =
                              tier?.times ||
                              (tierIdx === 0
                                ? 'الأولى'
                                : tierIdx === 1
                                ? 'الثانية'
                                : tierIdx === 2
                                ? 'الثالثة'
                                : 'الرابعة');
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
                        <span className="text-zinc-400">العقوبة المحتسبة:</span>
                        <span className="font-bold text-orange-300">
                          {item.penaltyText}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK ADD VIOLATION & CUSTOM DURATION PICKER (OWNER ONLY) */}
      {isOwner && (
        <div className="rounded-2xl bg-[#0e0c16]/90 border border-orange-500/25 p-4 space-y-3 shadow-xl backdrop-blur-md">
          <div
            onClick={() => setIsPickerExpanded(!isPickerExpanded)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-500" />
              <h4 className="text-xs font-bold text-zinc-200">
                إضافة مخالفة وتحديد وقت الباند
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
                      {v.name} {v.penaltyText ? `(${v.penaltyText})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* TOGGLE: CUSTOM BAN DURATION CONTROLLER (ساعات / أيام / شهر / نهائي) */}
              <div className="p-3 rounded-xl bg-[#140f22] border border-orange-500/40 space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold text-orange-300 flex items-center gap-1.5 cursor-pointer">
                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                    <span>تعديل وقت الباند (ساعات / أيام / شهر / نهائي):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomDurationActive(!isCustomDurationActive)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black transition cursor-pointer border ${
                      isCustomDurationActive
                        ? 'bg-orange-500 text-black border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                    }`}
                  >
                    {isCustomDurationActive ? 'مخصص مفعّل ✓' : 'تفعيل التخصيص'}
                  </button>
                </div>

                {/* Unit Selector: ساعات | أيام | شهر | نهائي */}
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDurationActive(true);
                      setCustomUnit('hours');
                      if (customValue > 100) setCustomValue(5);
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1 cursor-pointer border ${
                      isCustomDurationActive && customUnit === 'hours'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                        : 'bg-[#1a142c] hover:bg-[#231b3b] text-zinc-300 border-zinc-800'
                    }`}
                  >
                    <Timer className="w-3 h-3" />
                    <span>ساعات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDurationActive(true);
                      setCustomUnit('days');
                      if (customValue > 30) setCustomValue(1);
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1 cursor-pointer border ${
                      isCustomDurationActive && customUnit === 'days'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                        : 'bg-[#1a142c] hover:bg-[#231b3b] text-zinc-300 border-zinc-800'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>أيام</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDurationActive(true);
                      setCustomUnit('months');
                      if (customValue > 12) setCustomValue(1);
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1 cursor-pointer border ${
                      isCustomDurationActive && customUnit === 'months'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                        : 'bg-[#1a142c] hover:bg-[#231b3b] text-zinc-300 border-zinc-800'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>شهر</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDurationActive(true);
                      setCustomUnit('perm');
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1 cursor-pointer border ${
                      isCustomDurationActive && customUnit === 'perm'
                        ? 'bg-red-500 text-white border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                        : 'bg-[#1a142c] hover:bg-[#231b3b] text-zinc-300 border-zinc-800'
                    }`}
                  >
                    <InfinityIcon className="w-3 h-3" />
                    <span>نهائي</span>
                  </button>
                </div>

                {/* Number Input & Controls for Hours / Days / Months */}
                {isCustomDurationActive && customUnit !== 'perm' && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomValue(Math.max(1, customValue - 1))}
                        className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-base flex items-center justify-center cursor-pointer transition active:scale-95"
                      >
                        -
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          min="1"
                          max={customUnit === 'hours' ? 720 : customUnit === 'days' ? 365 : 24}
                          value={customValue}
                          onChange={(e) => setCustomValue(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full h-9 px-3 bg-black/70 border border-orange-500/50 rounded-xl text-center text-sm font-black text-orange-300 outline-none focus:ring-1 focus:ring-orange-400"
                          placeholder="أدخل الرقم"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomValue(customValue + 1)}
                        className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-base flex items-center justify-center cursor-pointer transition active:scale-95"
                      >
                        +
                      </button>
                      <span className="text-xs font-bold text-orange-400 min-w-14 text-center">
                        {customUnit === 'hours'
                          ? customValue === 1
                            ? 'ساعة'
                            : customValue === 2
                            ? 'ساعتين'
                            : customValue <= 10
                            ? 'ساعات'
                            : 'ساعة'
                          : customUnit === 'days'
                          ? customValue === 1
                            ? 'يوم'
                            : customValue === 2
                            ? 'يومين'
                            : customValue <= 10
                            ? 'أيام'
                            : 'يوم'
                          : customValue === 1
                          ? 'شهر'
                          : customValue === 2
                          ? 'شهرين'
                          : `${customValue} شهور`}
                      </span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {customUnit === 'hours' &&
                        [1, 2, 3, 5, 6, 7, 12, 24].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setCustomValue(h)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                              customValue === h
                                ? 'bg-orange-500 text-black border-orange-400 font-black'
                                : 'bg-[#1f1933] text-zinc-400 border-zinc-800 hover:text-white'
                            }`}
                          >
                            {h} {h === 1 ? 'ساعة' : h === 2 ? 'ساعتين' : 'ساعات'}
                          </button>
                        ))}

                      {customUnit === 'days' &&
                        [1, 2, 3, 5, 7, 14, 21, 30].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setCustomValue(d)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                              customValue === d
                                ? 'bg-orange-500 text-black border-orange-400 font-black'
                                : 'bg-[#1f1933] text-zinc-400 border-zinc-800 hover:text-white'
                            }`}
                          >
                            {d} {d === 1 ? 'يوم' : d === 2 ? 'يومين' : d === 7 ? 'أسبوع' : d === 14 ? 'أسبوعين' : 'أيام'}
                          </button>
                        ))}

                      {customUnit === 'months' &&
                        [1, 2, 3, 6].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setCustomValue(m)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                              customValue === m
                                ? 'bg-orange-500 text-black border-orange-400 font-black'
                                : 'bg-[#1f1933] text-zinc-400 border-zinc-800 hover:text-white'
                            }`}
                          >
                            {m === 1 ? 'شهر واحد' : m === 2 ? 'شهرين' : `${m} أشهر`}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {isCustomDurationActive && customUnit === 'perm' && (
                  <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/30 text-center text-xs text-red-300 font-black">
                    ⛔ تم تعيين العقوبة: باند نهائي دائم (بيرمنتلي)
                  </div>
                )}
              </div>

              {/* Standard Tier occurrence fallback */}
              {!isCustomDurationActive && (
                <div>
                  <label className="block text-[11px] font-bold text-orange-400 mb-1">
                    3. التكرار والدرجة:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 1, 2, 3].map((idx) => {
                      const p = activePunishments[idx];
                      const label =
                        p?.times ||
                        (idx === 0 ? 'الأولى' : idx === 1 ? 'الثانية' : idx === 2 ? 'الثالثة' : 'الرابعة');
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
                          <span
                            className={`text-[9px] truncate max-w-full ${
                              isSelected ? 'text-black font-black' : 'text-orange-400'
                            }`}
                          >
                            {p?.penalty || '-'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
      )}
    </aside>
  );
};
