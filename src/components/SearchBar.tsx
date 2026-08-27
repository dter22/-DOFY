import React, { useState } from 'react';
import { Search, X, ClipboardPaste, Copy, Check } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  totalMatches: number;
  totalItems: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  totalMatches,
  totalItems,
}) => {
  const [copied, setCopied] = useState(false);
  const [pasteFeedback, setPasteFeedback] = useState(false);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          onSearchChange(text.trim());
          setPasteFeedback(true);
          setTimeout(() => setPasteFeedback(false), 1500);
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed or permission denied:', err);
    }
  };

  const handleCopy = () => {
    if (!searchTerm) return;
    navigator.clipboard.writeText(searchTerm);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute right-4 pointer-events-none text-orange-500 flex items-center justify-center">
          <Search className="w-5 h-5 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
        </div>

        {/* Input - fully supports Ctrl+V, Cmd+V, Right-click Paste and text selection */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ابحث بالاسم أو العقوبة أو الصق النص هنا مباشرة..."
          className="w-full h-14 pr-12 pl-36 bg-[#12121a] hover:bg-[#151520] focus:bg-[#181824] border border-orange-500/30 focus:border-orange-500 rounded-2xl text-white placeholder-zinc-500 text-sm sm:text-base font-semibold transition-all duration-200 outline-none shadow-[0_4px_20px_rgba(0,0,0,0.5)] focus:shadow-[0_0_25px_rgba(249,115,22,0.2)]"
        />

        {/* Action Controls inside the Search Bar */}
        <div className="absolute left-3 flex items-center gap-1.5">
          {/* Quick Paste Button from Clipboard */}
          <button
            type="button"
            onClick={handlePaste}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer select-none ${
              pasteFeedback
                ? 'bg-green-500/20 text-green-400 border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                : 'bg-[#1c1728] hover:bg-[#28213b] text-orange-400 hover:text-white border-orange-500/30'
            }`}
            title="لصق سريع من الحافظة (Paste)"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {pasteFeedback ? 'تم اللصق!' : 'لصق سريع'}
            </span>
          </button>

          {/* Copy Current Search */}
          {searchTerm.trim() ? (
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-xl bg-[#1c1728] hover:bg-[#28213b] border border-zinc-700 text-zinc-300 hover:text-white text-xs transition cursor-pointer"
              title="نسخ نص البحث"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          ) : null}

          {/* Clear Search */}
          {searchTerm.trim() ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-white text-xs transition cursor-pointer"
              title="مسح البحث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}

          {/* Results Badge */}
          {searchTerm.trim() ? (
            <span className="hidden md:inline-flex text-[11px] font-bold text-orange-400 bg-orange-500/15 px-2 py-1 rounded-xl border border-orange-500/30">
              {totalMatches}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

