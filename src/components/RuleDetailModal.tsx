import React, { useState } from 'react';
import { RuleCategory, ViolationItem } from '../types';
import { X, ShieldAlert, Copy, Check, Calculator, AlertTriangle, ArrowRight, Zap } from 'lucide-react';

interface RuleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  violation: ViolationItem | null;
  category: RuleCategory | null;
  onOpenCalculatorWithViolation: (violation: ViolationItem, category: RuleCategory) => void;
}

export const RuleDetailModal: React.FC<RuleDetailModalProps> = ({
  isOpen,
  onClose,
  violation,
  category,
  onOpenCalculatorWithViolation,
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen || !violation || !category) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#111118] border-2 border-orange-500/40 rounded-2xl shadow-[0_0_50px_rgba(249,115,22,0.25)] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30">
                  {category.title}
                </span>
                {violation.englishTerm && (
                  <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    {violation.englishTerm}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-white mt-1 font-['Cairo']">
                {violation.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1a1a24] hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
          
          {/* Description */}
          <div className="bg-[#151520] border border-zinc-800 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-orange-400 mb-1.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>شرح وتعريف المخالفة:</span>
            </h4>
            <p className="text-sm text-zinc-200 leading-relaxed font-medium">
              {violation.description || 'مخالفة معتمدة ضمن دستور السيرفر تستوجب تطبيق العقوبة وتوثيق الأدلة في السجل الإداري.'}
            </p>
          </div>

          {/* Penalties Ladder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-orange-400 underline underline-offset-4 decoration-orange-500/50">
                تدرج العقوبات المحتسبة:
              </h4>
              <span className="text-[11px] text-zinc-400">تطبيق تصاعدي</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {category.punishments.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#151520] border border-zinc-800"
                  style={{ borderRight: '4px solid #f97316' }}
                >
                  <div>
                    <span className="block text-xs font-bold text-orange-400">{p.times}</span>
                    <span className="text-sm font-black text-white">{p.penalty}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(`${violation.name} - ${p.times}: ${p.penalty}`, `p-${idx}`)}
                    className="p-1.5 rounded bg-zinc-800 hover:bg-orange-500 hover:text-black text-zinc-400 transition"
                    title="نسخ العقوبة"
                  >
                    {copied === `p-${idx}` ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Tips */}
          <div className="p-3.5 bg-orange-500/5 border border-orange-500/20 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-300 leading-relaxed">
              <strong className="text-orange-400">توجيه للإداريين:</strong> احرص دائماً على تسجيل مقطع الفيديو بمدة لا تقل عن دقيقتين توضح سياق السيناريو قبل فرض الباند.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-[#0c0c12] flex items-center justify-between">
          <button
            onClick={() => handleCopy(violation.name, 'name')}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            {copied === 'name' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>نسخ اسم المخالفة</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenCalculatorWithViolation(violation, category);
            }}
            className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(249,115,22,0.4)] cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>فتح في الحاسبة لتنفيذ الباند</span>
          </button>
        </div>

      </div>
    </div>
  );
};
