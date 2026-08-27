import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  X,
  Send,
  User,
  Shield,
  Clock,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { AuthorizedUser } from '../types';
import {
  generateUserCode,
  submitActivationRequest,
  loadCustomRoles,
  getMasterPasscode,
  checkActivationStatus,
} from '../utils/auth';

interface ActivationCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthorizedUser | null;
  onSuccess: (message: string) => void;
  onActivateUser?: (user: AuthorizedUser, message: string) => void;
}

export const ActivationCodeModal: React.FC<ActivationCodeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  onActivateUser,
}) => {
  const [name, setName] = useState('');
  const [discordTag, setDiscordTag] = useState('');
  const [age, setAge] = useState('');
  const [requestedRole, setRequestedRole] = useState('');
  const [passcode, setPasscode] = useState('');
  const [notes, setNotes] = useState('');
  const [userCode, setUserCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [customRoles, setCustomRoles] = useState(loadCustomRoles());

  useEffect(() => {
    if (isOpen) {
      setCustomRoles(loadCustomRoles());
      if (currentUser) {
        setName(currentUser.name || '');
        setDiscordTag(currentUser.username || '');
        setAge(currentUser.age ? String(currentUser.age) : '');
        setUserCode(currentUser.userCode || generateUserCode(currentUser.name));
      } else {
        const storedCode = localStorage.getItem('my_personal_user_code') || generateUserCode();
        localStorage.setItem('my_personal_user_code', storedCode);
        setUserCode(storedCode);
      }
      setPasscode('');
      setErrorMsg('');
      setStatusMsg('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!userCode) return;
    navigator.clipboard.writeText(userCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleCheckStatus = () => {
    if (!userCode && !discordTag && !name) {
      setErrorMsg('يرجى كتابة كودك أو اسم المستخدم للتحقق.');
      return;
    }
    setIsCheckingStatus(true);
    setErrorMsg('');
    setStatusMsg('');

    setTimeout(() => {
      const codeToCheck = userCode || discordTag || name;
      const res = checkActivationStatus(codeToCheck);
      setIsCheckingStatus(false);
      if (res.isApproved && res.user) {
        if (onActivateUser) {
          onActivateUser(res.user, res.message);
        }
        onSuccess(res.message);
        onClose();
      } else {
        setStatusMsg(res.message);
      }
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسمك الظاهر.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const res = submitActivationRequest({
        name,
        discordTag,
        age,
        requestedRole,
        passcodeUsed: passcode,
        userCode: userCode || generateUserCode(name),
        userEmail: currentUser?.email,
        notes,
      });

      if (res.success) {
        if (res.user && onActivateUser) {
          onActivateUser(res.user, res.message);
        }
        onSuccess(res.message);
        onClose();
      } else {
        setErrorMsg(res.message || 'حدث خطأ أثناء إرسال الطلب.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl bg-[#0d0a17] border-2 border-orange-500/50 rounded-3xl shadow-[0_0_60px_rgba(249,115,22,0.3)] overflow-hidden flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-orange-500/30 bg-gradient-to-r from-[#171026] via-[#120e20] to-[#171026] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.35)]">
              <KeyRound className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                كود التفعيل وطلب رتبة إدارية
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                أدخل كود التفعيل أو أرسل بياناتك للمالك Dofy لمنحك الرتبة والصلاحيات
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar">
          
          {/* Personal User Code Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border-2 border-orange-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
            <div className="text-center sm:text-right">
              <div className="text-[11px] font-bold text-orange-300">
                كودك الخاص الفريد (Personal Code):
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                يمكنك إعطاء هذا الكود للمالك Dofy مباشرة لترقيتك وتعديل بياناتك فوراً!
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-xl bg-black/60 border border-orange-500/50 text-orange-400 font-mono text-base font-black tracking-wider">
                {userCode || 'MS-....'}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500 text-orange-300 hover:text-black font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-orange-500/40"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الكود</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isCheckingStatus}
                className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-black font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-blue-500/40 disabled:opacity-50"
                title="فحص إذا قام المالك بترقيتك وتفعيل خصائصك"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isCheckingStatus ? 'جاري الفحص...' : 'فحص التفعيل'}</span>
              </button>
            </div>
          </div>

          {statusMsg && (
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 font-bold animate-fadeIn">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-300">
                  الاسم بالكامل / الظاهر: <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: يوسف أحمد"
                  required
                  className="w-full bg-[#161124] border border-zinc-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none"
                />
              </div>

              {/* Discord Tag / Username */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-300">
                  يوزر الديسكورد / اسم المستخدم:
                </label>
                <input
                  type="text"
                  value={discordTag}
                  onChange={(e) => setDiscordTag(e.target.value)}
                  placeholder="مثال: yousif_99"
                  dir="ltr"
                  className="w-full bg-[#161124] border border-zinc-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none text-left"
                />
              </div>

              {/* Age */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-300">
                  العمر: <span className="text-orange-400 text-[11px]">(مطلوب)</span>
                </label>
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="مثال: 21"
                  dir="ltr"
                  className="w-full bg-[#161124] border border-zinc-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none text-left"
                />
              </div>

              {/* Desired / Current Role */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-300">
                  الرتبة في السيرفر أو المقترحة:
                </label>
                <input
                  type="text"
                  value={requestedRole}
                  onChange={(e) => setRequestedRole(e.target.value)}
                  placeholder="مثال: رتبتك الحالية بالسيرفر أو مقترحك"
                  className="w-full bg-[#161124] border border-zinc-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none"
                />
              </div>
            </div>

            {/* Activation Passcode (If provided by owner) */}
            <div className="space-y-1 pt-1">
              <label className="block text-xs font-bold text-orange-300 flex items-center justify-between">
                <span>كود التفعيل المستلم من المالك:</span>
                <span className="text-[10px] text-zinc-400 font-normal">
                  (إذا أعطاك المالك كود تفعيل سري)
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="أدخل الكود إذا تم تزويدك به"
                  dir="ltr"
                  className="w-full bg-[#161124] border-2 border-orange-500/40 focus:border-orange-500 rounded-xl px-3.5 py-2.5 pl-10 text-xs sm:text-sm font-mono tracking-widest text-orange-400 placeholder-zinc-600 outline-none uppercase"
                />
                <KeyRound className="w-4 h-4 text-orange-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Notes / Reason */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-300">
                ملاحظات أو المهام الموكلة إليك:
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أضف أي تفاصيل أخرى ترغب في إرسالها للمالك..."
                rows={2}
                className="w-full bg-[#161124] border border-zinc-700 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none resize-none"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-black font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(249,115,22,0.4)] transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>إرسال طلب التفعيل والرتبة</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
