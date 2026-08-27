import React, { useState } from 'react';
import { RuleCategory, ViolationItem, PunishmentTier } from '../types';
import { X, Plus, PlusCircle, CheckCircle2, Shield, Trash2, LayoutGrid, Clock } from 'lucide-react';
import { parsePenaltyDuration } from './BanSidebarCalculator';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (newCategory: RuleCategory) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onAddCategory,
}) => {
  const [title, setTitle] = useState('');
  const [rowGroup, setRowGroup] = useState('row-1');
  const [violationsTitle, setViolationsTitle] = useState('المخالفات:');
  const [punishmentsTitle, setPunishmentsTitle] = useState('المحاسبات والعقوبات:');
  const [isAbsolutePerm, setIsAbsolutePerm] = useState(false);

  // Initial violations
  const [violations, setViolations] = useState<string[]>(['']);
  
  // Initial punishments with full days support
  const [punishments, setPunishments] = useState<PunishmentTier[]>([
    { times: 'المرة الأولى', penalty: 'باند أسبوع', days: 7, isPerm: false },
    { times: 'المرة الثانية', penalty: 'باند أسبوعين', days: 14, isPerm: false },
    { times: 'المرة الثالثة', penalty: 'باند شهر', days: 30, isPerm: false },
    { times: 'المرة الرابعة', penalty: 'باند بيرم', days: 9999, isPerm: true },
  ]);

  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddViolationField = () => {
    setViolations([...violations, '']);
  };

  const handleViolationChange = (index: number, val: string) => {
    const updated = [...violations];
    updated[index] = val;
    setViolations(updated);
  };

  const handleRemoveViolationField = (index: number) => {
    if (violations.length === 1) {
      setViolations(['']);
      return;
    }
    setViolations(violations.filter((_, i) => i !== index));
  };

  const handleAddPunishmentTier = () => {
    const newTierIndex = punishments.length + 1;
    const tierName =
      newTierIndex === 1
        ? 'المرة الأولى'
        : newTierIndex === 2
        ? 'المرة الثانية'
        : newTierIndex === 3
        ? 'المرة الثالثة'
        : newTierIndex === 4
        ? 'المرة الرابعة'
        : `المرة ${newTierIndex}`;

    const defaultDays = newTierIndex === 1 ? 7 : newTierIndex === 2 ? 14 : newTierIndex === 3 ? 30 : 9999;
    const defaultPenalty =
      newTierIndex === 1
        ? 'باند أسبوع'
        : newTierIndex === 2
        ? 'باند أسبوعين'
        : newTierIndex === 3
        ? 'باند شهر'
        : 'باند بيرم';

    setPunishments([
      ...punishments,
      {
        times: tierName,
        penalty: defaultPenalty,
        days: defaultDays,
        isPerm: newTierIndex >= 4,
      },
    ]);
  };

  const handlePunishmentFieldChange = (index: number, field: 'times' | 'penalty', val: string) => {
    const updated = [...punishments];
    updated[index] = { ...updated[index], [field]: val };

    if (field === 'penalty') {
      const parsed = parsePenaltyDuration(val);
      if (parsed.isPerm) {
        updated[index].isPerm = true;
        updated[index].days = 9999;
      } else {
        updated[index].isPerm = false;
        updated[index].days = parsed.days;
      }
    }

    setPunishments(updated);
  };

  const handlePunishmentDaysChange = (index: number, daysVal: number) => {
    const updated = [...punishments];
    updated[index] = { ...updated[index], days: daysVal, isPerm: false };
    setPunishments(updated);
  };

  const handleSetQuickDays = (index: number, days: number) => {
    const updated = [...punishments];
    updated[index] = {
      ...updated[index],
      days,
      isPerm: false,
    };
    setPunishments(updated);
  };

  const handleTogglePerm = (index: number) => {
    const updated = [...punishments];
    const currentIsPerm = !!updated[index].isPerm;
    updated[index] = {
      ...updated[index],
      isPerm: !currentIsPerm,
      days: !currentIsPerm ? 9999 : 7,
    };
    setPunishments(updated);
  };

  const handleRemovePunishmentTier = (index: number) => {
    if (punishments.length === 1) return;
    setPunishments(punishments.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('يرجى إدخال عنوان الصندوق / الفئة');
      return;
    }

    const filteredViolations: ViolationItem[] = violations
      .filter((v) => v.trim().length > 0)
      .map((name, i) => ({
        id: `cat-${Date.now()}-v-${i}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
      }));

    if (filteredViolations.length === 0) {
      setError('يرجى إضافة مخالفة واحدة على الأقل في هذا الصندوق');
      return;
    }

    const categoryId = `cat-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newCategory: RuleCategory = {
      id: categoryId,
      title: title.trim(),
      violationsSectionTitle: violationsTitle.trim() || 'المخالفات:',
      punishmentsSectionTitle: punishmentsTitle.trim() || 'المحاسبات والعقوبات:',
      rowGroup,
      isAbsolutePerm,
      severityLevel: isAbsolutePerm ? 'critical' : 'high',
      violations: filteredViolations,
      punishments: punishments.filter((p) => p.penalty.trim().length > 0),
    };

    onAddCategory(newCategory);
    // Reset
    setTitle('');
    setViolations(['']);
    setPunishments([
      { times: 'المرة الأولى', penalty: 'باند أسبوع', days: 7, isPerm: false },
      { times: 'المرة الثانية', penalty: 'باند أسبوعين', days: 14, isPerm: false },
      { times: 'المرة الثالثة', penalty: 'باند شهر', days: 30, isPerm: false },
      { times: 'المرة الرابعة', penalty: 'باند بيرم', days: 9999, isPerm: true },
    ]);
    setError('');
    onClose();
  };

  return (
    <div
      id="add-category-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="add-category-modal-content"
        className="w-full max-w-2xl bg-[#090810] border-2 border-orange-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(249,115,22,0.3)] max-h-[90vh] overflow-y-auto custom-scrollbar"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-orange-500/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-0.5 shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center">
              <div className="w-full h-full bg-[#0d0a14] rounded-[14px] flex items-center justify-center text-orange-400">
                <LayoutGrid className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                إضافة صندوق / فئة جديدة للجدول
              </h2>
              <p className="text-xs text-zinc-400">
                يمكنك إنشاء صندوق جديد وتحديد مكانه ومخالفاته وعقوباته بالكامل
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
          {/* Main Title and Row selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-orange-400 mb-1.5">
                عنوان الصندوق / الفئة <span className="text-red-400">*</span>:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: مخالفات الرومات الصوتية، مخالفات القيادة..."
                className="w-full h-11 px-3.5 rounded-xl bg-[#14111f] border border-zinc-700 focus:border-orange-500 text-white text-sm font-bold outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                موقع الصندوق (الصف):
              </label>
              <select
                value={rowGroup}
                onChange={(e) => setRowGroup(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-[#14111f] border border-zinc-700 focus:border-orange-500 text-white text-sm font-semibold outline-none transition cursor-pointer"
              >
                <option value="row-1">الصف الأول (أعلى الجدول)</option>
                <option value="row-2">الصف الثاني</option>
                <option value="row-3">الصف الثالث (قسم الباند القطعي)</option>
                <option value="row-4">الصف الرابع (أقسام إضافية)</option>
              </select>
            </div>
          </div>

          {/* Section Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-2xl bg-[#120f1d] border border-orange-500/20">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">
                عنوان رأس المخالفات:
              </label>
              <input
                type="text"
                value={violationsTitle}
                onChange={(e) => setViolationsTitle(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-[#0a0812] border border-zinc-700 focus:border-orange-500 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">
                عنوان رأس المحاسبات:
              </label>
              <input
                type="text"
                value={punishmentsTitle}
                onChange={(e) => setPunishmentsTitle(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-[#0a0812] border border-zinc-700 focus:border-orange-500 text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Violations Inputs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                المخالفات التابعة لهذا الصندوق:
              </label>
              <button
                type="button"
                onClick={handleAddViolationField}
                className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> إضافة بند مخالفة
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto p-2.5 rounded-2xl bg-[#120f1d] border border-zinc-800 custom-scrollbar">
              {violations.map((v, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-500 w-5 text-center">{idx + 1}</span>
                  <input
                    type="text"
                    value={v}
                    onChange={(e) => handleViolationChange(idx, e.target.value)}
                    placeholder="اكتب نص المخالفة هنا..."
                    className="flex-1 h-9 px-3 rounded-lg bg-[#181426] border border-zinc-700 focus:border-orange-500 text-xs sm:text-sm text-white outline-none"
                  />
                  {violations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveViolationField(idx)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Punishments Inputs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                درجات العقوبة والمحاسبة:
              </label>
              <button
                type="button"
                onClick={handleAddPunishmentTier}
                className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> إضافة تدرج عقوبة
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto p-2.5 rounded-2xl bg-[#120f1d] border border-zinc-800 custom-scrollbar">
              {punishments.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#161222] border border-zinc-800/80 hover:border-orange-500/40 transition space-y-2.5 shadow-sm"
                >
                  {/* Row 1: Name and Penalty text */}
                  <div className="flex items-center gap-2">
                    <div className="w-28 sm:w-36 shrink-0">
                      <label className="block text-[10px] text-zinc-400 font-bold mb-1">
                        تكرار المخالفة:
                      </label>
                      <input
                        type="text"
                        value={p.times}
                        onChange={(e) => handlePunishmentFieldChange(idx, 'times', e.target.value)}
                        placeholder="المرة الأولى"
                        className="w-full h-9 px-2.5 rounded-lg bg-[#181426] border border-zinc-700 focus:border-orange-500 text-xs text-orange-300 font-bold outline-none"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] text-zinc-400 font-bold mb-1">
                        نص العقوبة المعروض بالصندوق:
                      </label>
                      <input
                        type="text"
                        value={p.penalty}
                        onChange={(e) => handlePunishmentFieldChange(idx, 'penalty', e.target.value)}
                        placeholder="مثال: باند أسبوع، باند 3 أيام..."
                        className="w-full h-9 px-3 rounded-lg bg-[#181426] border border-zinc-700 focus:border-orange-500 text-xs sm:text-sm text-white font-bold outline-none"
                      />
                    </div>

                    {punishments.length > 1 && (
                      <div className="pt-4 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemovePunishmentTier(idx)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 transition cursor-pointer"
                          title="حذف هذه العقوبة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Row 2: Ban Duration Number for Calculator (المدة بالأيام للحاسبة) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 bg-[#0d0a14] p-2.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-amber-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-orange-400" />
                        مدة الباند للحاسبة (بالأيام):
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="3650"
                          value={p.isPerm ? '' : (p.days ?? 7)}
                          disabled={p.isPerm}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            handlePunishmentDaysChange(idx, isNaN(val) ? 0 : val);
                          }}
                          placeholder={p.isPerm ? 'بيرم' : '7'}
                          className="w-16 bg-[#181424] border border-orange-500/50 focus:border-orange-400 rounded-lg px-2 py-1 text-xs text-center font-black text-amber-400 outline-none disabled:opacity-40"
                        />
                        <span className="text-[10px] text-zinc-400 font-bold">يوم</span>
                      </div>
                    </div>

                    {/* Quick Presets & Perm toggle */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-500 hidden sm:inline">خيارات سريعة:</span>
                      {[3, 7, 14, 30].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleSetQuickDays(idx, d)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                            !p.isPerm && p.days === d
                              ? 'bg-orange-500 text-black border-orange-400 font-black shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                              : 'bg-[#1e192c] hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                          title={`تحديد ${d} أيام للحاسبة`}
                        >
                          {d}ي
                        </button>
                      ))}

                      {/* Permanent Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleTogglePerm(idx)}
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border transition cursor-pointer ${
                          p.isPerm
                            ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]'
                            : 'bg-[#1e192c] hover:bg-red-500/20 text-zinc-400 hover:text-red-300 border-zinc-700'
                        }`}
                        title="تفعيل الباند الدائم (بيرم) في الحاسبة"
                      >
                        {p.isPerm ? '✓ دائم (بيرم)' : 'دائم (بيرم)'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-black font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(249,115,22,0.4)] transition flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 stroke-[3]" />
              <span>إنشاء الصندوق وحفظه في الجدول</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
