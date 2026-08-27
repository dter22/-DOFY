import React, { useState } from 'react';
import { RuleCategory, ViolationItem } from '../types';
import { X, Calculator, Plus, Trash2, Copy, Check, RotateCcw, ShieldAlert, Terminal } from 'lucide-react';
import { SelectedBanItem, parsePenaltyDuration, formatDurationArabic } from './BanSidebarCalculator';

interface MultiBanCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: RuleCategory[];
  selectedItems: SelectedBanItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onAddItem: (item: Omit<SelectedBanItem, 'id'>) => void;
  onUpdateItemOccurrence: (id: string, occurrenceIndex: number) => void;
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
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const [selectedVioId, setSelectedVioId] = useState<string>('');
  const [selectedTierIdx, setSelectedTierIdx] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeCategory = categories.find((c) => c.id === selectedCatId) || categories[0];
  const activeViolations = activeCategory?.violations || [];
  const activeViolation = activeViolations.find((v) => v.id === selectedVioId) || activeViolations[0];
  const activePunishments = activeCategory?.punishments || [];
  const activePunishment = activePunishments[selectedTierIdx] || activePunishments[0];

  // Totals
  const hasPerm = selectedItems.some((item) => item.isPerm);
  const totalDays = selectedItems.reduce((acc, item) => (item.isPerm ? acc : acc + item.days), 0);
  const totalSummaryArabic = formatDurationArabic(totalDays, hasPerm);

  const banCode = hasPerm ? '0' : `${totalDays}d`;
  const reasonsList = selectedItems
    .map((item) => `${item.violationName} [${item.occurrenceText}: ${item.penaltyText}]`)
    .join(' + ');
  const quickTxCommand = `/ban [ID] ${banCode} ${reasonsList || 'مخالفة القوانين'}`;

  const handleAdd = () => {
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
    setTimeout(() => setCopiedKey(null), 1800);
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
                حاسبة الباند المتعدد
              </h3>
              <p className="text-xs text-zinc-400">
                حدد المخالفات وتكرارها (المرة 1-4) لاحتساب مجموع مدة الباند الإجمالية
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
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
              مجموع مدة الباند المحسوبة:
            </span>
            <div
              className={`text-2xl sm:text-3xl font-black font-['Cairo'] ${
                hasPerm
                  ? 'text-red-400 animate-pulse'
                  : totalDays > 0
                  ? 'text-orange-400'
                  : 'text-zinc-500'
              }`}
            >
              {totalSummaryArabic}
            </div>
            <div className="text-xs text-zinc-400">
              عدد المخالفات المحسوبة في الباند: <strong className="text-white">{selectedItems.length}</strong>
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
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Occurrence (1-4) */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                3. اختر المرة (تكرار المخالفة على اللاعب):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((idx) => {
                  const p = activePunishments[idx];
                  const label = p?.times || (idx === 0 ? 'الأولى' : idx === 1 ? 'الثانية' : idx === 2 ? 'الثالثة' : 'الرابعة');
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
                      <span className={`text-[11px] ${isSelected ? 'text-black font-extrabold' : 'text-orange-400 font-semibold'}`}>
                        {p?.penalty || '-'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer"
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
                لم يتم اختيار أي مخالفة بعد. اختر المخالفة بالأعلى واضغط "إضافة".
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {selectedItems.map((item, idx) => {
                  const cat = categories.find((c) => c.id === item.categoryId);
                  const punishments = cat?.punishments || [];

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#161222] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="text-[10px] text-orange-400 font-bold">{item.categoryTitle}</div>
                        <div className="text-xs font-bold text-white">{idx + 1}. {item.violationName}</div>
                      </div>

                      {/* Pill buttons for changing 1st, 2nd, 3rd, 4th */}
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

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-orange-300 min-w-20 text-left" dir="rtl">
                          {item.occurrenceText}: {item.penaltyText}
                        </span>
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
