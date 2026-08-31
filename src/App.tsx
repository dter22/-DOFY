import React, { useState, useMemo, useEffect } from 'react';
import { OFFICIAL_SERVER_RULES } from './data/rulesData';
import { RuleCategory, ViolationItem, AuthorizedUser, UserRole, AdminMember } from './types';
import { Navbar } from './components/Navbar';
import { SearchBar } from './components/SearchBar';
import { CategoryCard } from './components/CategoryCard';
import { BanCalculatorModal } from './components/BanCalculatorModal';
import {
  BanSidebarCalculator,
  SelectedBanItem,
  parsePenaltyDuration,
} from './components/BanSidebarCalculator';
import { DiscordExportModal } from './components/DiscordExportModal';
import { RuleDetailModal } from './components/RuleDetailModal';
import { AddRuleModal } from './components/AddRuleModal';
import { PermissionsModal } from './components/PermissionsModal';
import { OwnerDashboardModal } from './components/OwnerDashboardModal';
import { LoginModal } from './components/LoginModal';
import { ActivationCodeModal } from './components/ActivationCodeModal';
import { EditCategoryModal } from './components/EditCategoryModal';
import { AddCategoryModal } from './components/AddCategoryModal';
import { AdminDirectory } from './components/AdminDirectory';
import { InteractiveMouseBackground } from './components/InteractiveMouseBackground';
import { SiteSettings, loadSavedSiteSettings, saveSiteSettingsToStorage } from './utils/siteConfig';
import { loadSavedResponsibilities } from './utils/responsibilitiesConfig';
import { loadSavedRankColors, saveRankColorsToStorage } from './utils/rankColors';
import {
  PresetRankItem,
  loadSavedRanksList,
  saveRanksListToStorage,
} from './utils/ranksConfig';
import {
  OWNER_EMAIL,
  loadAuthorizedUsers,
  saveAuthorizedUsers,
  loadCurrentSession,
  saveCurrentSession,
  authenticateUser,
  registerNewUser,
  hasUserPermission,
  getRoleById,
  getUserRoleObj,
  syncWithServer,
} from './utils/auth';
import {
  Shield,
  Sparkles,
  AlertCircle,
  Edit3,
  CheckCircle2,
  Lock,
  Unlock,
  Crown,
  Calculator,
  Users,
  LayoutGrid,
  Plus,
} from 'lucide-react';

const LOCAL_STORAGE_RULES_KEY = 'server_ban_rules_grid_v4';
const LOCAL_STORAGE_SELECTED_BANS_KEY = 'server_ban_selected_items_v4';
const LOCAL_STORAGE_STAFF_KEY = 'server_ban_staff_members_v1';

const DEFAULT_STAFF_MEMBERS: AdminMember[] = [
  {
    id: 'staff-1',
    name: 'Dofy',
    discordTag: '@dofy',
    rank: 'Marshal',
    rankColor: '#F59E0B',
    points: 180,
    status: 'active',
    notes: 'المالك الأساسي ورئيس إدارة سيرفر Majan State',
    joinDate: '2026-01-01',
    lastUpdated: new Date().toISOString(),
  },
];

export default function App() {
  // --- RULES DATA STATE ---
  const [categories, setCategories] = useState<RuleCategory[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_RULES_KEY);
      if (saved) {
        const parsed: RuleCategory[] = JSON.parse(saved);
        const updated = parsed.map((cat) => {
          if (cat.id === 'exploits-admin-rules') {
            return {
              ...cat,
              punishments: [
                { times: 'المرة الاولى', penalty: 'باند اسبوع', days: 7 },
                { times: 'المرة الثانيه', penalty: 'باند اسبوعين', days: 14 },
                { times: 'المرة الثالثه', penalty: 'باند شهر', days: 30 },
                { times: 'المرة الرابعه', penalty: 'باند بيرم', isPerm: true },
              ],
            };
          }
          return cat;
        });
        return updated;
      }
    } catch (e) {
      console.error('Error loading local storage rules:', e);
    }
    return OFFICIAL_SERVER_RULES;
  });

  // --- USERS & PERMISSIONS STATE ---
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>(() => {
    return loadAuthorizedUsers();
  });

  // --- ACTIVE LOGGED IN USER ---
  const [currentUser, setCurrentUser] = useState<AuthorizedUser | null>(() => {
    return loadCurrentSession();
  });

  // --- MULTI-VIOLATIONS SELECTION FOR BAN CALCULATOR ---
  const [selectedBanItems, setSelectedBanItems] = useState<SelectedBanItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SELECTED_BANS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading selected bans:', e);
    }
    return [];
  });

  // Search state
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Main Page View: 'rules' | 'staff'
  const [currentView, setCurrentView] = useState<'rules' | 'staff'>('rules');

  // Staff list state (Admin Directory)
  const [staffList, setStaffList] = useState<AdminMember[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_STAFF_KEY);
      if (saved) {
        let parsed: AdminMember[] = JSON.parse(saved);
        // Clean out any legacy mock staff members (Shadow, Falcon, etc.)
        parsed = parsed.filter(
          (m) =>
            m.id !== 'staff-2' &&
            m.id !== 'staff-3' &&
            m.name !== 'Shadow' &&
            m.name !== 'Falcon' &&
            m.name !== 'Sniper'
        );
        if (parsed && parsed.length > 0) {
          localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(parsed));
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading staff list:', e);
    }
    return DEFAULT_STAFF_MEMBERS;
  });

  // 25 Ranks List State
  const [ranksList, setRanksList] = useState<PresetRankItem[]>(() => {
    return loadSavedRanksList();
  });

  const handleUpdateRanksList = (newRanks: PresetRankItem[], updatedStaffList?: AdminMember[]) => {
    setRanksList(newRanks);
    saveRanksListToStorage(newRanks);
    if (updatedStaffList) {
      setStaffList(updatedStaffList);
      try {
        localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(updatedStaffList));
      } catch (e) {
        console.error('Failed to sync staff list with renamed ranks', e);
      }
    }
    showNotification('تم تحديث وحفظ مسميات الرتب الإدارية ومزامنة الطاقم بنجاح!');
  };

  // 25 Rank Colors State (RGB system)
  const [rankColors, setRankColors] = useState<Record<string, string>>(() => {
    return loadSavedRankColors();
  });

  const handleUpdateRankColors = (newColors: Record<string, string>) => {
    setRankColors(newColors);
    saveRankColorsToStorage(newColors);
    showNotification('تم تحديث وحفظ ألوان الرتب الـ 25 بنجاح!');
  };

  // Site Branding & Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => loadSavedSiteSettings());

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = siteSettings.browserTabTitle || 'قوانين المخالفات';
      if (siteSettings.logoUrl) {
        const iconLinks = document.querySelectorAll("link[rel*='icon']");
        iconLinks.forEach((link) => {
          (link as HTMLLinkElement).href = siteSettings.logoUrl || '/majan_logo.jpg';
        });
      }
    }
  }, [siteSettings.browserTabTitle, siteSettings.logoUrl]);

  const handleUpdateSiteSettings = (newSettings: SiteSettings) => {
    setSiteSettings(newSettings);
    saveSiteSettingsToStorage(newSettings);
    if (typeof document !== 'undefined') {
      document.title = newSettings.browserTabTitle || 'قوانين المخالفات';
    }
    showNotification('تم تحديث هوية وإعدادات وشعار الموقع بنجاح');
  };

  // Modals
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState<boolean>(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState<boolean>(false);
  const [isOwnerDashboardOpen, setIsOwnerDashboardOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<RuleCategory | null>(null);
  const [detailViolation, setDetailViolation] = useState<{ violation: ViolationItem; category: RuleCategory } | null>(null);

  // Status message
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Determine if active user can edit
  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.email.toLowerCase() === OWNER_EMAIL.toLowerCase() || currentUser.role === 'owner') return true;
    return (
      hasUserPermission(currentUser, 'canEditViolations') ||
      hasUserPermission(currentUser, 'canEditCategories')
    );
  }, [currentUser]);

  const isSeniorAdminOrOwner = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) return true;
    return currentUser.role === 'owner' || hasUserPermission(currentUser, 'canManageUsers') || hasUserPermission(currentUser, 'canManageStaff');
  }, [currentUser]);

  // --- REAL-TIME POLLING SYNC FOR USER ELEVATION & ROLE PERMISSIONS ---
  useEffect(() => {
    const syncUserElevation = async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.users && Array.isArray(data.users)) {
          const serverUsers: AuthorizedUser[] = data.users;
          setAuthorizedUsers(serverUsers);
          saveAuthorizedUsers(serverUsers, false);

          const storedCode = typeof window !== 'undefined' ? localStorage.getItem('my_personal_user_code') : null;
          const activeCode = currentUser?.userCode || storedCode;
          const activeEmail = currentUser?.email?.toLowerCase();

          if (activeCode || activeEmail) {
            const matched = serverUsers.find(
              (u) =>
                (activeCode && u.userCode && u.userCode.toLowerCase() === activeCode.toLowerCase()) ||
                (activeEmail && u.email && u.email.toLowerCase() === activeEmail)
            );

            if (matched) {
              const currentRoleId = currentUser?.customRoleId || currentUser?.role;
              const newRoleId = matched.customRoleId || matched.role;
              const statusChanged =
                !currentUser ||
                currentRoleId !== newRoleId ||
                currentUser.isActive !== matched.isActive ||
                currentUser.name !== matched.name;

              if (statusChanged && (matched.role !== 'viewer' || currentUser)) {
                setCurrentUser(matched);
                saveCurrentSession(matched);
                if (matched.role !== 'viewer' && (!currentUser || currentUser.role === 'viewer')) {
                  const roleObj = getUserRoleObj(matched);
                  showNotification(`🎉 تم تفعيل رتبتك الإدارية [${roleObj.name}] بنجاح! تم فتح وضع التعديل وكامل الخصائص.`);
                }
              }
            }
          }
        }
      } catch (e) {
        // Polling failure is safe to ignore
      }
    };

    syncUserElevation();
    const interval = setInterval(syncUserElevation, 2500);
    return () => clearInterval(interval);
  }, [currentUser?.userCode, currentUser?.role, currentUser?.customRoleId]);

  // --- REAL-TIME POLLING & SYNC FOR STAFF LIST ---
  useEffect(() => {
    // Initial fetch from server
    syncWithServer<{ success: boolean; staff: AdminMember[] }>('/api/staff').then((data) => {
      if (data && data.staff && Array.isArray(data.staff) && data.staff.length > 0) {
        setStaffList(data.staff);
        try {
          localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(data.staff));
        } catch (e) {}
      } else {
        // Push initial/local staff to server
        syncWithServer('/api/staff', 'POST', { staff: staffList });
      }
    });

    // Background polling every 3 seconds to sync edits from all admins/owner
    const pollStaff = async () => {
      try {
        const data = await syncWithServer<{ success: boolean; staff: AdminMember[] }>('/api/staff');
        if (data && data.staff && Array.isArray(data.staff) && data.staff.length > 0) {
          setStaffList((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(data.staff)) {
              return data.staff;
            }
            return prev;
          });
        }
      } catch (e) {}
    };

    const interval = setInterval(pollStaff, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- REAL-TIME POLLING & SYNC FOR RULES & CATEGORIES ---
  useEffect(() => {
    // Initial fetch from server
    syncWithServer<{ success: boolean; categories: RuleCategory[] }>('/api/categories').then((data) => {
      if (data && data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
        setCategories(data.categories);
        try {
          localStorage.setItem(LOCAL_STORAGE_RULES_KEY, JSON.stringify(data.categories));
        } catch (e) {}
      } else {
        syncWithServer('/api/categories', 'POST', { categories });
      }
    });

    const pollCategories = async () => {
      try {
        const data = await syncWithServer<{ success: boolean; categories: RuleCategory[] }>('/api/categories');
        if (data && data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(data.categories)) {
              return data.categories;
            }
            return prev;
          });
        }
      } catch (e) {}
    };

    const interval = setInterval(pollCategories, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handler to update staff list and push to server
  const handleUpdateStaffList = (newList: AdminMember[]) => {
    setStaffList(newList);
    try {
      localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(newList));
    } catch (e) {}
    syncWithServer('/api/staff', 'POST', { staff: newList });
  };

  // Sync staff list to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(staffList));
    } catch (e) {
      console.error('Failed to save staff list', e);
    }
  }, [staffList]);

  // Sync rules
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_RULES_KEY, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save rules', e);
    }
    syncWithServer('/api/categories', 'POST', { categories });
  }, [categories]);

  // Sync authorized users
  useEffect(() => {
    saveAuthorizedUsers(authorizedUsers);
  }, [authorizedUsers]);

  // Sync current user session
  useEffect(() => {
    saveCurrentSession(currentUser);
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SELECTED_BANS_KEY, JSON.stringify(selectedBanItems));
    } catch (e) {
      console.error('Failed to save selected bans', e);
    }
  }, [selectedBanItems]);

  // --- MULTI-BAN SELECTION HANDLERS ---
  const handleAddBanItem = (item: Omit<SelectedBanItem, 'id'>) => {
    const newItem: SelectedBanItem = {
      ...item,
      id: `ban-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setSelectedBanItems((prev) => [...prev, newItem]);
    showNotification(`تمت إضافة مخالفة (${item.violationName}) لحاسبة الباند`);
  };

  const handleRemoveBanItem = (id: string) => {
    setSelectedBanItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllBans = () => {
    setSelectedBanItems([]);
    showNotification('تم تفريغ قائمة المخالفات من الحاسبة.');
  };

  const handleUpdateItemOccurrence = (id: string, occurrenceIndex: number) => {
    setSelectedBanItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const category = categories.find((c) => c.id === item.categoryId);
          const punishment = category?.punishments[occurrenceIndex] || category?.punishments[0];
          if (!punishment) return item;

          const parsed = parsePenaltyDuration(
            punishment.penalty,
            punishment.hours,
            punishment.days,
            punishment.isPerm || category?.isAbsolutePerm
          );

          return {
            ...item,
            occurrenceIndex,
            occurrenceText: punishment.times || `المرة ${occurrenceIndex + 1}`,
            penaltyText: parsed.displayText || punishment.penalty,
            hours: parsed.totalHours,
            days: Math.ceil(parsed.totalHours / 24),
            unit: parsed.unit,
            value: parsed.value,
            isPerm: parsed.isPerm,
          };
        }
        return item;
      })
    );
  };

  const handleUpdateItemCustomDuration = (
    id: string,
    unit: 'hours' | 'days' | 'months' | 'perm',
    value: number,
    isPerm: boolean,
    customText: string
  ) => {
    setSelectedBanItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          let computedHours = 0;
          let computedDays = 0;
          if (isPerm || unit === 'perm') {
            computedHours = 999999;
            computedDays = 9999;
          } else if (unit === 'months') {
            computedHours = value * 720;
            computedDays = value * 30;
          } else if (unit === 'days') {
            computedHours = value * 24;
            computedDays = value;
          } else {
            computedHours = value;
            computedDays = Math.ceil(value / 24);
          }

          return {
            ...item,
            penaltyText: customText,
            hours: computedHours,
            days: computedDays,
            unit,
            value,
            isPerm: isPerm || unit === 'perm',
          };
        }
        return item;
      })
    );
    showNotification('تم تحديث وتعديل وقت الباند بنجاح');
  };

  // Quick click on card violation to toggle/add to calculator
  const handleCardQuickBan = (
    violation: ViolationItem,
    category: RuleCategory,
    timesIndex: number = 0
  ) => {
    const existingIndex = selectedBanItems.findIndex((item) => item.violationId === violation.id);

    if (existingIndex >= 0) {
      const removed = selectedBanItems[existingIndex];
      handleRemoveBanItem(removed.id);
      showNotification(`تمت إزالة (${violation.name}) من الحاسبة`);
    } else {
      const punishment = category.punishments[timesIndex] || category.punishments[0];
      const parsed = parsePenaltyDuration(
        violation.penaltyText || punishment?.penalty || '5 ساعات',
        violation.durationHours || punishment?.hours,
        punishment?.days,
        violation.isPerm || punishment?.isPerm || category.isAbsolutePerm
      );

      handleAddBanItem({
        categoryId: category.id,
        categoryTitle: category.title,
        violationId: violation.id,
        violationName: violation.name,
        occurrenceIndex: timesIndex,
        occurrenceText: punishment?.times || 'المرة الأولى',
        penaltyText: parsed.displayText || violation.penaltyText || punishment?.penalty || '5 ساعات',
        hours: parsed.totalHours,
        days: Math.ceil(parsed.totalHours / 24),
        unit: parsed.unit,
        value: parsed.value,
        isPerm: parsed.isPerm,
      });
    }
  };

  const selectedViolationsMap = useMemo(() => {
    const map: Record<string, number> = {};
    selectedBanItems.forEach((item) => {
      map[item.violationId] = item.occurrenceIndex;
    });
    return map;
  }, [selectedBanItems]);

  // Permissions Management Handlers
  const handleAddAuthorizedUser = (
    email: string,
    name: string,
    role: UserRole | string,
    username?: string
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    if (authorizedUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'هذا البريد مسجل بالفعل ضمن قائمة المشرفين.' };
    }

    const assignedRoleObj = getRoleById(role);
    const standardRole: UserRole =
      role === 'owner' ? 'owner' : role === 'admin' ? 'admin' : 'editor';

    const newUser: AuthorizedUser = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      username: username || undefined,
      name: name || 'مشرف جديد',
      role: standardRole,
      customRoleId: role,
      addedAt: new Date().toISOString().split('T')[0],
      addedBy: currentUser?.email || OWNER_EMAIL,
      isActive: true,
    };

    const updated = [...authorizedUsers, newUser];
    setAuthorizedUsers(updated);
    saveAuthorizedUsers(updated);
    showNotification(`تمت إضافة ${name || cleanEmail} بنجاح كـ ${assignedRoleObj.name}`);
    return { success: true, message: `تم منح رتبة (${assignedRoleObj.name}) بنجاح!` };
  };

  const handleRemoveAuthorizedUser = (id: string) => {
    const updated = authorizedUsers.filter((u) => u.id !== id);
    setAuthorizedUsers(updated);
    saveAuthorizedUsers(updated);
    showNotification('تم سحب الصلاحية بنجاح.');
  };

  const handleLogin = (identifier: string) => {
    const authResult = authenticateUser(identifier);
    if (authResult.success && authResult.user) {
      setCurrentUser(authResult.user);
      saveCurrentSession(authResult.user);
      showNotification(authResult.message);
      return { success: true, message: authResult.message };
    }
    return { success: false, message: authResult.message };
  };

  const handleRegister = (
    email: string,
    name: string,
    username?: string,
    passcode?: string
  ) => {
    const regResult = registerNewUser(email, name, username, passcode);
    if (regResult.success && regResult.user) {
      setAuthorizedUsers(loadAuthorizedUsers());
      setCurrentUser(regResult.user);
      saveCurrentSession(regResult.user);
      showNotification(regResult.message);
      return { success: true, message: regResult.message };
    }
    return { success: false, message: regResult.message };
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveCurrentSession(null);
    showNotification('تم تسجيل الخروج وقفل وضع التعديل بنجاح.');
  };

  // Editing Categories Handlers
  const handleAddCategory = (newCategory: RuleCategory) => {
    setCategories((prev) => [...prev, newCategory]);
    showNotification(`تمت إضافة صندوق "${newCategory.title}" بنجاح للجدول!`);
  };

  const handleSaveCategory = (updatedCat: RuleCategory) => {
    setCategories((prev) => prev.map((c) => (c.id === updatedCat.id ? updatedCat : c)));
    showNotification(`تم حفظ التعديلات على صندوق "${updatedCat.title}" بنجاح!`);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    showNotification('تم حذف الصندوق.');
  };

  const handleQuickDeleteViolation = (categoryId: string, violationId: string) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === categoryId) {
          return {
            ...c,
            violations: c.violations.filter((v) => v.id !== violationId),
          };
        }
        return c;
      })
    );
    showNotification('تم حذف البند.');
  };

  const handleAddViolation = (categoryId: string, newViolation: ViolationItem) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            violations: [...cat.violations, newViolation],
          };
        }
        return cat;
      })
    );
    showNotification(`تمت إضافة مخالفة "${newViolation.name}" بنجاح!`);
  };

  const totalViolationsCount = useMemo(() => {
    return categories.reduce((acc, cat) => acc + cat.violations.length, 0);
  }, [categories]);

  // Filter categories by search query
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const query = searchTerm.toLowerCase();

    return categories
      .map((cat) => {
        const matchingViolations = cat.violations.filter(
          (v) =>
            v.name.toLowerCase().includes(query) ||
            cat.title.toLowerCase().includes(query) ||
            cat.punishments.some((p) => p.penalty.toLowerCase().includes(query) || p.times.toLowerCase().includes(query))
        );

        const catTitleMatches = cat.title.toLowerCase().includes(query);
        const punishmentMatches = cat.punishments.some((p) => p.penalty.toLowerCase().includes(query));

        if (matchingViolations.length > 0) {
          return {
            ...cat,
            violations: matchingViolations,
          };
        }

        if (catTitleMatches || punishmentMatches) {
          return cat;
        }

        return null;
      })
      .filter(Boolean) as RuleCategory[];
  }, [categories, searchTerm]);

  const totalMatches = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.violations.length, 0);
  }, [filteredCategories]);

  // Group into 4 rows (Y-axis: 4 rows, X-axis: 3 columns)
  const rows = useMemo(() => {
    const row1 = filteredCategories.filter((c) => c.rowGroup === 'row-1');
    const row2 = filteredCategories.filter((c) => c.rowGroup === 'row-2');
    const row3 = filteredCategories.filter((c) => c.rowGroup === 'row-3');
    const row4 = filteredCategories.filter((c) => c.rowGroup === 'row-4' || !c.rowGroup);

    return [
      { id: 'row-1', label: 'المستوى الأول', categories: row1 },
      { id: 'row-2', label: 'المستوى الثاني', categories: row2 },
      { id: 'row-3', label: 'المستوى الثالث والنهائي', categories: row3 },
      { id: 'row-4', label: 'المستوى الرابع (المركبات والعصابات)', categories: row4 },
    ].filter((r) => r.categories.length > 0);
  }, [filteredCategories]);

  // If currently in staff directory view, render AdminDirectory component
  if (currentView === 'staff') {
    return (
      <>
        <AdminDirectory
          currentUser={currentUser}
          onBackToRules={() => setCurrentView('rules')}
          staffList={staffList}
          onUpdateStaffList={handleUpdateStaffList}
          rankColors={rankColors}
          onUpdateRankColors={handleUpdateRankColors}
          ranksList={ranksList}
          onUpdateRanksList={handleUpdateRanksList}
        />
        {/* Floating Notification Toast */}
        {notification && (
          <div className="fixed bottom-6 left-6 z-50 px-4 py-3 rounded-2xl bg-[#14111c] border border-orange-500/50 text-white text-xs sm:text-sm font-bold shadow-[0_0_30px_rgba(249,115,22,0.35)] flex items-center gap-2.5 animate-in slide-in-from-bottom">
            <CheckCircle2 className="w-4 h-4 text-orange-400" />
            <span>{notification}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen relative bg-[#07060b] text-white flex flex-col selection:bg-orange-500 selection:text-black overflow-x-hidden font-sans">
      {/* INTERACTIVE DYNAMIC MOUSE-FOLLOWING BACKGROUND */}
      <InteractiveMouseBackground />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 left-6 z-50 px-4 py-3 rounded-2xl bg-[#14111c] border border-orange-500/50 text-white text-xs sm:text-sm font-bold shadow-[0_0_30px_rgba(249,115,22,0.35)] flex items-center gap-2.5 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-4 h-4 text-orange-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <Navbar
        totalViolations={totalViolationsCount}
        totalCategories={categories.length}
        currentUser={currentUser}
        canEdit={canEdit}
        siteSettings={siteSettings}
        onUpdateSiteSettings={handleUpdateSiteSettings}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenPermissions={() => setIsPermissionsOpen(true)}
        onOpenOwnerDashboard={() => setIsOwnerDashboardOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenAdminDirectory={() => setCurrentView('staff')}
        onOpenActivationModal={() => setIsActivationModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Editor Banner Reminder (When logged in as authorized) */}
      {canEdit && (
        <div className="relative z-10 bg-gradient-to-r from-orange-950/80 via-[#181224] to-orange-950/80 border-b border-orange-500/40 px-4 py-2 text-center text-xs text-orange-200 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                أهلاً بك <strong className="text-white font-mono">{currentUser?.name.replace(/\s*\([^)]*\)/g, '').trim() || currentUser?.name}</strong>{' '}
                <span className="text-orange-300 font-bold">
                  ({currentUser?.role === 'owner' ? 'المالك الأساسي' : currentUser?.role === 'admin' ? 'مشرف متقدم' : 'محرر جداول'})
                </span>
                . لديك كامل الصلاحيات لتعديل وإضافة أي بند أو عقوبة أو صندوق في الجدول.
              </span>
            </div>

            <div className="flex items-center gap-2 mr-auto">
              <button
                onClick={() => setIsAddCategoryOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs shadow-md transition cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>+ إضافة صندوق جديد</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#251e36] hover:bg-[#322849] border border-orange-500/40 text-orange-300 font-bold text-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ إضافة مخالفة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container with Sticky Sidebar Layout */}
      <main className="relative z-10 flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Simple & Clean Search */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          totalMatches={totalMatches}
          totalItems={totalViolationsCount}
        />

        {/* No Results Alert */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-16 px-4 bg-[#110d18]/80 backdrop-blur-md border-2 border-dashed border-orange-500/20 rounded-3xl my-6 shadow-2xl">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-3 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
            <h3 className="text-lg font-bold text-white mb-1">لم يتم العثور على أي نتائج</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto mb-4">
              لا توجد مخالفة تطابق "{searchTerm}".
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-extrabold text-xs shadow-lg cursor-pointer hover:from-orange-400 hover:to-amber-400 transition"
            >
              عرض جميع الجداول
            </button>
          </div>
        )}

        {/* TWO COLUMN WORKSPACE: Main Rules Grid (3 Columns × 4 Rows) + Side Cumulative Ban Calculator */}
        <div className="flex flex-col lg:flex-row items-start gap-6">
          
          {/* Main 3-Columns Grid on the right/main area */}
          <div className="flex-1 w-full space-y-7 sm:space-y-8">
            {rows.map((row) => (
              <div key={row.id} className="relative">
                {/* 3 Columns on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {row.categories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      searchTerm={searchTerm}
                      canEdit={canEdit}
                      onSelectViolation={(v, c) => setDetailViolation({ violation: v, category: c })}
                      onQuickBan={(v, c, tIdx) => handleCardQuickBan(v, c, tIdx)}
                      onEditCategory={(c) => setEditingCategory(c)}
                      onQuickDeleteViolation={handleQuickDeleteViolation}
                      selectedViolationsMap={selectedViolationsMap}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* SIDEBAR CUMULATIVE BAN CALCULATOR */}
          <div className="w-full lg:w-auto lg:sticky lg:top-24">
            <BanSidebarCalculator
              categories={categories}
              selectedItems={selectedBanItems}
              currentUser={currentUser}
              onRemoveItem={handleRemoveBanItem}
              onClearAll={handleClearAllBans}
              onAddItem={handleAddBanItem}
              onUpdateItemOccurrence={handleUpdateItemOccurrence}
              onUpdateItemCustomDuration={handleUpdateItemCustomDuration}
            />
          </div>

        </div>

      </main>

      {/* LOGIN & REGISTER MODAL (Direct Email / Google) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenPermissionsManager={() => setIsPermissionsOpen(true)}
        onOpenOwnerDashboard={() => setIsOwnerDashboardOpen(true)}
      />

      {/* ACTIVATION CODE & STAFF REQUEST MODAL */}
      <ActivationCodeModal
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        currentUser={currentUser}
        onSuccess={(msg) => {
          showNotification(msg);
          setAuthorizedUsers(loadAuthorizedUsers());
        }}
        onActivateUser={(user, msg) => {
          setCurrentUser(user);
          saveCurrentSession(user);
          setAuthorizedUsers(loadAuthorizedUsers());
          showNotification(msg);
        }}
      />

      {/* EXCLUSIVE OWNER DASHBOARD (Full 100% Control & User Management) */}
      <OwnerDashboardModal
        isOpen={isOwnerDashboardOpen}
        onClose={() => setIsOwnerDashboardOpen(false)}
        users={authorizedUsers}
        onRefreshUsers={() => setAuthorizedUsers(loadAuthorizedUsers())}
        currentUser={currentUser}
        onNotify={showNotification}
      />

      {/* PERMISSIONS & MEMBERS MODAL */}
      <PermissionsModal
        isOpen={isPermissionsOpen}
        onClose={() => setIsPermissionsOpen(false)}
        currentUser={currentUser}
        authorizedUsers={authorizedUsers}
        onAddUser={handleAddAuthorizedUser}
        onRemoveUser={handleRemoveAuthorizedUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        ownerEmail={OWNER_EMAIL}
      />

      <EditCategoryModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        category={editingCategory}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Multi-Ban Modal (For mobile or full popup view) */}
      <BanCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        categories={categories}
        selectedItems={selectedBanItems}
        onRemoveItem={handleRemoveBanItem}
        onClearAll={handleClearAllBans}
        onAddItem={handleAddBanItem}
        onUpdateItemOccurrence={handleUpdateItemOccurrence}
        onUpdateItemCustomDuration={handleUpdateItemCustomDuration}
      />

      <DiscordExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        categories={categories}
      />

      <RuleDetailModal
        isOpen={!!detailViolation}
        onClose={() => setDetailViolation(null)}
        violation={detailViolation?.violation || null}
        category={detailViolation?.category || null}
        onOpenCalculatorWithViolation={(v, c) => {
          handleCardQuickBan(v, c, 0);
          setDetailViolation(null);
        }}
      />

      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onAddCategory={handleAddCategory}
      />

      <AddRuleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        onAddViolation={handleAddViolation}
      />

      {/* Enhanced Footer */}
      <footer className="relative z-10 w-full border-t border-orange-500/20 bg-[#08060e]/90 backdrop-blur-xl py-6 text-center text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
            <span>جدول لوائح وباندات السيرفر المعتمد (3 أعمدة × 4 صفوف) مع حاسبة الباند التراكمية</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>المالك: <code className="text-orange-400 font-mono font-bold">Dofy</code></span>
            <span>•</span>
            <span>إجمالي البنود: <strong className="text-white">{totalViolationsCount}</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
