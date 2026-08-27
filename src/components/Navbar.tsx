import React from 'react';
import {
  Calculator,
  FileText,
  Plus,
  Users,
  Lock,
  Unlock,
  Crown,
  KeyRound,
  Edit3,
  LogOut,
  Shield,
  LogIn,
  User,
  Gavel,
  Star,
  Flame,
  Eye,
} from 'lucide-react';
import { AuthorizedUser } from '../types';
import { getUserRoleObj, hasUserPermission } from '../utils/auth';
import serverLogo from '../assets/images/majan_logo_1787590390207.jpg';

interface NavbarProps {
  totalViolations: number;
  totalCategories: number;
  currentUser: AuthorizedUser | null;
  canEdit: boolean;
  onOpenCalculator: () => void;
  onOpenExport: () => void;
  onOpenAddModal: () => void;
  onOpenPermissions: () => void;
  onOpenOwnerDashboard?: () => void;
  onOpenLoginModal: () => void;
  onOpenAdminDirectory: () => void;
  onOpenActivationModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalViolations,
  totalCategories,
  currentUser,
  canEdit,
  onOpenCalculator,
  onOpenExport,
  onOpenAddModal,
  onOpenPermissions,
  onOpenOwnerDashboard,
  onOpenLoginModal,
  onOpenAdminDirectory,
  onOpenActivationModal,
  onLogout,
}) => {
  const isOwner = currentUser?.role === 'owner';
  const roleObj = getUserRoleObj(currentUser);
  const canManageStaff = hasUserPermission(currentUser, 'canManageStaff');
  const canManageUsers = hasUserPermission(currentUser, 'canManageUsers');
  const canExport = isOwner || hasUserPermission(currentUser, 'canExportDiscord');

  const renderRoleIcon = (iconName?: string, className?: string) => {
    switch (iconName) {
      case 'Crown':
        return <Crown className={className || 'w-4 h-4'} />;
      case 'Gavel':
        return <Gavel className={className || 'w-4 h-4'} />;
      case 'Star':
        return <Star className={className || 'w-4 h-4'} />;
      case 'Flame':
        return <Flame className={className || 'w-4 h-4'} />;
      case 'Edit3':
        return <Edit3 className={className || 'w-4 h-4'} />;
      case 'Eye':
        return <Eye className={className || 'w-4 h-4'} />;
      default:
        return <Shield className={className || 'w-4 h-4'} />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-orange-500/20 bg-[#090810]/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.7)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-full ring-2 ring-orange-500/60 shadow-[0_0_25px_rgba(249,115,22,0.5)] overflow-hidden bg-black flex items-center justify-center shrink-0">
              <img
                src={serverLogo}
                alt="Majan State Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white font-['Cairo']">
                  Censorship Team
                </h1>
                {canEdit ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                    <Unlock className="w-3 h-3" /> وضع التعديل
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
                    لوحة السيرفر
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 font-medium hidden md:block">
                النظام الرسمي للوائح المحاسبة ومخالفات الرول بلاي
              </p>
            </div>
          </div>

          {/* Center Stats Badges & Activation Code Button */}
          <div className="hidden lg:flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#12101b] border border-orange-500/30 text-xs shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
              <span className="font-bold text-white text-xs sm:text-sm">سيرفر Majan State</span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#12101b] border border-orange-500/20 text-xs shadow-inner">
              <span className="text-zinc-400">إجمالي المخالفات:</span>
              <span className="font-bold text-orange-400 text-sm">{totalViolations} بند</span>
            </div>

            {/* Activation Code Button placed to the left of Total Violations */}
            <button
              type="button"
              onClick={onOpenActivationModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-orange-500/15 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/50 hover:border-orange-400 text-orange-300 hover:text-white text-xs font-bold transition shadow-[0_0_15px_rgba(249,115,22,0.15)] cursor-pointer group"
              title="إدخال كود التفعيل أو طلب رتبة إدارية"
            >
              <KeyRound className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
              <span>كود التفعيل والرتب</span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping"></span>
            </button>
          </div>

          {/* Actions, Tools, Owner Panel & Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Quick Tools Group */}
            <div className="flex items-center gap-1.5">
              {/* Activation Code Button (Mobile icon) */}
              <button
                type="button"
                onClick={onOpenActivationModal}
                className="lg:hidden inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/40 hover:to-amber-500/40 border border-orange-500/50 text-orange-300 text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
                title="كود التفعيل وطلب رتبة"
              >
                <KeyRound className="w-4 h-4 text-orange-400" />
                <span className="hidden xs:inline">كود التفعيل</span>
              </button>

              {/* Admin Directory Button (For users with canManageStaff) */}
              {(isOwner || canManageStaff) && (
                <button
                  type="button"
                  onClick={onOpenAdminDirectory}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-[#141120] hover:bg-orange-500/15 border border-orange-500/30 hover:border-orange-500 text-zinc-200 hover:text-orange-300 text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
                  title="قائمة أعضاء الإدارة والرتب والنقاط"
                >
                  <Users className="w-4 h-4 text-orange-400" />
                  <span className="hidden md:inline">قائمة الإدارة</span>
                </button>
              )}

              {/* Ban Calculator */}
              <button
                type="button"
                onClick={onOpenCalculator}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-[#141120] hover:bg-orange-500/15 border border-orange-500/30 hover:border-orange-500 text-zinc-200 hover:text-orange-300 text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
                title="حاسبة العقوبة وتوليد أمر الحظر"
              >
                <Calculator className="w-4 h-4 text-orange-400" />
                <span className="hidden md:inline">حاسبة الباند</span>
              </button>

              {/* Discord Export */}
              {canExport && (
                <button
                  type="button"
                  onClick={onOpenExport}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-[#141120] hover:bg-orange-500/15 border border-orange-500/30 hover:border-orange-500 text-zinc-200 hover:text-orange-300 text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
                  title="تصدير جدول القوانين"
                >
                  <FileText className="w-4 h-4 text-orange-400" />
                  <span className="hidden lg:inline">تصدير اللائحة</span>
                </button>
              )}
            </div>

            {/* Management Badges / Panels */}
            {isOwner && onOpenOwnerDashboard && (
              <button
                type="button"
                onClick={onOpenOwnerDashboard}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-black font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(245,158,11,0.45)] transition transform active:scale-95 cursor-pointer border border-amber-300/40 shrink-0"
                title="لوحة المالك الخاصة للتحكم بالرتب والصلاحيات والمستخدمين"
              >
                <Crown className="w-4 h-4 text-black stroke-[2.5]" />
                <span className="hidden sm:inline">لوحة تحكم المالك</span>
                <span className="sm:hidden">المالك</span>
              </button>
            )}

            {/* Permissions Button for staff with canManageUsers when not owner */}
            {!isOwner && canManageUsers && (
              <button
                type="button"
                onClick={onOpenPermissions}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-[#15121f] hover:bg-[#201c2e] border border-orange-500/40 text-orange-300 hover:text-white text-xs sm:text-sm font-bold transition cursor-pointer shrink-0"
                title="إدارة الحسابات والصلاحيات"
              >
                <KeyRound className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="hidden sm:inline">الصلاحيات</span>
              </button>
            )}

            {/* LOGIN / USER ACCOUNT PILL */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-[#141020] border border-orange-500/40 hover:border-orange-500/70 rounded-2xl p-1.5 pl-2 transition shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                <button
                  type="button"
                  onClick={isOwner && onOpenOwnerDashboard ? onOpenOwnerDashboard : onOpenLoginModal}
                  className="flex items-center gap-2 text-right cursor-pointer"
                  title={isOwner ? 'فتح لوحة تحكم المالك' : 'عرض الحساب'}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm shrink-0 border"
                    style={{
                      backgroundColor: isOwner ? '#f59e0b25' : `${roleObj.color}25`,
                      borderColor: isOwner ? '#f59e0b60' : `${roleObj.color}60`,
                      color: isOwner ? '#fbbf24' : roleObj.color,
                    }}
                  >
                    {isOwner ? (
                      <Crown className="w-4 h-4" />
                    ) : (
                      renderRoleIcon(roleObj.badgeIcon, 'w-4 h-4')
                    )}
                  </div>
                  <div className="hidden sm:block leading-none text-right">
                    <div className="text-xs font-black text-white flex items-center gap-1">
                      <span className="truncate max-w-[100px]">
                        {currentUser.name.replace(/\s*\([^)]*\)/g, '').trim() || currentUser.name}
                      </span>
                      {isOwner && (
                        <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div
                      className="text-[10px] font-bold mt-1"
                      style={{ color: isOwner ? '#fbbf24' : roleObj.color }}
                    >
                      {isOwner ? 'المالك الأساسي' : roleObj.name}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/15 transition cursor-pointer"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-black font-black text-xs sm:text-sm transition shadow-[0_0_20px_rgba(249,115,22,0.35)] cursor-pointer active:scale-95 shrink-0"
                title="تسجيل الدخول أو إنشاء حساب"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>تسجيل الدخول</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};

