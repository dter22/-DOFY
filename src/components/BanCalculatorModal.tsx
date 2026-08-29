import React, { useState } from 'react';
import { RuleCategory, DurationUnit } from '../types';
import {
  X,
  Calculator,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  ShieldAlert,
  Terminal,
  Clock,
  Calendar,
  Infinity as InfinityIcon,
  Timer,
  Edit2,
} from 'lucide-react';
import { SelectedBanItem } from './BanSidebarCalculator';
import {
  parsePenaltyDuration,
  formatDurationArabic,
  generateBanCode,
} from '../utils/durationHelper';

interface MultiBanCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: RuleCategory[];
  selectedItems: SelectedBanItem[];
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

export const BanCalculatorModal: React.FC<MultiBanCalculatorModalProps> = ({
  isOpen,
  onClose,
  categories,
  selectedItems,
  onRemoveItem,
  onClearAll,
  onAddItem,
  onUpdateItemOccurrence,
  onUpdateItemCustomDuration,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const [selectedVioId, setSelectedVioId] = useState<string>('');
  const [selectedTierIdx, setSelectedTierIdx] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Custom duration controller
  const [isCustomDurationActive, setIsCustomDurationActive] = useState<boolean>(false);
  const [customUnit, setCustomUnit] = useState<DurationUnit>('hours');
  const [customValue, setCustomValue] = useState<number>(5);

  // Editing existing item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemUnit, setEditItemUnit] = useState<DurationUnit>('hours');
  const [editItemValue, setEditItemValue] = useState<number>(1);

  if (!isOpen) return null;

  const activeCategory = categories.find((c) => c.id === selectedCatId) || categories[0];
  const activeViolations = activeCategory?.violations || [];
  const activeViolation = activeViolations.find((v) => v.id === selectedVioId) || activeViolations[0];
  const activePunishments = activeCategory?.punishments || [];
  const activePunishment = activePunishments[selectedTierIdx] || activePunishments[0];

  // Totals
  const hasPerm = selectedItems.some((item) => item.isPerm);
  const totalHours = selectedItems.reduce((acc, item) => (item.isPerm ? acc : acc + item.hours), 0);
  const totalSummaryArabic = formatDurationArabic(totalHours, hasPerm);

  const banCode = generateBanCode(totalHours, hasPerm);
  const reasonsList = selectedItems
    .map((item) => `${item.violationName} [${item.penaltyText}]`)
    .join(' + ');
  const quickTxCommand = `/ban [ID] ${banCode} ${reasonsList || 'مخالفة القوانين'}`;

  const handleAdd = () => {
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
    setTimeout(() => setCopiedKey(null), 1800);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#111019] border-2 border-orange-500/50 rounded-2xl shadow-[0_0_50px_rgba(249,115,22,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-orange-500/20 bg-gradient-to-r from-orange-500/15 via-[#1a1427] to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-['Cairo']">
                حاسبة الباند التراكمية المتقدمة
              </h3>
              <p className="text-xs text-zinc-400">
                حساب وتخصيص الباند بدقة بالغة (ساعات / أيام / شهور / نهائي)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1a1728] hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Big Total Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#1b1429] to-[#120e1d] border-2 border-orange-500/50 text-center space-y-2 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Clock className="w-4 h-4" />
              مجموع مدة الباند المحسوبة:
            </span>
            <div
              className={`text-2xl sm:text-3xl font-black font-['Cairo'] ${
                hasPerm
                  ? 'text-red-400 animate-pulse'
                  : totalHours > 0
                  ? 'text-orange-400'
                  : 'text-zinc-500'
              }`}
            >
              {totalSummaryArabic}
            </div>
            <div className="text-xs text-zinc-400 flex items-center justify-center gap-2">
              <span>عدد المخالفات:</span>
              <strong className="text-white bg-orange-500/20 px-2 py-0.5 rounded-full border border-orange-500/30">
                {selectedItems.length}
              </strong>
              {!hasPerm && totalHours > 0 && (
                <span className="text-zinc-500 font-bold">({totalHours} ساعة)</span>
              )}
            </div>
          </div>

          {/* Add New Violation Section */}
          <div className="p-4 rounded-xl bg-[#161222] border border-orange-500/30 space-y-3">
            <h4 className="text-xs font-black text-orange-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> تحديد وإضافة مخالفة للحاسبة:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  1. اختر الفئة:
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
                  className="w-full h-10 px-3 bg-[#1d182e] border border-zinc-700 focus:border-orange-500 rounded-xl text-white text-xs font-semibold outline-none transition cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Violation */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  2. اختر المخالفة:
                </label>
                <select
                  value={selectedVioId || activeViolations[0]?.id || ''}
                  onChange={(e) => setSelectedVioId(e.target.value)}
                  className="w-full h-10 px-3 bg-[#1d182e] border border-zinc-700 focus:border-orange-500 rounded-xl text-white text-xs font-semibold outline-none transition cursor-pointer"
                >
                  {activeViolations.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.penaltyText ? `(${v.penaltyText})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Ban Duration Unit Selector */}
            <div className="p-3 rounded-xl bg-[#140f22] border border-orange-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-extrabold text-orange-300 flex items-center gap-1.5 cursor-pointer">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  <span>تغيير وتخصيص وقت الباند (ساعات / أيام / شهر / نهائي):</span>
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
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomDurationActive(true);
                    setCustomUnit('hours');
                    if (customValue > 100) setCustomValue(5);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isCustomDurationActive && customUnit === 'hours'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                      : 'bg-[#1d182e] hover:bg-[#28213f] text-zinc-300 border-zinc-800'
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>ساعات</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCustomDurationActive(true);
                    setCustomUnit('days');
                    if (customValue > 30) setCustomValue(1);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isCustomDurationActive && customUnit === 'days'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                      : 'bg-[#1d182e] hover:bg-[#28213f] text-zinc-300 border-zinc-800'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>أيام</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCustomDurationActive(true);
                    setCustomUnit('months');
                    if (customValue > 12) setCustomValue(1);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isCustomDurationActive && customUnit === 'months'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                      : 'bg-[#1d182e] hover:bg-[#28213f] text-zinc-300 border-zinc-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>شهر</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCustomDurationActive(true);
                    setCustomUnit('perm');
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isCustomDurationActive && customUnit === 'perm'
                      ? 'bg-red-500 text-white border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                      : 'bg-[#1d182e] hover:bg-[#28213f] text-zinc-300 border-zinc-800'
                  }`}
                >
                  <InfinityIcon className="w-3.5 h-3.5" />
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
                      className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-lg flex items-center justify-center cursor-pointer transition active:scale-95"
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
                        className="w-full h-10 px-3 bg-black/70 border border-orange-500/50 rounded-xl text-center text-base font-black text-orange-300 outline-none focus:ring-2 focus:ring-orange-400"
                        placeholder="أدخل الرقم"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomValue(customValue + 1)}
                      className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-lg flex items-center justify-center cursor-pointer transition active:scale-95"
                    >
                      +
                    </button>
                    <span className="text-sm font-bold text-orange-400 min-w-16 text-center">
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
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {customUnit === 'hours' &&
                      [1, 2, 3, 5, 6, 7, 12, 24].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setCustomValue(h)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
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
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
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
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
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
            </div>

            {/* Standard Tier occurrence fallback */}
            {!isCustomDurationActive && (
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  3. التكرار والدرجة:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-orange-500 text-black border-orange-400 font-black shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                            : 'bg-[#1d182e] hover:bg-[#28213f] text-zinc-300 border-zinc-800'
                        }`}
                      >
                        <span className="text-xs font-bold">{label}</span>
                        <span
                          className={`text-[11px] ${
                            isSelected ? 'text-black font-extrabold' : 'text-orange-400 font-semibold'
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

            <button
              type="button"
              onClick={handleAdd}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-black text-sm flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>إضافة المخالفة للحاسبة (+ حساب المجموع)</span>
            </button>
          </div>

          {/* List of currently selected violations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-orange-400" />
                المخالفات المضافة في الحسبة ({selectedItems.length}):
              </h4>
              {selectedItems.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> تفريغ القائمة
                </button>
              )}
            </div>

            {selectedItems.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl bg-black/30 text-xs text-zinc-400">
                لم يتم اختيار أي مخالفة بعد. اختر المخالفة وحدد المدة بالأعلى ثم اضغط "إضافة".
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {selectedItems.map((item, idx) => {
                  const cat = categories.find((c) => c.id === item.categoryId);
                  const punishments = cat?.punishments || [];
                  const isEditing = editingItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#161222] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="text-[10px] text-orange-400 font-bold">{item.categoryTitle}</div>
                        <div className="text-xs font-bold text-white">
                          {idx + 1}. {item.violationName}
                        </div>
                      </div>

                      {/* Pill buttons or edit */}
                      {isEditing ? (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0e0a18] border border-orange-500/40">
                          <select
                            value={editItemUnit}
                            onChange={(e) => setEditItemUnit(e.target.value as DurationUnit)}
                            className="bg-zinc-800 text-white text-xs rounded px-2 py-1"
                          >
                            <option value="hours">ساعات</option>
                            <option value="days">أيام</option>
                            <option value="months">شهور</option>
                            <option value="perm">نهائي</option>
                          </select>
                          {editItemUnit !== 'perm' && (
                            <input
                              type="number"
                              min="1"
                              value={editItemValue}
                              onChange={(e) => setEditItemValue(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-14 bg-black border border-zinc-700 rounded px-1 text-center text-xs text-white"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleSaveItemEdit(item.id)}
                            className="px-2 py-1 bg-orange-500 text-black text-xs font-bold rounded"
                          >
                            حفظ
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {[0, 1, 2, 3].map((tierIdx) => {
                            const tier = punishments[tierIdx];
                            const tierLabel = tier?.times || `المرة ${tierIdx + 1}`;
                            const isSelected = item.occurrenceIndex === tierIdx;
                            return (
                              <button
                                key={tierIdx}
                                onClick={() => onUpdateItemOccurrence(item.id, tierIdx)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-orange-500 text-black border-orange-400'
                                    : 'bg-[#1e192f] text-zinc-400 border-zinc-800 hover:bg-[#27213d]'
                                }`}
                              >
                                {tierLabel.replace('المرة ', '')}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-orange-300 min-w-20 text-left" dir="rtl">
                          {item.penaltyText}
                        </span>
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
                          className="p-1.5 rounded-lg hover:bg-orange-500/20 text-zinc-400 hover:text-orange-300 transition cursor-pointer"
                          title="تعديل المدة"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Copy Command */}
          {selectedItems.length > 0 && (
            <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-orange-400" />
                  أمر الحظر السريع:
                </span>
                <button
                  onClick={() => handleCopy(quickTxCommand, 'modalCmd')}
                  className="px-2.5 py-1 rounded bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedKey === 'modalCmd' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>نسخ الأمر</span>
                </button>
              </div>
              <div
                dir="ltr"
                className="p-2.5 rounded bg-[#09070e] text-xs font-mono text-orange-300 border border-zinc-800 select-all overflow-x-auto text-left"
              >
                {quickTxCommand}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-[#0d0a14] flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            مجموع المدة: <strong className="text-orange-400">{totalSummaryArabic}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs transition cursor-pointer"
          >
            تم
          </button>
        </div>

      </div>
    </div>
  );
};
