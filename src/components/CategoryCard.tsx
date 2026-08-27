import React, { useState } from 'react';
import { RuleCategory, ViolationItem } from '../types';
import { Copy, Check, Edit2, Plus, Trash2, Calculator, CheckCircle2 } from 'lucide-react';

interface CategoryCardProps {
  category: RuleCategory;
  searchTerm: string;
  canEdit: boolean;
  onSelectViolation: (violation: ViolationItem, category: RuleCategory) => void;
  onQuickBan: (violation: ViolationItem, category: RuleCategory, timesIndex?: number) => void;
  onEditCategory: (category: RuleCategory) => void;
  onQuickDeleteViolation?: (categoryId: string, violationId: string) => void;
  selectedViolationsMap?: Record<string, number>; // violationId -> occurrenceIndex
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  searchTerm,
  canEdit,
  onSelectViolation,
  onQuickBan,
  onEditCategory,
  onQuickDeleteViolation,
  selectedViolationsMap = {},
}) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopyText = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 1800);
  };

  // Highlight matching search query
  const renderHighlighted = (text: string) => {
    if (!searchTerm.trim()) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={i} className="bg-orange-500 text-black px-1 rounded font-black">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const isAbsolute = category.isAbsolutePerm;

  return (
    <div
      id={`category-${category.id}`}
      className={`group relative flex flex-col justify-between rounded-2xl bg-[#0e0c14]/90 backdrop-blur-xl transition-all duration-300 shadow-[0_12px_35px_rgba(0,0,0,0.7),0_0_20px_rgba(249,115,22,0.06)] hover:shadow-[0_18px_45px_rgba(0,0,0,0.85),0_0_30px_rgba(249,115,22,0.18)] hover:-translate-y-0.5 overflow-hidden ${
        isAbsolute
          ? 'border border-red-600/50 hover:border-red-500/80 shadow-[0_0_25px_rgba(220,38,38,0.1)]'
          : 'border border-orange-500/30 hover:border-orange-500/70'
      }`}
    >
      {/* Ambient glowing top accent strip */}
      <div
        className={`h-1.5 w-full ${
          isAbsolute
            ? 'bg-gradient-to-r from-red-600 via-orange-500 to-red-600'
            : 'bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600'
        }`}
      />

      {/* Card Header matching exact style with optional Edit Button */}
      <div className="pt-4 pb-2.5 px-4 relative flex items-center justify-between">
        <div className="flex-1 text-center">
          <h3
            className={`text-lg sm:text-xl font-black tracking-wide font-['Cairo'] drop-shadow-[0_0_12px_rgba(249,115,22,0.4)] ${
              isAbsolute ? 'text-red-400' : 'text-orange-500'
            }`}
          >
            {category.title}
          </h3>
        </div>

        {/* Edit Button for Authorized Users */}
        {canEdit && (
          <button
            type="button"
            onClick={() => onEditCategory(category)}
            className="absolute left-3 top-4 p-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500 hover:text-black text-orange-400 border border-orange-500/40 transition cursor-pointer shadow-sm"
            title="تعديل هذا الصندوق بالكامل"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Card Body */}
      <div className="px-4 pb-4 flex-1 flex flex-col justify-between space-y-4">
        
        {/* SECTION 1: المخالفات */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4
              className={`text-xs sm:text-sm font-black tracking-wide ${
                isAbsolute ? 'text-red-400' : 'text-orange-400'
              }`}
            >
              {category.violationsSectionTitle || 'المخالفات:'}
            </h4>

            {canEdit && (
              <button
                type="button"
                onClick={() => onEditCategory(category)}
                className="text-[11px] text-zinc-400 hover:text-orange-400 font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3 h-3 text-orange-500" /> إضافة / تعديل
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {category.violations.map((violation) => {
              const isMatch =
                searchTerm.trim() &&
                (violation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  category.title.toLowerCase().includes(searchTerm.toLowerCase()));

              const isAddedToCalc = violation.id in selectedViolationsMap;

              return (
                <div
                  key={violation.id}
                  onClick={() => onQuickBan(violation, category, selectedViolationsMap[violation.id] ?? 0)}
                  className={`group/item relative flex items-center justify-between px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
                    isAddedToCalc
                      ? 'bg-orange-500/20 border-2 border-orange-400 text-white font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                      : isMatch
                      ? 'bg-orange-500/15 border border-orange-500 text-white font-bold'
                      : 'bg-[#15121c]/90 hover:bg-[#1f1a29] border border-zinc-800/80 hover:border-orange-500/50 text-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
                  }`}
                  title="انقر لإضافة المخالفة لحاسبة الباند الجانبية وحساب المدة"
                >
                  <div className="flex items-center gap-2 text-right">
                    {isAddedToCalc ? (
                      <span className="p-1 rounded-md bg-orange-500 text-black shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>
                    ) : (
                      <span className="p-1 rounded-md bg-[#221c30] text-zinc-400 group-hover/item:text-orange-400 group-hover/item:bg-orange-500/20 transition shrink-0">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className="leading-snug">
                      {renderHighlighted(violation.name)}
                    </span>
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition mr-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleCopyText(e, violation.name, violation.id)}
                      className="p-1 rounded bg-zinc-800/90 hover:bg-orange-500 hover:text-black text-zinc-400 transition"
                      title="نسخ نص المخالفة"
                    >
                      {copiedItem === violation.id ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {canEdit && onQuickDeleteViolation && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`هل أنت متأكد من حذف مخالفة: "${violation.name}"؟`)) {
                            onQuickDeleteViolation(category.id, violation.id);
                          }
                        }}
                        className="p-1 rounded bg-red-950/80 hover:bg-red-600 text-red-400 hover:text-white transition"
                        title="حذف سريع لهذه المخالفة"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: المحاسبات والعقوبات */}
        <div className="pt-2 border-t border-zinc-800/60">
          <div className="mb-2 text-right">
            <h4
              className={`text-xs sm:text-sm font-black tracking-wide ${
                isAbsolute ? 'text-red-400' : 'text-orange-400'
              }`}
            >
              {category.punishmentsSectionTitle || 'المحاسبات والعقوبات:'}
            </h4>
          </div>

          <div className="space-y-1.5">
            {category.punishments.map((punishment, idx) => {
              const isMatch =
                searchTerm.trim() &&
                (punishment.penalty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  punishment.times.toLowerCase().includes(searchTerm.toLowerCase()));

              // Check if single absolute item or regular ladder
              if (isAbsolute) {
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-center text-center p-3 rounded-lg font-bold text-xs sm:text-sm bg-gradient-to-r from-[#2a0b0b] to-[#1f0909] border-2 border-red-600/80 text-white shadow-[0_0_20px_rgba(220,38,38,0.25)]"
                  >
                    <span className="text-red-200 font-black">
                      {punishment.penalty}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className={`group/punish relative flex items-center justify-center text-center py-2 px-3 rounded-lg text-xs sm:text-sm transition font-medium ${
                    isMatch
                      ? 'bg-orange-500/20 border border-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                      : 'bg-[#15121c]/90 hover:bg-[#1f1a29] text-zinc-100 border border-zinc-800/80 shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                  }`}
                  style={{
                    borderRight: '4px solid #10b981', // green strip
                  }}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-zinc-300">
                      {punishment.times}:
                    </span>
                    <span className="text-white font-bold">
                      {renderHighlighted(punishment.penalty)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) =>
                      handleCopyText(
                        e,
                        `${punishment.times}: ${punishment.penalty}`,
                        `${category.id}-p-${idx}`
                      )
                    }
                    className="absolute left-2 p-1 rounded hover:bg-orange-500 hover:text-black text-zinc-400 transition opacity-0 group-hover/punish:opacity-100"
                    title="نسخ نص العقوبة"
                  >
                    {copiedItem === `${category.id}-p-${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

