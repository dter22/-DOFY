import React, { useState, useEffect } from 'react';
import { RuleCategory, ViolationItem, PunishmentTier, DurationUnit } from '../types';
import { X, Save, Plus, Trash2, Edit3, ShieldAlert, ArrowUp, ArrowDown, Clock, CheckCircle2, Timer, Calendar, Infinity as InfinityIcon } from 'lucide-react';
import { parsePenaltyDuration } from '../utils/durationHelper';

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: RuleCategory | null;
  onSaveCategory: (updatedCategory: RuleCategory) => void;
  onDeleteCategory?: (categoryId: string) => void;
}

export const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const [title, setTitle] = useState('');
  const [violationsTitle, setViolationsTitle] = useState('المخالفات:');
  const [punishmentsTitle, setPunishmentsTitle] = useState('المحاسبات والعقوبات:');
  const [isAbsolutePerm, setIsAbsolutePerm] = useState(false);
  const [rowGroup, setRowGroup] = useState('row-1');
  const [violations, setViolations] = useState<ViolationItem[]>([]);
  const [punishments, setPunishments] = useState<PunishmentTier[]>([]);
  const [newViolationName, setNewViolationName] = useState('');

  useEffect(() => {
    if (category) {
      setTitle(category.title);
      setViolationsTitle(category.violationsSectionTitle || 'المخالفات:');
      setPunishmentsTitle(category.punishmentsSectionTitle || 'المحاسبات والعقوبات:');
      setIsAbsolutePerm(category.isAbsolutePerm || false);
      setRowGroup(category.rowGroup || 'row-1');
      setViolations([...category.violations]);
      setPunishments(
        category.punishments.map((p) => {
          const parsed = parsePenaltyDuration(p.penalty, p.hours, p.days, p.isPerm);
          return {
            ...p,
            unit: p.unit || parsed.unit,
            value: p.value || parsed.value,
            hours: typeof p.hours === 'number' ? p.hours : parsed.totalHours,
            days: typeof p.days === 'number' ? p.days : Math.ceil(parsed.totalHours / 24),
            isPerm: p.isPerm ?? parsed.isPerm,
          };
        })
      );
    }
  }, [category, isOpen]);

  if (!isOpen || !category) return null;

  const handleAddViolation = () => {
    if (!newViolationName.trim()) return;
    const newItem: ViolationItem = {
      id: `${category.id}-v-${Date.now()}`,
      name: newViolationName.trim(),
    };
    setViolations([...violations, newItem]);
    setNewViolationName('');
  };

  const handleRemoveViolation = (index: number) => {
    setViolations(violations.filter((_, i) => i !== index));
  };

  const handleViolationChange = (index: number, newName: string) => {
    const updated = [...violations];
    updated[index] = { ...updated[index], name: newName };
    setViolations(updated);
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

  const handleAddPunishment = () => {
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

    const newTier: PunishmentTier = {
      times: tierName,
      penalty: defaultPenalty,
      days: defaultDays,
      hours: defaultDays * 24,
      unit: newTierIndex >= 4 ? 'perm' : 'days',
      value: defaultDays,
      isPerm: newTierIndex >= 4,
    };
    setPunishments([...punishments, newTier]);
  };

  const handleRemovePunishment = (index: number) => {
    setPunishments(punishments.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updated: RuleCategory = {
      ...category,
      title: title.trim(),
      violationsSectionTitle: violationsTitle.trim(),
      punishmentsSectionTitle: punishmentsTitle.trim(),
      isAbsolutePerm,
      rowGroup,
      violations,
      punishments,
    };

    onSaveCategory(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-[#0f0d14] border-2 border-orange-500/40 rounded-2xl shadow-[0_0_50px_rgba(249,115,22,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-orange-950/40 to-[#12101a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-['Cairo']">
                تعديل صندوق: {category.title}
              </h2>
              <p className="text-xs text-zinc-400">يمكنك تعديل أي اسم أو بند أو عقوبة في هذا الصندوق بالكامل</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 text-right">
          
          {/* Main Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-orange-400 mb-1.5">
                عنوان الصندوق / الفئة:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#181520] border border-zinc-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                الصف وموقع العرض:
              </label>
              <select
                value={rowGroup}
                onChange={(e) => setRowGroup(e.target.value)}
                className="w-full bg-[#181520] border border-zinc-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold outline-none"
              >
                <option value="row-1">الصف الأول (أعلى الجدول)</option>
                <option value="row-2">الصف الثاني</option>
                <option value="row-3">الصف الثالث (مستوى الباند القطعي)</option>
                <option value="row-4">الصف الرابع</option>
              </select>
            </div>
          </div>

          {/* Section Titles Customization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#14121a] border border-zinc-800">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                عنوان قسم المخالفات:
              </label>
              <input
                type="text"
                value={violationsTitle}
                onChange={(e) => setViolationsTitle(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-zinc-700 focus:border-orange-500 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                عنوان قسم المحاسبات:
              </label>
              <input
                type="text"
                value={punishmentsTitle}
                onChange={(e) => setPunishmentsTitle(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-zinc-700 focus:border-orange-500 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Violations List Manager */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-orange-400">
                قائمة المخالفات ({violations.length}):
              </span>
              <span className="text-xs text-zinc-400">يمكنك تعديل أي نص مباشرة أو حذفه</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto p-2 bg-[#121018] rounded-xl border border-zinc-800">
              {violations.map((v, i) => (
                <div key={v.id || i} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-500 w-6 text-center">{i + 1}</span>
                  <input
                    type="text"
                    value={v.name}
                    onChange={(e) => handleViolationChange(i, e.target.value)}
                    className="flex-1 bg-[#1c1824] border border-zinc-700 focus:border-orange-500 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveViolation(i)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                    title="حذف هذا البند"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Add Violation */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newViolationName}
                onChange={(e) => setNewViolationName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddViolation();
                  }
                }}
                placeholder="اكتب مخالفة جديدة لإضافتها واضغط إضافة..."
                className="flex-1 bg-[#181520] border border-zinc-700 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white outline-none"
              />
              <button
                type="button"
                onClick={handleAddViolation}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> إضافة
              </button>
            </div>
          </div>

          {/* Punishments Manager */}
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-orange-400">
                درجات العقوبات والمحاسبات ({punishments.length}):
              </span>
              <button
                type="button"
                onClick={handleAddPunishment}
                className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> إضافة درجة عقوبة
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto p-2.5 bg-[#121018] rounded-2xl border border-zinc-800 custom-scrollbar">
              {punishments.map((p, i) => (
                <div
                  key={i}
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
                        onChange={(e) => handlePunishmentFieldChange(i, 'times', e.target.value)}
                        placeholder="المرة الأولى"
                        className="w-full bg-[#1c1824] border border-zinc-700 focus:border-orange-500 rounded-lg px-2.5 py-1.5 text-xs text-orange-300 font-bold outline-none"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] text-zinc-400 font-bold mb-1">
                        نص العقوبة المعروض بالصندوق:
                      </label>
                      <input
                        type="text"
                        value={p.penalty}
                        onChange={(e) => handlePunishmentFieldChange(i, 'penalty', e.target.value)}
                        placeholder="مثال: باند أسبوع، باند 3 أيام..."
                        className="w-full bg-[#1c1824] border border-zinc-700 focus:border-orange-500 rounded-lg px-3 py-1.5 text-xs text-white font-bold outline-none"
                      />
                    </div>

                    {punishments.length > 1 && (
                      <div className="pt-4 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemovePunishment(i)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 transition cursor-pointer"
                          title="حذف هذه العقوبة"
                        >
                          <Trash2 className="w-4 h-4" />
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
                              onClick={() => handleSetPunishmentUnit(i, 'hours')}
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
                              onClick={() => handleSetPunishmentUnit(i, 'days')}
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
                              onClick={() => handleSetPunishmentUnit(i, 'months')}
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
                              onClick={() => handleSetPunishmentUnit(i, 'perm')}
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
                                onClick={() => handleSetPunishmentValue(i, Math.max(1, (currentValue || 1) - 1))}
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
                                  handleSetPunishmentValue(i, isNaN(val) ? 1 : val);
                                }}
                                className="w-16 h-7 bg-[#141020] border border-orange-500/50 focus:border-orange-400 rounded-lg text-center text-xs font-black text-amber-400 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSetPunishmentValue(i, (currentValue || 1) + 1)}
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
                                    onClick={() => handleSetPunishmentValue(i, h)}
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
                                    onClick={() => handleSetPunishmentValue(i, d)}
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
                                    onClick={() => handleSetPunishmentValue(i, m)}
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

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
            {onDeleteCategory && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`هل أنت متأكد من حذف صندوق "${category.title}" بالكامل؟`)) {
                    onDeleteCategory(category.id);
                    onClose();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                حذف الصندوق
              </button>
            )}

            <div className="flex items-center gap-2 mr-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-black font-black text-xs sm:text-sm transition flex items-center gap-1.5 shadow-[0_0_20px_rgba(249,115,22,0.3)] cursor-pointer"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                حفظ التعديلات
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
