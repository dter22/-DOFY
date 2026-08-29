import React, { useState } from 'react';
import { RuleCategory, ViolationItem, PunishmentTier, DurationUnit } from '../types';
import { X, Plus, PlusCircle, CheckCircle2, Shield, Trash2, LayoutGrid, Clock, Timer, Calendar, Infinity as InfinityIcon } from 'lucide-react';
import { parsePenaltyDuration } from '../utils/durationHelper';

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
  
  // Initial punishments with full duration support
  const [punishments, setPunishments] = useState<PunishmentTier[]>([
    { times: 'المرة الأولى', penalty: 'باند 5 ساعات', unit: 'hours', value: 5, hours: 5, days: 1, isPerm: false },
    { times: 'المرة الثانية', penalty: 'باند 24 ساعة', unit: 'hours', value: 24, hours: 24, days: 1, isPerm: false },
    { times: 'المرة الثالثة', penalty: 'باند 3 أيام', unit: 'days', value: 3, hours: 72, days: 3, isPerm: false },
    { times: 'المرة الرابعة', penalty: 'باند بيرم', unit: 'perm', value: 0, hours: 999999, days: 9999, isPerm: true },
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
        unit: newTierIndex >= 4 ? 'perm' : 'days',
        value: defaultDays,
        hours: defaultDays * 24,
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
        updated[index].unit = 'perm';
        updated[index].value = 0;
        updated[index].days = 9999;
        updated[index].hours = 999999;
      } else {
        updated[index].isPerm = false;
        updated[index].unit = parsed.unit;
        updated[index].value = parsed.value;
        updated[index].days = Math.ceil(parsed.totalHours / 24);
        updated[index].hours = parsed.totalHours;
      }
    }

    setPunishments(updated);
  };

  const handleSetPunishmentUnit = (index: number, unit: DurationUnit) => {
    const updated = [...punishments];
    const p = updated[index];
    if (unit === 'perm') {
      updated[index] = {
        ...p,
        unit: 'perm',
        value: 0,
        hours: 999999,
        days: 9999,
        isPerm: true,
        penalty: 'باند بيرم (نهائي)',
      };
    } else if (unit === 'months') {
      const val = p.unit === 'months' && p.value ? p.value : 1;
      updated[index] = {
        ...p,
        unit: 'months',
        value: val,
        hours: val * 720,
        days: val * 30,
        isPerm: false,
        penalty: val === 1 ? 'باند شهر' : val === 2 ? 'باند شهرين' : `باند ${val} أشهر`,
      };
    } else if (unit === 'days') {
      const val = p.unit === 'days' && p.value ? p.value : (p.days && p.days <= 60 ? p.days : 7);
      updated[index] = {
        ...p,
        unit: 'days',
        value: val,
        hours: val * 24,
        days: val,
        isPerm: false,
        penalty: val === 7 ? 'باند أسبوع' : val === 14 ? 'باند أسبوعين' : val === 30 ? 'باند شهر' : val === 1 ? 'باند يوم' : val === 2 ? 'باند يومين' : `باند ${val} أيام`,
      };
    } else { // 'hours'
      const val = p.unit === 'hours' && p.value ? p.value : (p.hours && p.hours <= 72 ? p.hours : 5);
      updated[index] = {
        ...p,
        unit: 'hours',
        value: val,
        hours: val,
        days: Math.ceil(val / 24),
        isPerm: false,
        penalty: val === 1 ? 'ساعة واحدة' : val === 2 ? 'ساعتين' : val <= 10 ? `${val} ساعات` : `${val} ساعة`,
      };
    }
    setPunishments(updated);
  };

  const handleSetPunishmentValue = (index: number, val: number) => {
    const updated = [...punishments];
    const p = updated[index];
    const unit = p.unit || (p.isPerm ? 'perm' : (p.hours && p.hours < 24 ? 'hours' : p.days ? 'days' : 'hours'));
    const safeVal = Math.max(1, isNaN(val) ? 1 : val);

    if (unit === 'hours') {
      updated[index] = {
        ...p,
        unit: 'hours',
        value: safeVal,
        hours: safeVal,
        days: Math.ceil(safeVal / 24),
        isPerm: false,
        penalty: safeVal === 1 ? 'ساعة واحدة' : safeVal === 2 ? 'ساعتين' : safeVal <= 10 ? `${safeVal} ساعات` : `${safeVal} ساعة`,
      };
    } else if (unit === 'days') {
      updated[index] = {
        ...p,
        unit: 'days',
        value: safeVal,
        hours: safeVal * 24,
        days: safeVal,
        isPerm: false,
        penalty: safeVal === 7 ? 'باند أسبوع' : safeVal === 14 ? 'باند أسبوعين' : safeVal === 30 ? 'باند شهر' : safeVal === 1 ? 'باند يوم' : safeVal === 2 ? 'باند يومين' : `باند ${safeVal} أيام`,
      };
    } else if (unit === 'months') {
      updated[index] = {
        ...p,
        unit: 'months',
        value: safeVal,
        hours: safeVal * 720,
        days: safeVal * 30,
        isPerm: false,
        penalty: safeVal === 1 ? 'باند شهر' : safeVal === 2 ? 'باند شهرين' : `باند ${safeVal} أشهر`,
      };
    }
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

                  {/* Row 2: Ban Duration Unit Selection & Number (ساعات / أيام / شهور / نهائي) */}
                  {(() => {
                    const currentUnit = p.unit || (p.isPerm ? 'perm' : p.hours && p.hours < 24 ? 'hours' : p.days && p.days >= 30 ? 'months' : 'days');
                    const currentValue = p.value || (currentUnit === 'hours' ? (p.hours || 5) : currentUnit === 'months' ? (p.days ? Math.floor(p.days / 30) : 1) : (p.days || 7));

                    return (
                      <div className="pt-2 border-t border-zinc-800/80 bg-[#0d0a14] p-3 rounded-xl space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-black text-orange-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>مدة الباند للحاسبة:</span>
                          </span>

                          {/* 4 Unit Tabs: ساعات | أيام | شهور | باند نهائي */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSetPunishmentUnit(idx, 'hours')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border flex items-center gap-1 ${
                                currentUnit === 'hours' && !p.isPerm
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.4)] font-black'
                                  : 'bg-[#181326] hover:bg-[#221b36] text-zinc-300 border-zinc-700'
                              }`}
                            >
                              <Timer className="w-3 h-3" />
                              <span>ساعات</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetPunishmentUnit(idx, 'days')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border flex items-center gap-1 ${
                                currentUnit === 'days' && !p.isPerm
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.4)] font-black'
                                  : 'bg-[#181326] hover:bg-[#221b36] text-zinc-300 border-zinc-700'
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              <span>أيام</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetPunishmentUnit(idx, 'months')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border flex items-center gap-1 ${
                                currentUnit === 'months' && !p.isPerm
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.4)] font-black'
                                  : 'bg-[#181326] hover:bg-[#221b36] text-zinc-300 border-zinc-700'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>شهور</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetPunishmentUnit(idx, 'perm')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border flex items-center gap-1 ${
                                p.isPerm || currentUnit === 'perm'
                                  ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] font-black'
                                  : 'bg-[#181326] hover:bg-red-500/20 text-zinc-300 border-zinc-700'
                              }`}
                            >
                              <InfinityIcon className="w-3 h-3" />
                              <span>باند نهائي</span>
                            </button>
                          </div>
                        </div>

                        {/* Duration Number Controller (When not permanent) */}
                        {!p.isPerm && currentUnit !== 'perm' && (
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-zinc-400 font-bold">العدد:</span>
                              <button
                                type="button"
                                onClick={() => handleSetPunishmentValue(idx, Math.max(1, (currentValue || 1) - 1))}
                                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={currentUnit === 'hours' ? 720 : currentUnit === 'days' ? 365 : 24}
                                value={currentValue || 1}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  handleSetPunishmentValue(idx, isNaN(val) ? 1 : val);
                                }}
                                className="w-16 h-7 bg-[#141020] border border-orange-500/50 focus:border-orange-400 rounded-lg text-center text-xs font-black text-amber-400 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSetPunishmentValue(idx, (currentValue || 1) + 1)}
                                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                              <span className="text-xs text-orange-300 font-bold min-w-10">
                                {currentUnit === 'hours'
                                  ? currentValue === 1 ? 'ساعة' : currentValue === 2 ? 'ساعتين' : currentValue <= 10 ? 'ساعات' : 'ساعة'
                                  : currentUnit === 'days'
                                  ? currentValue === 1 ? 'يوم' : currentValue === 2 ? 'يومين' : currentValue <= 10 ? 'أيام' : 'يوم'
                                  : currentValue === 1 ? 'شهر' : currentValue === 2 ? 'شهرين' : `${currentValue} أشهر`}
                              </span>
                            </div>

                            {/* Preset values for the selected unit */}
                            <div className="flex items-center gap-1 flex-wrap">
                              {currentUnit === 'hours' &&
                                [1, 2, 3, 5, 7, 12, 24].map((h) => (
                                  <button
                                    key={h}
                                    type="button"
                                    onClick={() => handleSetPunishmentValue(idx, h)}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                                      currentValue === h
                                        ? 'bg-orange-500 text-black border-orange-400 font-black'
                                        : 'bg-[#1a142c] hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                                    }`}
                                  >
                                    {h}س
                                  </button>
                                ))}

                              {currentUnit === 'days' &&
                                [1, 2, 3, 7, 14, 30].map((d) => (
                                  <button
                                    key={d}
                                    type="button"
                                    onClick={() => handleSetPunishmentValue(idx, d)}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                                      currentValue === d
                                        ? 'bg-orange-500 text-black border-orange-400 font-black'
                                        : 'bg-[#1a142c] hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                                    }`}
                                  >
                                    {d === 7 ? 'أسبوع' : d === 14 ? 'أسبوعين' : d === 30 ? 'شهر' : `${d}ي`}
                                  </button>
                                ))}

                              {currentUnit === 'months' &&
                                [1, 2, 3, 6].map((m) => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => handleSetPunishmentValue(idx, m)}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                                      currentValue === m
                                        ? 'bg-orange-500 text-black border-orange-400 font-black'
                                        : 'bg-[#1a142c] hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                                    }`}
                                  >
                                    {m === 1 ? 'شهر' : m === 2 ? 'شهرين' : `${m} شهور`}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}

                        {p.isPerm && (
                          <div className="text-[11px] font-bold text-red-400 bg-red-950/30 border border-red-500/30 rounded-lg p-1.5 text-center">
                            ⛔ حظر دائم وغير محدد المدة (أمر: /ban [ID] 0)
                          </div>
                        )}
                      </div>
                    );
                  })()}
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
