import React, { useState, useEffect, useRef } from 'react';
import {
  Crown,
  Sparkles,
  X,
  Check,
  Save,
  Edit3,
  ShieldAlert,
  Upload,
  Image as ImageIcon,
  Globe,
  Trash2,
  RefreshCw,
  Link2,
  Layers,
} from 'lucide-react';
import { SiteSettings } from '../utils/siteConfig';
import { AuthorizedUser } from '../types';
import { isOwnerUser } from '../utils/auth';
import defaultLogoImg from '../assets/images/majan_logo_1787590390207.jpg';

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
  const [siteTitle, setSiteTitle] = useState(siteSettings.siteTitle || 'Server Rival');
  const [siteSubtitle, setSiteSubtitle] = useState(siteSettings.siteSubtitle || 'النظام الرسمي للوائح المحاسبة ومخالفات الرول بلاي');
  const [serverName, setServerName] = useState(siteSettings.serverName || 'سيرفر Rival');
  const [browserTabTitle, setBrowserTabTitle] = useState(siteSettings.browserTabTitle || 'قوانين المخالفات');
  const [logoUrl, setLogoUrl] = useState<string>(siteSettings.logoUrl || '');
  const [isSaved, setIsSaved] = useState(false);
  const [imageTab, setImageTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = !!currentUser && isOwnerUser(currentUser);
  const isAllowedToEdit = isOwner;

  useEffect(() => {
    if (isOpen) {
      setSiteTitle(siteSettings.siteTitle || 'Server Rival');
      setSiteSubtitle(siteSettings.siteSubtitle || 'النظام الرسمي للوائح المحاسبة ومخالفات الرول بلاي');
      setServerName(siteSettings.serverName || 'سيرفر Rival');
      setBrowserTabTitle(siteSettings.browserTabTitle || 'قوانين المخالفات');
      setLogoUrl(siteSettings.logoUrl || '');
      setUrlInput(siteSettings.logoUrl || '');
      setIsSaved(false);
      setUploadError('');
    }
  }, [isOpen, siteSettings]);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    setUploadError('');
    if (!file.type.startsWith('image/')) {
      setUploadError('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, GIF, SVG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setLogoUrl(e.target.result as string);
      }
    };
    reader.onerror = () => {
      setUploadError('حدث خطأ أثناء قراءة ملف الصورة');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setLogoUrl(urlInput.trim());
      setUploadError('');
    }
  };

  const handleResetLogo = () => {
    setLogoUrl('');
    setUrlInput('');
    setUploadError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowedToEdit) return;

    const trimmedTitle = siteTitle.trim() || 'Server Rival';
    const trimmedSubtitle = siteSubtitle.trim() || 'النظام الرسمي للوائح المحاسبة ومخالفات الرول بلاي';
    const trimmedServerName = serverName.trim() || 'سيرفر Rival';
    const trimmedBrowserTabTitle = browserTabTitle.trim() || 'قوانين المخالفات';

    const newSettings: SiteSettings = {
      siteTitle: trimmedTitle,
      siteSubtitle: trimmedSubtitle,
      serverName: trimmedServerName,
      browserTabTitle: trimmedBrowserTabTitle,
      logoUrl: logoUrl.trim(),
    };

    onSave(newSettings);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const activeDisplayLogo = logoUrl || defaultLogoImg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-xl bg-[#0d0a17] border border-orange-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(249,115,22,0.25)] text-right max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-orange-500/20 sticky top-0 bg-[#0d0a17] z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-[#0d0a17] rounded-[14px] flex items-center justify-center text-amber-400">
                <Crown className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">تخصيص الاسم والشعار والرابط</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/30">
                  خاص بالمالك فقط 👑
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                تعديل اسم الموقع، صورة الشعار، عنوان التبويب في المتصفح، واسم السيرفر
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
              <span>عذراً، تعديل وتغيير اسم الموقع وصورة الشعار مقتصرة حصرياً على مالك السيرفر الأساسي.</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            
            {/* 1. Browser Tab Title (الاسم الذي يظهر فوق في الرابط والتبويب) */}
            <div className="p-4 rounded-2xl bg-[#140f22] border border-orange-500/30 space-y-2">
              <label className="block text-xs font-bold text-amber-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-black text-sm">
                  <Globe className="w-4 h-4 text-orange-400" />
                  اسم التبويب فوق في المتصفح (الرابط):
                </span>
                <span className="text-[11px] text-zinc-400 font-normal">المطلوب: قوانين المخالفات</span>
              </label>
              <input
                type="text"
                value={browserTabTitle}
                onChange={(e) => setBrowserTabTitle(e.target.value)}
                placeholder="قوانين المخالفات"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0d0a17] border border-orange-500/50 text-white font-black text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                required
              />
              <p className="text-[11px] text-zinc-400">
                هذا هو العنوان الذي يظهر في أعلى لسان المتصفح (Tab) وروابط المشاركة.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setBrowserTabTitle('قوانين المخالفات')}
                  className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 text-xs font-bold transition cursor-pointer"
                >
                  قوانين المخالفات
                </button>
                <button
                  type="button"
                  onClick={() => setBrowserTabTitle(`${siteTitle} - قوانين المخالفات`)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition cursor-pointer"
                >
                  {siteTitle} - قوانين المخالفات
                </button>
              </div>
            </div>

            {/* 2. LOGO / AVATAR IMAGE SECTION (تغيير صورة السيرفر) */}
            <div className="p-4 rounded-2xl bg-[#140f22] border border-orange-500/30 space-y-3">
              <label className="block text-xs font-bold text-amber-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-black text-sm">
                  <ImageIcon className="w-4 h-4 text-orange-400" />
                  صورة وشعار السيرفر (Logo):
                </span>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 font-bold transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>إعادة الشعار الأصلي</span>
                  </button>
                )}
              </label>

              {/* Live Preview and Upload Controller */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#0d0a17] p-3.5 rounded-xl border border-zinc-800">
                {/* Image Live Preview */}
                <div className="relative shrink-0 flex flex-col items-center gap-1.5">
                  <div className="w-20 h-20 rounded-full ring-2 ring-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.4)] overflow-hidden bg-black flex items-center justify-center">
                    <img
                      src={activeDisplayLogo}
                      alt="Server Logo Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">معاينة حية</span>
                </div>

                {/* Upload or URL Controls */}
                <div className="flex-1 w-full space-y-2.5">
                  {/* Mode tabs */}
                  <div className="flex items-center gap-1 bg-[#181326] p-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setImageTab('upload')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        imageTab === 'upload'
                          ? 'bg-orange-500 text-black font-black shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع من جهازك</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('url')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        imageTab === 'url'
                          ? 'bg-orange-500 text-black font-black shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>رابط صورة مباشر</span>
                    </button>
                  </div>

                  {/* Tab 1: Upload File */}
                  {imageTab === 'upload' && (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-orange-500/40 hover:border-orange-400 bg-orange-500/5 hover:bg-orange-500/10 rounded-xl p-3.5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1 group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                      />
                      <Upload className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-zinc-200">
                        انقر لاختيار صورة من جهازك أو اسحبها هنا
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        يدعم جميع أنواع الصور (PNG, JPG, WEBP, GIF)
                      </span>
                    </div>
                  )}

                  {/* Tab 2: Direct URL */}
                  {imageTab === 'url' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="flex-1 px-3 py-2 rounded-xl bg-[#141122] border border-zinc-700 text-xs text-white focus:outline-none focus:border-orange-500"
                        />
                        <button
                          type="button"
                          onClick={handleApplyUrl}
                          className="px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs transition cursor-pointer shrink-0"
                        >
                          تطبيق
                        </button>
                      </div>
                      <span className="text-[10px] text-zinc-500 block">
                        يمكنك وضع رابط صورة من الديسكورد، Imgur، أو أي موقع آخر
                      </span>
                    </div>
                  )}

                  {uploadError && (
                    <p className="text-xs text-red-400 font-bold">{uploadError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Site Title (اسم الموقع الرئيسي) */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>اسم الموقع الرئيسي (Title):</span>
                <span className="text-[11px] text-orange-400 font-normal">المعتمد: Server Rival</span>
              </label>
              <input
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                placeholder="Server Rival"
                className="w-full px-4 py-2.5 rounded-xl bg-[#141122] border border-orange-500/40 text-white font-bold text-sm focus:outline-none focus:border-orange-500 transition"
                required
              />
            </div>

            {/* 4. Server Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                اسم السيرفر المعروض في الشريط العلوي:
              </label>
              <input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="سيرفر Rival"
                className="w-full px-4 py-2.5 rounded-xl bg-[#141122] border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            {/* 5. Subtitle */}
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

            {/* Submit & Status */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80 mt-5 sticky bottom-0 bg-[#0d0a17] py-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs shadow-lg transition cursor-pointer active:scale-95"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>تم الحفظ بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 stroke-[2.5]" />
                    <span>حفظ جميع التعديلات</span>
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

