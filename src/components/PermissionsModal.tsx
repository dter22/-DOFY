import React, { useState } from 'react';
import { AuthorizedUser, UserRole, CustomRole } from '../types';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Mail,
  User,
  Crown,
  KeyRound,
  X,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  Edit3,
  Lock,
} from 'lucide-react';
import { loadCustomRoles, getRoleById, isOwnerUser } from '../utils/auth';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthorizedUser | null;
  authorizedUsers: AuthorizedUser[];
  onAddUser: (email: string, name: string, role: UserRole, username?: string) => { success: boolean; message: string };
  onRemoveUser: (id: string) => void;
  onLogin: (identifier: string) => { success: boolean; message: string };
  onLogout?: () => void;
  ownerEmail: string;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  authorizedUsers,
  onAddUser,
  onRemoveUser,
  onLogin,
  onLogout,
  ownerEmail,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<string>('editor');
  const [loginIdentifierInput, setLoginIdentifierInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const customRoles = loadCustomRoles();

  if (!isOpen) return null;

  const isOwnerOrAdmin =
    currentUser?.role === 'owner' ||
    currentUser?.role === 'admin' ||
    currentUser?.email.toLowerCase() === ownerEmail.toLowerCase();

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setFeedback({ type: 'error', text: 'يرجى إدخال البريد الإلكتروني للمشرف.' });
      return;
    }

    const emailToUse = newEmail.trim();
    const nameToUse = newName.trim() || newUsername.trim() || emailToUse.split('@')[0];

    const res = onAddUser(emailToUse, nameToUse, newRole as UserRole, newUsername.trim());
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setNewEmail('');
      setNewUsername('');
      setNewName('');
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifierInput.trim()) {
      setFeedback({ type: 'error', text: 'يرجى إدخال البريد الإلكتروني لتسجيل الدخول.' });
      return;
    }

    const res = onLogin(loginIdentifierInput.trim());
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setLoginIdentifierInput('');
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const currentUserRoleObj = currentUser ? getRoleById(currentUser.customRoleId || currentUser.role) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-[#090710] border-2 border-orange-500/50 rounded-3xl shadow-[0_0_60px_rgba(249,115,22,0.3)] overflow-hidden flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-orange-500/20 bg-gradient-to-r from-orange-950/40 via-[#13111c] to-[#090710] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-0.5 shadow-[0_0_20px_rgba(249,115,22,0.35)] flex items-center justify-center">
              <div className="w-full h-full bg-[#0d0a14] rounded-[14px] flex items-center justify-center text-orange-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white font-['Cairo'] flex items-center gap-2">
                <span>إدارة الصلاحيات والمشرفين</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
                  دخول فوري بالإيميل
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                التحكم بالصلاحيات وتعيين المشرفين والمحررين
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 border shadow-lg ${
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
            <span className="flex-1">{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100 px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Modal Scroll Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-right custom-scrollbar">
          
          {/* Current User Session Status */}
          <div className="p-4 rounded-2xl bg-[#120f1f] border border-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-zinc-400 block mb-1">مستوى الصلاحية الحالي:</span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-white">
                  {currentUser ? currentUser.name : 'وضع المشاهدة فقط (التعديل مقفّل)'}
                </span>

                {currentUser?.role === 'owner' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" /> المالك الأساسي (Dofy)
                  </span>
                ) : currentUser?.role === 'admin' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold">
                    مشرف متقدم
                  </span>
                ) : currentUser?.role === 'editor' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold">
                    محرر جداول
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> مقفّل
                  </span>
                )}
              </div>
            </div>

            {currentUser && onLogout && (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setFeedback({ type: 'success', text: 'تم قفل وضع التعديل والعودة لوضع المشاهدة.' });
                }}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" /> تسجيل الخروج
              </button>
            )}
          </div>

          {/* Quick Sign-in */}
          {!currentUser && (
            <div className="p-4 rounded-2xl bg-[#120f1f] border border-orange-500/30">
              <h3 className="text-xs font-bold text-zinc-200 mb-2.5 flex items-center gap-1.5">
                <LogIn className="w-4 h-4 text-orange-400" />
                تسجيل الدخول السريع بالبريد الإلكتروني:
              </h3>
              <form onSubmit={handleLoginSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={loginIdentifierInput}
                  onChange={(e) => setLoginIdentifierInput(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني هنا..."
                  className="flex-1 bg-[#090710] border border-zinc-700 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  dir="ltr"
                />
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-black text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-md shrink-0"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  دخول
                </button>
              </form>
            </div>
          )}

          {/* ADD NEW EDITOR SECTION (Only for Owner / Admin) */}
          {isOwnerOrAdmin ? (
            <div className="p-4.5 rounded-2xl bg-[#141022] border border-orange-500/30">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white">إضافة وتعيين مشرف أو محرر جديد:</h3>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      البريد الإلكتروني (حساب قوقل):
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute right-3 top-3" />
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="user@gmail.com"
                        className="w-full bg-[#090710] border border-zinc-700 focus:border-orange-500 rounded-xl pr-9 pl-3 py-2 text-xs sm:text-sm text-white outline-none"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      الاسم الظاهر:
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute right-3 top-3" />
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="نايف (إدارة الرقابة)"
                        className="w-full bg-[#090710] border border-zinc-700 focus:border-orange-500 rounded-xl pr-9 pl-3 py-2 text-xs sm:text-sm text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      اسم المستخدم (اختياري):
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Naif_Admin"
                      className="w-full bg-[#090710] border border-zinc-700 focus:border-orange-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      نوع الصلاحية / الرول:
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full h-9.5 bg-[#090710] border border-zinc-700 rounded-xl px-3 text-xs text-white outline-none focus:border-orange-500 font-bold"
                    >
                      {customRoles
                        .filter((r) => r.id !== 'owner')
                        .filter((r) => r.id !== 'commander' || isOwnerUser(currentUser))
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} {r.id === 'commander' ? '⭐ (قيادة عليا)' : r.id === 'management' ? '📋 (مشاهدة جدول الإدارة)' : r.permissions.canEditViolations ? '(تعديل)' : '(مشاهدة)'}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-black font-black text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                    <span>إضافة المشرف وحفظ البيانات</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-zinc-500" />
              لإضافة أعضاء آخرين أو تعديل الصلاحيات، يرجى تسجيل الدخول بحساب المالك.
            </div>
          )}

          {/* LIST OF AUTHORIZED USERS */}
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
              قائمة الحسابات المعتمدة ({authorizedUsers.length}):
            </h3>

            <div className="space-y-2">
              {authorizedUsers.map((user) => {
                const isThisOwner = user.email.toLowerCase() === ownerEmail.toLowerCase();
                const uRoleObj = getRoleById(user.customRoleId || user.role);

                return (
                  <div
                    key={user.id}
                    className="p-3 rounded-2xl bg-[#120f1f] border border-zinc-800/80 hover:border-zinc-700 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border"
                        style={{
                          backgroundColor: isThisOwner ? '#f59e0b20' : `${uRoleObj.color}20`,
                          borderColor: isThisOwner ? '#f59e0b50' : `${uRoleObj.color}40`,
                          color: isThisOwner ? '#fbbf24' : uRoleObj.color,
                        }}
                      >
                        {isThisOwner ? <Crown className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-white truncate font-mono" dir="ltr">
                            {user.email}
                          </span>
                          {isThisOwner && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              المالك
                            </span>
                          )}
                          {user.username && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono border border-zinc-700" dir="ltr">
                              @{user.username}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                          <span>{user.name}</span>
                          <span>•</span>
                          <span
                            className="font-bold"
                            style={{ color: isThisOwner ? '#fbbf24' : uRoleObj.color }}
                          >
                            {isThisOwner ? 'المالك الأساسي' : uRoleObj.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isThisOwner && isOwnerOrAdmin && (
                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من سحب صلاحية ${user.name} (${user.email})؟`)) {
                              onRemoveUser(user.id);
                              setFeedback({ type: 'success', text: 'تم سحب الصلاحية بنجاح.' });
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition cursor-pointer"
                          title="سحب الصلاحية"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-[#090710] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-bold transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
