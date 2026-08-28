import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Sparkles, Shield, Palette, X, Search } from 'lucide-react';
import { ManagementTierGroup, PresetRankItem, getRankColor, ARABIC_PRESET_NAMES } from '../utils/ranksConfig';

interface RankDropdownMenuProps {
  currentRankName: string;
  currentRankColor?: string;
  activeTiers: ManagementTierGroup[];
  customRankColors?: Record<string, string>;
  onSelectRank: (newRankName: string) => void;
  onCustomizeRank: (rankName: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const RankDropdownMenu: React.FC<RankDropdownMenuProps> = ({
  currentRankName,
  currentRankColor,
  activeTiers,
  customRankColors,
  onSelectRank,
  onCustomizeRank,
  disabled = false,
  size = 'sm',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    right: number;
    openUpward: boolean;
  }>({ top: 0, right: 0, openUpward: false });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Flatten ranks to find match
  const allRanks: PresetRankItem[] = activeTiers.flatMap((t) => t.ranks);
  const matchedRank = allRanks.find(
    (r) => r.name.toLowerCase() === currentRankName.toLowerCase() || r.defaultName.toLowerCase() === currentRankName.toLowerCase()
  );

  const rankColor = currentRankColor || getRankColor(currentRankName, customRankColors, allRanks);
  const rankNumber = matchedRank?.number ? `#${matchedRank.number}` : '';

  // Position calculation on open
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      const menuHeight = 400;
      const menuWidth = Math.min(320, windowWidth - 24);

      const spaceBelow = windowHeight - rect.bottom;
      const openUpward = spaceBelow < menuHeight && rect.top > menuHeight;

      let top = openUpward ? rect.top - 8 : rect.bottom + 6;
      let right = windowWidth - rect.right;

      if (right + menuWidth > windowWidth - 12) {
        right = 12;
      }
      if (right < 12) {
        right = 12;
      }

      setDropdownPosition({
        top,
        right,
        openUpward,
      });
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (rankName: string) => {
    onSelectRank(rankName);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative inline-block text-right" dir="rtl">
      {/* Trigger Badge Button */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 rounded-xl font-black transition-all cursor-pointer border select-none ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-500'
            : 'hover:scale-[1.03] shadow-md active:scale-95'
        } ${size === 'sm' ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'}`}
        style={{
          backgroundColor: `${rankColor}18`,
          borderColor: `${rankColor}50`,
          color: rankColor,
        }}
        title="انقر لتغيير أو تخصيص الرتبة الإدارية (RGB)"
      >
        <span
          className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_currentColor]"
          style={{ backgroundColor: rankColor, color: rankColor }}
        />
        {rankNumber && (
          <span
            className="text-[10px] font-mono px-1 py-0.2 rounded border opacity-90"
            style={{
              backgroundColor: `${rankColor}20`,
              borderColor: `${rankColor}40`,
            }}
          >
            {rankNumber}
          </span>
        )}
        <span className="truncate max-w-[130px]">{currentRankName}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 opacity-70 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Rank Selector Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-[99999] w-72 sm:w-80 max-h-[420px] flex flex-col rounded-2xl bg-[#0d091a] border border-orange-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl p-2.5 animate-fadeIn text-right"
          style={{
            top: dropdownPosition.openUpward ? 'auto' : `${dropdownPosition.top}px`,
            bottom: dropdownPosition.openUpward
              ? `${window.innerHeight - dropdownPosition.top}px`
              : 'auto',
            right: `${dropdownPosition.right}px`,
          }}
          dir="rtl"
        >
          {/* Header & Quick Search */}
          <div className="px-1 py-1 border-b border-zinc-800/80 mb-2 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-zinc-200 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-orange-400" />
                <span>الرتب الإدارية الـ 25 (RGB)</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onCustomizeRank(currentRankName);
                  }}
                  className="px-2 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                  title="تخصيص ألوان واسم الرتبة"
                >
                  <Palette className="w-3 h-3" />
                  <span>تخصيص RGB</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث عن رتبة بالاسم أو الرقم..."
                className="w-full bg-[#171226] border border-zinc-700/70 focus:border-orange-500 rounded-xl px-2.5 py-1.5 pl-7 text-[11px] text-white outline-none placeholder:text-zinc-500"
              />
              <Search className="w-3 h-3 text-zinc-400 absolute left-2 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Ranks list grouped by Tier */}
          <div
            className="space-y-3 overflow-y-auto pr-1 flex-1"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#f97316 #141122',
            }}
          >
            {activeTiers.map((tier) => {
              const filteredRanks = tier.ranks.filter((r) => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                const arabicName = ARABIC_PRESET_NAMES[r.number] || '';
                return (
                  r.name.toLowerCase().includes(q) ||
                  r.defaultName.toLowerCase().includes(q) ||
                  arabicName.toLowerCase().includes(q) ||
                  r.number.toString().includes(q)
                );
              });

              if (filteredRanks.length === 0) return null;

              return (
                <div key={tier.id} className="space-y-1">
                  {/* Tier Title */}
                  <div className="flex items-center justify-between px-2 py-0.5 text-[10px] font-black text-zinc-400 border-b border-zinc-800/40">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-orange-400" />
                      <span>{tier.title}</span>
                    </span>
                    <span className="text-zinc-500 font-mono text-[9px]">
                      {tier.description}
                    </span>
                  </div>

                  {/* Ranks in this tier */}
                  <div className="grid grid-cols-1 gap-1">
                    {filteredRanks.map((r) => {
                      const isSelected = currentRankName.toLowerCase() === r.name.toLowerCase() || currentRankName.toLowerCase() === r.defaultName.toLowerCase();
                      const itemColor = getRankColor(r.name, customRankColors, allRanks);
                      const arabicLabel = ARABIC_PRESET_NAMES[r.number];

                      return (
                        <button
                          key={r.id || r.number}
                          type="button"
                          onClick={() => handleSelect(r.name)}
                          className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between text-right cursor-pointer border ${
                            isSelected
                              ? 'shadow-md ring-1'
                              : 'hover:brightness-125'
                          }`}
                          style={{
                            backgroundColor: isSelected
                              ? `${itemColor}30`
                              : `${itemColor}10`,
                            borderColor: isSelected
                              ? itemColor
                              : `${itemColor}30`,
                            color: itemColor,
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_currentColor]"
                              style={{ backgroundColor: itemColor, color: itemColor }}
                            />
                            <span
                              className="text-[10px] font-mono px-1 py-0.2 rounded border shrink-0 opacity-80"
                              style={{
                                backgroundColor: `${itemColor}20`,
                                borderColor: `${itemColor}40`,
                              }}
                            >
                              #{r.number}
                            </span>
                            <span className="font-extrabold truncate">{r.name}</span>
                            {arabicLabel && (
                              <span className="text-[10px] opacity-70 truncate text-zinc-400">
                                ({arabicLabel.split('(')[0].trim()})
                              </span>
                            )}
                          </div>

                          {isSelected && (
                            <Check className="w-3.5 h-3.5 shrink-0" style={{ color: itemColor }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
