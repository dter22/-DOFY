import React, { useState } from 'react';
import {
  X,
  Mail,
  User,
  ShieldCheck,
  Crown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
  KeyRound,
  ArrowRight,
  ShieldAlert,
  Edit3,
  Gavel,
  Star,
  Flame,
  Eye,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { AuthorizedUser } from '../types';
import { getUserRoleObj, hasUserPermission } from '../utils/auth';
import serverLogo from '../assets/images/majan_logo_1787590390207.jpg';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (identifier: string) => { success: boolean; message: string };
  onRegister: (email: string, name: string, username?: string, passcode?: string) => { success: boolean; message: string };
  currentUser: AuthorizedUser | null;
  onLogout: () => void;
  onOpenPermissionsManager?: () => void;
  onOpenOwnerDashboard?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  currentUser,
  onLogout,
  onOpenPermissionsManager,
  onOpenOwnerDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  
  // Register fields
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPasscode, setRegisterPasscode] = useState('');
  const [showPasscodeDropdown, setShowPasscodeDropdown] = useState(false);
  
  const [rememberMe, setRememberMe] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const currentRoleObj = getUserRoleObj(currentUser);
  const isOwner = currentUser?.role === 'owner';
  const canManageUsers = hasUserPermission(currentUser, 'canManageUsers');

  const renderRoleIcon = (iconName?: string, className?: string) => {
    switch (iconName) {
      case 'Crown':
        return <Crown className={className || 'w-6 h-6'} />;
      case 'Gavel':
        return <Gavel className={className || 'w-6 h-6'} />;
      case 'Star':
        return <Star className={className || 'w-6 h-6'} />;
      case 'Flame':
        return <Flame className={className || 'w-6 h-6'} />;
      case 'Edit3':
        return <Edit3 className={className || 'w-6 h-6'} />;
      case 'Eye':
        return <Eye className={className || 'w-6 h-6'} />;
      default:
        return <Shield className={className || 'w-6 h-6'} />;
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setFeedback({ type: 'error', text: 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم.' });
      return;
    }

    const res = onLogin(loginIdentifier.trim());
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setTimeout(() => {
        onClose();
        setFeedback(null);
        setLoginIdentifier('');
      }, 1000);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail.trim()) {
      setFeedback({ type: 'error', text: 'يرجى كتابة بريدك الإلكتروني (حساب Google).' });
      return;
    }
    if (!registerName.trim()) {
      setFeedback({ type: 'error', text: 'يرجى كتابة الاسم الشخصي أو اسمك في السيرفر.' });
      return;
    }

    const res = onRegister(
      registerEmail.trim(),
      registerName.trim(),
      registerUsername.trim(),
      registerPasscode.trim()
    );
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setTimeout(() => {
        onClose();
        setFeedback(null);
        setRegisterName('');
        setRegisterEmail('');
        setRegisterUsername('');
        setRegisterPasscode('');
      }, 1100);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md bg-[#09070f] border-2 border-orange-500/50 rounded-3xl shadow-[0_0_60px_rgba(249,115,22,0.3)] overflow-hidden flex flex-col"
        dir="rtl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header with Orange Glow */}
        <div className="pt-7 pb-3 px-6 text-center flex flex-col items-center relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 p-1 mb-3 shadow-[0_0_35px_rgba(249,115,22,0.5)] flex items-center justify-center">
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-black bg-black flex items-center justify-center">
              <img
                src={serverLogo}
                alt="Server Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white font-['Cairo'] tracking-wide">
            {currentUser ? 'الحساب الحالي' : activeTab === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h2>
          <p className="text-xs text-zinc-300 mt-1">
            {currentUser
              ? 'مرحباً بك في لوحة تحكم السيرفر'
              : activeTab === 'login'
              ? 'سجل دخولك المباشر عبر حساب Google أو البريد الإلكتروني'
              : 'أنشئ حسابك الجديد بالبريد الإلكتروني للوصول للوحة'}
          </p>
        </div>

        {/* Tabs Switcher (Only if not logged in) */}
        {!currentUser && (
          <div className="px-6 pb-2">
            <div className="flex bg-[#141020] border border-orange-500/30 rounded-2xl p-1 gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setFeedback(null);
                }}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'login'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>تسجيل الدخول</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setFeedback(null);
                }}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'register'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>إنشاء حساب</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`mx-6 my-2 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border shadow-lg animate-fadeIn ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/15 border-red-500/40 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span className="flex-1 leading-relaxed">{feedback.text}</span>
          </div>
        )}

        {/* If already logged in */}
        {currentUser ? (
          <div className="p-6 space-y-4">
            <div className="p-5 rounded-2xl bg-[#141022] border border-orange-500/40 text-center space-y-2.5 shadow-inner">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-full border shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                style={{
                  backgroundColor: isOwner ? '#f59e0b25' : `${currentRoleObj.color}25`,
                  borderColor: isOwner ? '#f59e0b60' : `${currentRoleObj.color}60`,
                  color: isOwner ? '#fbbf24' : currentRoleObj.color,
                }}
              >
                {isOwner ? (
                  <Crown className="w-7 h-7 text-amber-400" />
                ) : (
                  renderRoleIcon(currentRoleObj.badgeIcon, 'w-7 h-7')
                )}
              </div>
              <h3 className="text-base font-black text-white">
                {currentUser.name.replace(/\s*\([^)]*\)/g, '').trim() || currentUser.name}
              </h3>
              <p className="text-xs text-orange-300 font-mono" dir="ltr">{currentUser.email}</p>
              <div className="pt-2">
                <span
                  className="px-3.5 py-1 rounded-full text-xs font-black border"
                  style={{
                    backgroundColor: isOwner ? '#f59e0b20' : `${currentRoleObj.color}20`,
                    borderColor: isOwner ? '#f59e0b50' : `${currentRoleObj.color}50`,
                    color: isOwner ? '#fbbf24' : currentRoleObj.color,
                  }}
                >
                  {isOwner
                    ? 'المالك الأساسي (كامل الصلاحيات)'
                    : `${currentRoleObj.name} (${currentRoleObj.permissions.canEditViolations ? 'تعديل المخالفات مفعّل' : 'مشاهدة فقط'})`}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {isOwner && onOpenOwnerDashboard && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenOwnerDashboard();
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-black font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                >
                  <Crown className="w-4 h-4" />
                  لوحة تحكم المالك
                </button>
              )}
              {onOpenPermissionsManager && !isOwner && canManageUsers && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPermissionsManager();
                  }}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <KeyRound className="w-4 h-4" />
                  إدارة الصلاحيات
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setFeedback({ type: 'success', text: 'تم تسجيل الخروج وقفل وضع التعديل.' });
                }}
                className="flex-1 py-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 font-bold text-xs transition cursor-pointer"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        ) : activeTab === 'login' ? (
          /* LOGIN FORM (Direct Email / Username - No Password!) */
          <form onSubmit={handleLoginSubmit} className="px-6 pb-6 pt-2 space-y-4">
            
            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-bold text-zinc-200">
                البريد الإلكتروني أو اسم المستخدم:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني هنا..."
                  className="w-full bg-[#141022] border-2 border-zinc-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-2xl pr-4 pl-11 py-3.5 text-sm text-white placeholder:text-zinc-500 outline-none transition"
                  dir="ltr"
                  autoFocus
                />
                <Mail className="w-5 h-5 text-orange-400 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
              <p className="text-[11px] text-zinc-400">
                ادخل بريدك المسجل في قوقل وسيتم تسجيل دخولك فوراً.
              </p>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-end text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300 select-none">
                <span>تذكر تسجيل الدخول</span>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-[#141022] text-orange-500 focus:ring-orange-400 focus:ring-offset-0 accent-orange-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Submit Button (Orange & Black) */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-black font-black text-sm tracking-wide shadow-[0_0_30px_rgba(249,115,22,0.4)] transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 stroke-[3]" />
              <span>تسجيل الدخول</span>
            </button>

            {/* Switch to Register link */}
            <div className="text-center pt-2 border-t border-zinc-800/80">
              <p className="text-xs text-zinc-400">
                ليس لديك حساب بعد؟{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setFeedback(null);
                  }}
                  className="text-orange-400 hover:text-orange-300 font-bold underline cursor-pointer mr-1"
                >
                  إنشاء حساب جديد
                </button>
              </p>
            </div>
          </form>
        ) : (
          /* REGISTER FORM (Create Account) */
          <form onSubmit={handleRegisterSubmit} className="px-6 pb-6 pt-2 space-y-3.5">
            
            <div className="space-y-1 text-right">
              <label className="block text-xs font-bold text-zinc-200">
                البريد الإلكتروني (حساب Google):
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-[#141022] border-2 border-zinc-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-2xl pr-4 pl-11 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition"
                  dir="ltr"
                  autoFocus
                />
                <Mail className="w-4 h-4 text-orange-400 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1 text-right">
              <label className="block text-xs font-bold text-zinc-200">
                الاسم الظاهر:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="مثال: فهد (إدارة الرقابة)"
                  className="w-full bg-[#141022] border-2 border-zinc-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-2xl pr-4 pl-11 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition"
                />
                <User className="w-4 h-4 text-orange-400 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1 text-right">
              <label className="block text-xs font-bold text-zinc-400">
                اسم المستخدم (اختياري):
              </label>
              <input
                type="text"
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                placeholder="Fahad_99"
                className="w-full bg-[#141022] border border-zinc-800 focus:border-orange-500 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 outline-none transition"
                dir="ltr"
              />
            </div>

            {/* Optional Master Passcode Dropdown Accordion */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowPasscodeDropdown(!showPasscodeDropdown)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#141022] border border-zinc-800/90 hover:border-amber-500/40 text-xs font-bold text-zinc-300 hover:text-amber-300 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>كود التفعيل السري للإداريين (اختياري)</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                    showPasscodeDropdown ? 'rotate-180 text-amber-400' : ''
                  }`}
                />
              </button>

              {showPasscodeDropdown && (
                <div className="mt-2 p-3 bg-[#0d0918] border border-amber-500/30 rounded-2xl space-y-2 animate-fadeIn">
                  <label className="block text-[11px] font-bold text-amber-300">
                    أدخل كود التفعيل:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={registerPasscode}
                      onChange={(e) => setRegisterPasscode(e.target.value)}
                      placeholder=""
                      className="w-full bg-[#161124] border border-amber-500/40 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-amber-200 outline-none transition font-mono"
                      dir="ltr"
                      autoComplete="off"
                    />
                    <KeyRound className="w-4 h-4 text-amber-400/60 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    إذا زودك المالك بكود تفعيل سري، اكتبه هنا لترقية صلاحياتك تلقائياً، وإلا ستُمنح رتبة مشاهد مع إمكانية استخدام الحاسبة.
                  </p>
                </div>
              )}
            </div>

            {/* Register Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-black font-black text-sm tracking-wide shadow-[0_0_30px_rgba(249,115,22,0.4)] transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <UserPlus className="w-4 h-4 stroke-[3]" />
              <span>إنشاء الحساب ودخول اللوحة</span>
            </button>

            {/* Switch to Login link */}
            <div className="text-center pt-2 border-t border-zinc-800/80">
              <p className="text-xs text-zinc-400">
                لديك حساب بالفعل؟{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setFeedback(null);
                  }}
                  className="text-orange-400 hover:text-orange-300 font-bold underline cursor-pointer mr-1"
                >
                  تسجيل الدخول
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
