import React, { useState, useEffect } from 'react';
import { Crown, Sparkles, X, Check, Save, Edit3, ShieldAlert } from 'lucide-react';
import { SiteSettings } from '../utils/siteConfig';
import { AuthorizedUser } from '../types';
import { isOwnerUser } from '../utils/auth';

interface SiteSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteSettings: SiteSettings;
  onSave: (newSettings: SiteSettings) => void;
  currentUser: AuthorizedUser | null;
}

export const SiteSettingsModal: React.FC<SiteSettingsModalProps> = ({
  isOpen,
  onClose,
  siteSettings,
  onSave,
  currentUser,
}) => {
  const [siteTitle, setSiteTitle] = useState(siteSettings.siteTitle);
  const [siteSubtitle, setSiteSubtitle] = useState(siteSettings.siteSubtitle);
  const [serverName, setServerName] = useState(siteSettings.serverName);
  const [isSaved, setIsSaved] = useState(false);

  const isOwner = !!currentUser && isOwnerUser(currentUser);
  const isAllowedToEdit = isOwner;

  useEffect(() => {
    if (isOpen) {
      setSiteTitle(siteSettings.siteTitle);
      setSiteSubtitle(siteSettings.siteSubtitle);
      setServerName(siteSettings.serverName);
      setIsSaved(false);
    }
  }, [isOpen, siteSettings]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowedToEdit) return;

    const trimmedTitle = siteTitle.trim() || 'Majan Management';
    const trimmedSubtitle = siteSubtitle.trim() || 'النظام الرسمي للوائح المحاسبة ومخالفات الرول بلاي';
    const trimmedServerName = serverName.trim() || 'سيرفر Majan State';

    const newSettings: SiteSettings = {
      siteTitle: trimmedTitle,
      siteSubtitle: trimmedSubtitle,
      serverName: trimmedServerName,
    };

    onSave(newSettings);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-lg bg-[#0d0a17] border border-orange-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(249,115,22,0.25)] text-right">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-orange-500/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-[#0d0a17] rounded-[14px] flex items-center justify-center text-amber-400">
                <Crown className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">تخصيص وتعديل اسم الموقع</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/30">
                  خاص بالمالك فقط 👑
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                تحكم بالاسم الرئيسي للموقع، العنوان الفرعي، واسم السيرفر الرسمي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isOwner ? (
          <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-3 mb-4">
            <ShieldAlert className="w-6 h-6 shrink-0 text-red-400" />
            <div>
              <strong className="block font-bold">صلاحية محصورة</strong>
              <span>عذراً، تعديل وتغيير اسم الموقع وصلاحيات البراندينج مقتصرة حصرياً على مالك السيرفر الأساسي.</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            
            {/* Site Title */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>اسم الموقع الرئيسي (Title):</span>
                <span className="text-[11px] text-orange-400 font-normal">المعتمد: Majan Management</span>
              </label>
              <input
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                placeholder="Majan Management"
                className="w-full px-4 py-2.5 rounded-xl bg-[#141122] border border-orange-500/40 text-white font-bold text-sm focus:outline-none focus:border-orange-500 transition"
                required
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                العنوان والوصف الفرعي:
              </label>
              <input
                type="text"
                value={siteSubtitle}
                onChange={(e) => setSiteSubtitle(e.target.value)}
                placeholder="النظام الرسمي للوائح المحاسبة ومخالفات الرول بلاي"
                className="w-full px-4 py-2.5 rounded-xl bg-[#141122] border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            {/* Server Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                اسم السيرفر المعروض في الشريط العلوي:
              </label>
              <input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="سيرفر Majan State"
                className="w-full px-4 py-2.5 rounded-xl bg-[#141122] border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            {/* Preset quick buttons */}
            <div className="pt-2">
              <span className="text-[11px] text-zinc-500 font-bold block mb-1.5">خيارات سريعة مقترحة:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSiteTitle('Majan Management');
                    setServerName('سيرفر Majan State');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 text-xs font-bold transition cursor-pointer"
                >
                  Majan Management
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSiteTitle('Majan State Administration');
                    setServerName('سيرفر Majan State');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition cursor-pointer"
                >
                  Majan State Administration
                </button>
              </div>
            </div>

            {/* Submit & Status */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs shadow-lg transition cursor-pointer active:scale-95"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>تم الحفظ بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 stroke-[2.5]" />
                    <span>حفظ التعديلات</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
