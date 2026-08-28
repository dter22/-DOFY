import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  RotateCcw,
  Palette,
  Shield,
  Briefcase,
  Users,
  CheckCircle2,
  AlertCircle,
  Tag,
  Flame,
} from 'lucide-react';
import {
  ResponsibilityItem,
  ResponsibilityRole,
  DEFAULT_RESPONSIBILITIES,
} from '../utils/responsibilitiesConfig';
import { ColorPicker } from './ColorPicker';

interface ResponsibilityManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  responsibilities: ResponsibilityItem[];
  onSaveResponsibilities: (newList: ResponsibilityItem[]) => void;
}

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

export const ResponsibilityManagementModal: React.FC<ResponsibilityManagementModalProps> = ({
  isOpen,
  onClose,
  responsibilities,
  onSaveResponsibilities,
}) => {
  const [items, setItems] = useState<ResponsibilityItem[]>(() => {
    return responsibilities && responsibilities.length > 0 ? responsibilities : DEFAULT_RESPONSIBILITIES;
  });

  const [selectedId, setSelectedId] = useState<string>(() => {
    return (responsibilities && responsibilities[0]?.id) || 'resp-censorship';
  });

  // Adding new responsibility form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRespName, setNewRespName] = useState('');
  const [newRespColor, setNewRespColor] = useState('#EF4444');
  const [newRespDesc, setNewRespDesc] = useState('');

  // Editing state for selected responsibility
  const [editingRoleIdx, setEditingRoleIdx] = useState<number | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleLabel, setNewRoleLabel] = useState('عضو');
  const [isAddingRole, setIsAddingRole] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const currentItem = items.find((it) => it.id === selectedId) || items[0];
  const activeColor = isAddingNew ? newRespColor : (currentItem?.color || '#EF4444');

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Add new responsibility
  const handleCreateResponsibility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRespName.trim()) {
      showNotification('error', 'يرجى إدخال اسم المسؤولية / الفريق');
      return;
    }

    const baseName = newRespName.trim();
    const newId = `resp-${Date.now()}`;
    const newResp: ResponsibilityItem = {
      id: newId,
      name: baseName,
      color: newRespColor,
      description: newRespDesc.trim() || undefined,
      roles: [
        {
          id: `role-${Date.now()}-member`,
          name: baseName,
          type: 'member',
          labelArabic: 'عضو',
        },
        {
          id: `role-${Date.now()}-supervisor`,
          name: `${baseName} Supervisor`,
          type: 'supervisor',
          labelArabic: 'المشرف',
        },
        {
          id: `role-${Date.now()}-manager`,
          name: `${baseName} Manager`,
          type: 'manager',
          labelArabic: 'القائد',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    const updatedList = [...items, newResp];
    setItems(updatedList);
    setSelectedId(newId);
    setIsAddingNew(false);
    setNewRespName('');
    setNewRespDesc('');
    onSaveResponsibilities(updatedList);
    showNotification('success', `تمت إضافة مسؤولية [${baseName}] بنجاح!`);
  };

  // Update current responsibility properties
  const handleUpdateCurrent = (updates: Partial<ResponsibilityItem>) => {
    if (!currentItem) return;
    const updatedList = items.map((it) => (it.id === currentItem.id ? { ...it, ...updates } : it));
    setItems(updatedList);
    onSaveResponsibilities(updatedList);
  };

  // Delete current responsibility
  const handleDeleteResponsibility = (id: string, name: string) => {
    if (items.length <= 1) {
      showNotification('error', 'يجب أن تبقى مسؤولية واحدة على الأقل في النظام.');
      return;
    }
    const updatedList = items.filter((it) => it.id !== id);
    setItems(updatedList);
    setSelectedId(updatedList[0].id);
    onSaveResponsibilities(updatedList);
    showNotification('success', `تم حذف مسؤولية [${name}]`);
  };

  // Add role to current responsibility
  const handleAddRoleToCurrent = () => {
    if (!newRoleName.trim() || !currentItem) return;
    const newRole: ResponsibilityRole = {
      id: `role-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: newRoleName.trim(),
      type: 'custom',
      labelArabic: newRoleLabel.trim() || 'عضو',
    };
    const updatedRoles = [...currentItem.roles, newRole];
    handleUpdateCurrent({ roles: updatedRoles });
    setNewRoleName('');
    setIsAddingRole(false);
    showNotification('success', `تمت إضافة الرتبة [${newRole.name}] للمسؤولية`);
  };

  // Update role inside current responsibility
  const handleUpdateRole = (roleIdx: number, newName: string, newLabel: string) => {
    if (!currentItem || !newName.trim()) return;
    const updatedRoles = [...currentItem.roles];
    updatedRoles[roleIdx] = {
      ...updatedRoles[roleIdx],
      name: newName.trim(),
      labelArabic: newLabel.trim() || updatedRoles[roleIdx].labelArabic,
    };
    handleUpdateCurrent({ roles: updatedRoles });
    setEditingRoleIdx(null);
    showNotification('success', 'تم تعديل مسمى الرتبة بنجاح');
  };

  // Delete role inside current responsibility
  const handleDeleteRole = (roleIdx: number) => {
    if (!currentItem) return;
    if (currentItem.roles.length <= 1) {
      showNotification('error', 'يجب أن تحتوي المسؤولية على رتبة واحدة على الأقل');
      return;
    }
    const updatedRoles = currentItem.roles.filter((_, idx) => idx !== roleIdx);
    handleUpdateCurrent({ roles: updatedRoles });
    showNotification('success', 'تم حذف الرتبة من المسؤولية');
  };

  // Reset to default
  const handleResetToDefault = () => {
    setItems(DEFAULT_RESPONSIBILITIES);
    setSelectedId(DEFAULT_RESPONSIBILITIES[0].id);
    onSaveResponsibilities(DEFAULT_RESPONSIBILITIES);
    showNotification('success', 'تمت استعادة المسؤوليات الافتراضية (Censorship Team)');
  };

  return (
    <div
      id="responsibility-management-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="responsibility-management-modal-content"
        className="w-full max-w-5xl bg-[#090710] border-2 rounded-3xl p-6 sm:p-8 max-h-[94vh] min-h-[650px] overflow-y-auto custom-scrollbar transition-all duration-300 flex flex-col justify-between"
        style={{
          borderColor: `${activeColor}70`,
          boxShadow: `0 0 60px ${activeColor}30`,
        }}
        dir="rtl"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-4 mb-6 border-b transition-colors duration-300"
          style={{ borderColor: `${activeColor}30` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl p-0.5 flex items-center justify-center transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${activeColor}, #181226)`,
                boxShadow: `0 0 20px ${activeColor}40`,
              }}
            >
              <div className="w-full h-full bg-[#0d0a14] rounded-[14px] flex items-center justify-center">
                <Briefcase className="w-6 h-6" style={{ color: activeColor }} />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>إدارة وتخصيص المسؤوليات والفرق</span>
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full border font-bold transition-all duration-300"
                  style={{
                    backgroundColor: `${activeColor}20`,
                    borderColor: `${activeColor}60`,
                    color: activeColor,
                  }}
                >
                  فرق العمل الإدارية
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                إضافة وتعديل أقسام وفرق المسؤوليات (مثل Censorship Team، Event Team)، تخصيص الألوان، وتحديد رتب العضو والمشرف والقائد
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-5 p-3.5 rounded-2xl flex items-center gap-2.5 border text-xs sm:text-sm font-bold animate-fadeIn ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Main Grid: Left Sidebar for Teams List, Right Area for Editing Selected Team */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Sidebar: Responsibilities List (md:col-span-4) */}
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-zinc-300 flex items-center gap-1.5">
                <Users className="w-4 h-4" style={{ color: activeColor }} />
                قائمة المسؤوليات ({items.length})
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="text-[11px] font-black px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer"
                style={{
                  backgroundColor: `${activeColor}20`,
                  borderColor: `${activeColor}50`,
                  color: activeColor,
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة مسؤولية
              </button>
            </div>

            {/* List of Responsibilities */}
            <div className="space-y-2.5 max-h-[580px] overflow-y-auto custom-scrollbar pr-1">
              {items.map((resp) => {
                const isSelected = currentItem?.id === resp.id && !isAddingNew;
                const itemColor = resp.color || '#EF4444';
                return (
                  <button
                    key={resp.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(resp.id);
                      setIsAddingNew(false);
                      setEditingRoleIdx(null);
                      setIsAddingRole(false);
                    }}
                    className="w-full text-right p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-2 cursor-pointer"
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${itemColor}22`,
                            borderColor: itemColor,
                            boxShadow: `0 0 22px ${itemColor}45`,
                            outline: `1.5px solid ${itemColor}`,
                          }
                        : {
                            backgroundColor: '#120f1f',
                            borderColor: 'rgba(39, 39, 42, 0.8)',
                          }
                    }
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-md border border-white/60"
                        style={{
                          backgroundColor: itemColor,
                          boxShadow: `0 0 8px ${itemColor}80`,
                        }}
                      />
                      <div className="min-w-0">
                        <strong className="text-xs sm:text-sm font-black text-white block truncate">
                          {resp.name}
                        </strong>
                        <span className="text-[10px] text-zinc-400">
                          {resp.roles.length} رتب وأدوار
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span
                        className="w-2.5 h-2.5 rounded-full animate-pulse shadow-md shrink-0"
                        style={{
                          backgroundColor: itemColor,
                          boxShadow: `0 0 10px ${itemColor}`,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Reset to Default Button */}
            <button
              type="button"
              onClick={handleResetToDefault}
              className="w-full mt-3 py-2 px-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              استعادة الافتراضي (Censorship Team)
            </button>
          </div>

          {/* Right Editor Area (md:col-span-8) */}
          <div className="md:col-span-8">
            {isAddingNew ? (
              /* Add New Responsibility Form */
              <form
                onSubmit={handleCreateResponsibility}
                className="p-5 rounded-2xl bg-[#120f1f] border space-y-4 transition-all duration-300"
                style={{ borderColor: `${newRespColor}50` }}
              >
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Plus className="w-4 h-4" style={{ color: newRespColor }} />
                    إضافة مسؤولية أو فريق عمل جديد
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    إلغاء
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: newRespColor }}>
                    اسم المسؤولية / الفريق (بالإنجليزي أو العربي):
                  </label>
                  <input
                    type="text"
                    value={newRespName}
                    onChange={(e) => setNewRespName(e.target.value)}
                    placeholder="مثال: Event Team / فريق الفعاليات"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#0a0812] border border-zinc-700 text-white text-sm font-bold placeholder-zinc-500 outline-none transition"
                    style={{ borderColor: `${newRespColor}60` }}
                    required
                  />
                  <span className="text-[11px] text-zinc-400 mt-1 block">
                    سيتم تلقائياً إنشاء رتب: العضو والمشرف والقائد (مثل {newRespName || 'Team'} Supervisor و {newRespName || 'Team'} Manager).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    وصف أو مهام المسؤولية (اختياري):
                  </label>
                  <input
                    type="text"
                    value={newRespDesc}
                    onChange={(e) => setNewRespDesc(e.target.value)}
                    placeholder="مثال: مسؤول عن تنظيم المسابقات والفعاليات الأسبوعية"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0a0812] border border-zinc-700 text-white text-xs placeholder-zinc-500 outline-none transition"
                  />
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" style={{ color: newRespColor }} />
                    اختر اللون المخصص للمسؤولية:
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewRespColor(c)}
                        className={`w-8 h-8 rounded-xl border-2 transition-all cursor-pointer ${
                          newRespColor.toLowerCase() === c.toLowerCase()
                            ? 'border-white scale-110 shadow-lg'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <ColorPicker color={newRespColor} onChange={(c) => setNewRespColor(c)} />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-white text-xs font-black shadow-lg flex items-center gap-1.5 transition"
                    style={{
                      backgroundColor: newRespColor,
                      boxShadow: `0 0 20px ${newRespColor}60`,
                    }}
                  >
                    <Check className="w-4 h-4" />
                    حفظ المسؤولية الجديدة
                  </button>
                </div>
              </form>
            ) : currentItem ? (
              /* Selected Responsibility Details & Roles Editor */
              <div
                className="p-5 rounded-2xl bg-[#120f1f] border space-y-5 transition-all duration-300"
                style={{ borderColor: `${currentItem.color}45` }}
              >
                
                {/* Top Info & Delete Responsibility */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b"
                  style={{ borderColor: `${currentItem.color}25` }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border border-white/60 shadow-md"
                        style={{ backgroundColor: currentItem.color }}
                      />
                      <h3 className="text-base font-black text-white">{currentItem.name}</h3>
                      <span
                        className="px-2.5 py-0.5 rounded-lg text-xs font-bold border"
                        style={{
                          backgroundColor: `${currentItem.color}20`,
                          borderColor: `${currentItem.color}80`,
                          color: currentItem.color,
                          boxShadow: `0 0 12px ${currentItem.color}25`,
                        }}
                      >
                        معاينة الشارة
                      </span>
                    </div>
                    {currentItem.description && (
                      <p className="text-xs text-zinc-400 mt-1">{currentItem.description}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteResponsibility(currentItem.id, currentItem.name)}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer hover:scale-105"
                    style={{
                      backgroundColor: `${currentItem.color}15`,
                      borderColor: `${currentItem.color}40`,
                      color: currentItem.color,
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف المسؤولية
                  </button>
                </div>

                {/* Edit Name & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      تعديل اسم المسؤولية:
                    </label>
                    <input
                      type="text"
                      value={currentItem.name}
                      onChange={(e) => handleUpdateCurrent({ name: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-[#0a0812] border border-zinc-700 text-white text-xs font-bold outline-none transition"
                      style={{
                        borderColor: `${currentItem.color}50`,
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      الوصف / المهام:
                    </label>
                    <input
                      type="text"
                      value={currentItem.description || ''}
                      onChange={(e) => handleUpdateCurrent({ description: e.target.value })}
                      placeholder="مثال: مسؤول عن الرقابة والتفتيش أو تنظيم الفعاليات"
                      className="w-full h-10 px-3 rounded-xl bg-[#0a0812] border border-zinc-700 text-white text-xs outline-none transition"
                    />
                  </div>
                </div>

                {/* Color Palette / RGB Customizer */}
                <div
                  className="p-3.5 rounded-xl bg-[#0a0812] border space-y-3 transition-colors"
                  style={{ borderColor: `${currentItem.color}35` }}
                >
                  <div className="flex items-center justify-between">
                    <label
                      className="text-xs font-bold flex items-center gap-1.5"
                      style={{ color: currentItem.color }}
                    >
                      <Palette className="w-3.5 h-3.5" style={{ color: currentItem.color }} />
                      لون الشارة والرتب (RGB):
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm"
                        style={{ backgroundColor: currentItem.color }}
                      />
                      <span
                        className="text-xs font-mono font-bold px-2 py-0.5 rounded border"
                        style={{
                          color: currentItem.color,
                          borderColor: `${currentItem.color}60`,
                          backgroundColor: `${currentItem.color}15`,
                        }}
                      >
                        {currentItem.color}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleUpdateCurrent({ color: c })}
                        className={`w-7 h-7 rounded-lg border-2 transition-all cursor-pointer ${
                          currentItem.color.toLowerCase() === c.toLowerCase()
                            ? 'border-white scale-110 shadow-lg'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <ColorPicker
                    color={currentItem.color}
                    onChange={(newHex) => handleUpdateCurrent({ color: newHex })}
                  />
                </div>

                {/* Roles / Positions Inside This Responsibility (عضو، مشرف، قائد) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                        <Tag className="w-4 h-4" style={{ color: currentItem.color }} />
                        رتب وأدوار المسؤولية (عضو، مشرف، قائد):
                      </h4>
                      <span className="text-[11px] text-zinc-400">
                        يمكنك تعديل مسمى كل دور ليظهر في بطاقة الإداري وجدول الإدارة
                      </span>
                    </div>

                    {!isAddingRole && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingRole(true);
                          setNewRoleName(`${currentItem.name} `);
                        }}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition hover:scale-105"
                        style={{
                          backgroundColor: `${currentItem.color}15`,
                          borderColor: `${currentItem.color}40`,
                          color: currentItem.color,
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" style={{ color: currentItem.color }} />
                        إضافة رتبة
                      </button>
                    )}
                  </div>

                  {/* Add Role Inline Form */}
                  {isAddingRole && (
                    <div
                      className="p-3 rounded-xl bg-[#0a0812] border flex flex-col sm:flex-row items-center gap-2 animate-fadeIn"
                      style={{ borderColor: `${currentItem.color}60` }}
                    >
                      <select
                        value={newRoleLabel}
                        onChange={(e) => setNewRoleLabel(e.target.value)}
                        className="h-9 px-2.5 rounded-lg bg-[#141120] border border-zinc-700 text-xs font-bold text-zinc-200 outline-none"
                      >
                        <option value="عضو">عضو</option>
                        <option value="المشرف">المشرف</option>
                        <option value="القائد">القائد</option>
                        <option value="مساعد">مساعد</option>
                        <option value="نائب">نائب</option>
                      </select>

                      <input
                        type="text"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder="اسم الرتبة (مثال: Event Coordinator)"
                        className="flex-1 h-9 px-3 rounded-lg bg-[#141120] border border-zinc-700 text-white text-xs font-bold outline-none"
                      />

                      <div className="flex items-center gap-1 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => setIsAddingRole(false)}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs"
                        >
                          إلغاء
                        </button>
                        <button
                          type="button"
                          onClick={handleAddRoleToCurrent}
                          className="px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1 shadow-md"
                          style={{
                            backgroundColor: currentItem.color,
                            boxShadow: `0 0 15px ${currentItem.color}50`,
                          }}
                        >
                          <Check className="w-3.5 h-3.5" />
                          إضافة
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Roles List */}
                  <div className="space-y-2">
                    {currentItem.roles.map((role, idx) => {
                      const isEditing = editingRoleIdx === idx;
                      return (
                        <div
                          key={role.id || idx}
                          className="p-3 rounded-xl bg-[#0a0812] border border-zinc-800/90 flex items-center justify-between gap-3 hover:border-zinc-700 transition"
                        >
                          {isEditing ? (
                            /* Inline Edit Role Form */
                            <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
                              <input
                                type="text"
                                defaultValue={role.labelArabic}
                                id={`edit-label-${idx}`}
                                placeholder="الصفة (عضو/مشرف/قائد)"
                                className="w-24 h-8 px-2 rounded-lg bg-[#141120] border border-zinc-700 text-xs font-bold text-white outline-none"
                              />
                              <input
                                type="text"
                                defaultValue={role.name}
                                id={`edit-name-${idx}`}
                                placeholder="اسم الرتبة"
                                className="flex-1 h-8 px-2.5 rounded-lg bg-[#141120] border border-zinc-700 text-xs font-bold text-white outline-none"
                              />
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingRoleIdx(null)}
                                  className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs"
                                >
                                  إلغاء
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const labelInput = (document.getElementById(`edit-label-${idx}`) as HTMLInputElement)?.value;
                                    const nameInput = (document.getElementById(`edit-name-${idx}`) as HTMLInputElement)?.value;
                                    handleUpdateRole(idx, nameInput, labelInput);
                                  }}
                                  className="px-2.5 py-1 rounded bg-green-600 text-white text-xs font-bold flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  حفظ
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Normal Role Display */
                            <>
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[10px] font-bold shrink-0">
                                  {role.labelArabic || (role.type === 'manager' ? 'القائد' : role.type === 'supervisor' ? 'المشرف' : 'عضو')}
                                </span>
                                <span
                                  className="px-3 py-1 rounded-xl text-xs font-black border truncate shadow-sm"
                                  style={{
                                    backgroundColor: `${currentItem.color}20`,
                                    borderColor: `${currentItem.color}80`,
                                    color: currentItem.color,
                                    boxShadow: `0 0 12px ${currentItem.color}25`,
                                  }}
                                >
                                  {role.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingRoleIdx(idx)}
                                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                                  title="تعديل اسم الرتبة"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRole(idx)}
                                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                                  title="حذف الرتبة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : null}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-5 mt-6 border-t border-zinc-800">
          <div className="text-xs text-zinc-400">
            يتم حفظ التعديلات تلقائياً وتطبيقها فوراً في جدول الإدارة وبطاقات الطاقم
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-lg transition cursor-pointer hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${activeColor}, #181226)`,
              border: `1px solid ${activeColor}80`,
              boxShadow: `0 0 20px ${activeColor}40`,
              color: '#ffffff',
            }}
          >
            إغلاق وتم
          </button>
        </div>

      </div>
    </div>
  );
};
