import React, { useState } from 'react';
import { RuleCategory, ViolationItem } from '../types';
import { X, Plus, PlusCircle, Check } from 'lucide-react';

interface AddRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: RuleCategory[];
  onAddViolation: (categoryId: string, violation: ViolationItem) => void;
}

export const AddRuleModal: React.FC<AddRuleModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddViolation,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const [violationName, setViolationName] = useState('');
  const [englishTerm, setEnglishTerm] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!violationName.trim()) {
      setError('يرجى كتابة اسم المخالفة');
      return;
    }

    const newViolation: ViolationItem = {
      id: `custom-${Date.now()}`,
      name: violationName.trim(),
      englishTerm: englishTerm.trim() || undefined,
      description: description.trim() || undefined,
    };

    onAddViolation(selectedCatId || categories[0].id, newViolation);
    setViolationName('');
    setEnglishTerm('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#111118] border-2 border-orange-500/40 rounded-2xl shadow-[0_0_50px_rgba(249,115,22,0.25)] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-['Cairo']">
                إضافة مخالفة جديدة للجدول
              </h3>
              <p className="text-xs text-zinc-400">
                أضف بنداً جديداً إلى إحدى فئات العقوبات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1a1a24] hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1.5">
              الفئة المستهدفة:
            </label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full h-11 px-3 bg-[#181824] border border-zinc-700 focus:border-orange-500 rounded-xl text-white text-sm font-semibold outline-none transition cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1.5">
              اسم المخالفة بالعربي: *
            </label>
            <input
              type="text"
              required
              value={violationName}
              onChange={(e) => setViolationName(e.target.value)}
              placeholder="مثال: التلفظ في الديسكورد، استغلال جلتش الركض..."
              className="w-full h-11 px-3 bg-[#181824] border border-zinc-700 focus:border-orange-500 rounded-xl text-white text-sm outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1.5">
              المصطلح الإنجليزي أو الاختصار (اختياري):
            </label>
            <input
              type="text"
              value={englishTerm}
              onChange={(e) => setEnglishTerm(e.target.value)}
              placeholder="مثال: Discord Toxicity, Speed Glitching..."
              className="w-full h-11 px-3 bg-[#181824] border border-zinc-700 focus:border-orange-500 rounded-xl text-white text-sm outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1.5">
              شرح وتفاصيل المخالفة (اختياري):
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب شرحاً مختصراً للحالات التي تعتبر مخالفة فيها..."
              className="w-full p-3 bg-[#181824] border border-zinc-700 focus:border-orange-500 rounded-xl text-white text-sm outline-none transition resize-none"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(249,115,22,0.4)] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>إضافة المخالفة</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
