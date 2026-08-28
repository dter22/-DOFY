import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Briefcase, Shield, Crown, User, X, Search, Sparkles } from 'lucide-react';
import { ResponsibilityItem } from '../utils/responsibilitiesConfig';

interface ResponsibilityDropdownMenuProps {
  value?: string; // single role name or 'none' (backward compat)
  values?: string[]; // multiple role names (e.g. ['Censorship Team', 'Event Supervisor'])
  responsibilities: ResponsibilityItem[];
  onChange?: (roleName: string, respColor?: string) => void;
  onChangeMulti?: (roles: string[], colorsMap: Record<string, string>) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const ResponsibilityDropdownMenu: React.FC<ResponsibilityDropdownMenuProps> = ({
  value,
  values,
  responsibilities,
  onChange,
  onChangeMulti,
  disabled = false,
  size = 'sm',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute currently selected role list
  const selectedRoles: string[] = React.useMemo(() => {
    if (values && Array.isArray(values) && values.length > 0) {
      return values.filter((v) => v && v !== 'none');
    }
    if (value && value !== 'none') {
      return [value];
    }
    return [];
  }, [value, values]);

  // Close on outside click or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Helper to find role metadata
  const getRoleDetails = (roleName: string) => {
    for (const resp of responsibilities) {
      const found = resp.roles.find((r) => r.name.toLowerCase() === roleName.toLowerCase());
      if (found) {
        return {
          role: found,
          resp,
          color: resp.color || '#EF4444',
          label: `${found.name} (${found.labelArabic})`,
        };
      }
    }
    return {
      role: null,
      resp: null,
      color: '#EF4444',
      label: roleName,
    };
  };

  // Toggle role selection
  const handleToggleRole = (roleName: string, respColor?: string) => {
    let nextSelected: string[];
    if (selectedRoles.includes(roleName)) {
      nextSelected = selectedRoles.filter((r) => r !== roleName);
    } else {
      nextSelected = [...selectedRoles, roleName];
    }

    const colorsMap: Record<string, string> = {};
    nextSelected.forEach((rName) => {
      const dt = getRoleDetails(rName);
      colorsMap[rName] = dt.color;
    });

    if (onChangeMulti) {
      onChangeMulti(nextSelected, colorsMap);
    }
    if (onChange) {
      onChange(nextSelected[0] || 'none', respColor || colorsMap[nextSelected[0]]);
    }
  };

  const handleClearAll = () => {
    if (onChangeMulti) {
      onChangeMulti([], {});
    }
    if (onChange) {
      onChange('none', '#71717a');
    }
  };

  const filteredResponsibilities = responsibilities.filter((resp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      resp.name.toLowerCase().includes(q) ||
      resp.roles.some(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.labelArabic.toLowerCase().includes(q)
      )
    );
  });

  return (
    <div ref={containerRef} className="relative inline-block text-right" dir="rtl">
      {/* Trigger Button - Clean & Responsive */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between gap-2 rounded-xl font-bold transition-all cursor-pointer border select-none min-w-[150px] max-w-[230px] ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-500'
            : 'hover:border-orange-500/60 shadow-sm active:scale-[0.99]'
        } ${
          size === 'sm'
            ? 'text-xs px-3 py-1.5'
            : 'text-xs px-3.5 py-2'
        } ${
          selectedRoles.length > 0
            ? 'bg-[#141022] border-orange-500/35 text-white'
            : 'bg-[#100d18] border-zinc-800 text-zinc-400 hover:text-zinc-200'
        }`}
        title={
          selectedRoles.length > 0
            ? `المسؤوليات: ${selectedRoles.join(' • ')}`
            : 'تعيين مسؤولية'
        }
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          {selectedRoles.length === 0 ? (
            <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
              <span className="w-2 h-2 rounded-full shrink-0 bg-zinc-600" />
              <span className="truncate text-xs">تعيين مسؤولية...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              {selectedRoles.slice(0, 2).map((rName) => {
                const dt = getRoleDetails(rName);
                return (
                  <span
                    key={rName}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black border shadow-xs"
                    style={{
                      backgroundColor: `${dt.color}18`,
                      borderColor: `${dt.color}60`,
                      color: dt.color,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: dt.color }}
                    />
                    <span className="truncate max-w-[95px]">{rName}</span>
                  </span>
                );
              })}
              {selectedRoles.length > 2 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-orange-500/20 border border-orange-500/50 text-orange-300">
                  +{selectedRoles.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 text-orange-400/80 ${
            isOpen ? 'rotate-180 text-orange-400' : ''
          }`}
        />
      </button>

      {/* Long / Tall Dropdown Menu - Aligned directly below button */}
      {isOpen && (
        <div
          className="absolute z-50 right-0 top-full mt-2 w-[310px] sm:w-[330px] rounded-2xl bg-[#0c0915] border-2 border-orange-500/40 shadow-[0_15px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl p-3 flex flex-col text-right animate-in fade-in zoom-in-95 duration-150"
          dir="rtl"
        >
          {/* Header & Search */}
          <div className="pb-2.5 border-b border-orange-500/20 mb-2 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-orange-400" />
                <span>قائمة المسؤوليات والفرق</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن مسؤولية..."
                className="w-full bg-[#141022] border border-orange-500/30 focus:border-orange-500 rounded-xl px-3 py-1.5 pl-8 text-xs text-white outline-none placeholder:text-zinc-500 transition"
                autoFocus
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Long / Tall Scrollable List (Comfortable height) */}
          <div
            className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-[380px]"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#f97316 #141122',
            }}
          >
            {filteredResponsibilities.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                لا توجد مسؤوليات تطابق بحثك
              </div>
            ) : (
              filteredResponsibilities.map((resp) => {
                const respColor = resp.color || '#EF4444';

                return (
                  <div
                    key={resp.id}
                    className="rounded-xl border p-2 transition"
                    style={{
                      backgroundColor: `${respColor}08`,
                      borderColor: `${respColor}25`,
                    }}
                  >
                    {/* Category Header */}
                    <div className="flex items-center justify-between gap-1.5 px-1 pb-1 mb-1.5 border-b border-white/5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: respColor }}
                        />
                        <span
                          className="text-xs font-black tracking-tight truncate"
                          style={{ color: respColor }}
                        >
                          {resp.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {resp.roles.length} رتب
                      </span>
                    </div>

                    {/* Sub-Roles */}
                    <div className="space-y-1">
                      {resp.roles.map((rl) => {
                        const isSelected = selectedRoles.includes(rl.name);
                        const isManager = rl.type === 'manager' || rl.labelArabic === 'القائد';
                        const isSupervisor = rl.type === 'supervisor' || rl.labelArabic === 'المشرف';

                        return (
                          <button
                            key={rl.id || rl.name}
                            type="button"
                            onClick={() => handleToggleRole(rl.name, respColor)}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between text-right cursor-pointer border ${
                              isSelected
                                ? 'shadow-md ring-1 ring-orange-400'
                                : 'hover:brightness-115'
                            }`}
                            style={{
                              backgroundColor: isSelected
                                ? `${respColor}30`
                                : `${respColor}10`,
                              borderColor: isSelected
                                ? '#ffffff'
                                : `${respColor}30`,
                              color: isSelected ? '#ffffff' : respColor,
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {/* Checkbox */}
                              <div
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                                  isSelected
                                    ? 'bg-orange-500 text-black border-orange-400'
                                    : 'border-zinc-600 bg-black/40'
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>

                              {isManager ? (
                                <Crown className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                              ) : isSupervisor ? (
                                <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: isSelected ? '#ffffff' : respColor }} />
                              ) : (
                                <User className="w-3.5 h-3.5 shrink-0 opacity-70" style={{ color: isSelected ? '#ffffff' : respColor }} />
                              )}

                              <span className="font-bold truncate text-xs">
                                {rl.name}
                              </span>
                            </div>

                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 opacity-80"
                              style={{
                                backgroundColor: isSelected ? 'rgba(0,0,0,0.4)' : `${respColor}20`,
                                color: isSelected ? '#ffffff' : respColor,
                              }}
                            >
                              {rl.labelArabic}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Clear & Done */}
          <div className="pt-2 mt-2 border-t border-orange-500/20 flex items-center justify-between shrink-0">
            {selectedRoles.length > 0 ? (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-red-400 hover:text-red-300 font-bold cursor-pointer transition px-1.5 py-1 rounded hover:bg-red-500/10"
              >
                إلغاء التعيين
              </button>
            ) : (
              <span className="text-[11px] text-zinc-500">لم يتم التحديد</span>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-black shadow-md transition cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>إغلاق</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
