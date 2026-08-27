import { AuthorizedUser, UserRole, CustomRole, RolePermissions, ActivationRequest } from '../types';

export const OWNER_EMAIL = 'alhassanalbleas@gmail.com';
export const LOCAL_STORAGE_USERS_KEY = 'server_ban_authorized_users_v7';
export const LOCAL_STORAGE_ROLES_KEY = 'server_ban_custom_roles_v7';
export const LOCAL_STORAGE_SESSION_KEY = 'server_ban_auth_session_v7';
export const LOCAL_STORAGE_MASTER_CODE_KEY = 'server_ban_master_invite_code_v7';
export const LOCAL_STORAGE_REQUESTS_KEY = 'server_ban_activation_requests_v7';

export const DEFAULT_MASTER_CODE = 'DOFY-STAFF-2026';

export function generateUserCode(seed?: string): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `MS-${num}`;
}

export const DEFAULT_ROLES: CustomRole[] = [
  {
    id: 'owner',
    name: 'المالك الأساسي',
    description: 'كامل الصلاحيات والتحكم الشامل بجميع أقسام النظام والسيرفر',
    color: '#f59e0b',
    badgeIcon: 'Crown',
    isSystem: true,
    permissions: {
      canEditViolations: true,
      canEditCategories: true,
      canManageStaff: true,
      canUseCalculator: true,
      canExportDiscord: true,
      canManageUsers: true,
    },
    createdAt: '2026-08-26',
  },
  {
    id: 'admin',
    name: 'مشرف متقدم (Head Admin)',
    description: 'تعديل الجداول والمخالفات + إدارة قائمة الإدارة والصلاحيات',
    color: '#f97316',
    badgeIcon: 'Shield',
    isSystem: true,
    permissions: {
      canEditViolations: true,
      canEditCategories: true,
      canManageStaff: true,
      canUseCalculator: true,
      canExportDiscord: true,
      canManageUsers: true,
    },
    createdAt: '2026-08-26',
  },
  {
    id: 'ban_mod',
    name: 'مسؤول مخالفات الباند',
    description: 'تعديل وإضافة بنود الباند والعقوبات واستخدام حاسبة الأوامر فقط',
    color: '#ef4444',
    badgeIcon: 'Gavel',
    isSystem: false,
    permissions: {
      canEditViolations: true,
      canEditCategories: false,
      canManageStaff: false,
      canUseCalculator: true,
      canExportDiscord: false,
      canManageUsers: false,
    },
    createdAt: '2026-08-26',
  },
  {
    id: 'editor',
    name: 'محرر جداول (Staff)',
    description: 'تعديل وحذف وإضافة المخالفات والصناديق في الجداول',
    color: '#3b82f6',
    badgeIcon: 'Edit3',
    isSystem: false,
    permissions: {
      canEditViolations: true,
      canEditCategories: true,
      canManageStaff: false,
      canUseCalculator: true,
      canExportDiscord: false,
      canManageUsers: false,
    },
    createdAt: '2026-08-26',
  },
  {
    id: 'viewer',
    name: 'مشاهد فقط (Viewer)',
    description: 'تصفح وقراءة اللوائح واستخدام الحاسبة دون صلاحية التعديل',
    color: '#71717a',
    badgeIcon: 'Eye',
    isSystem: true,
    permissions: {
      canEditViolations: false,
      canEditCategories: false,
      canManageStaff: false,
      canUseCalculator: true,
      canExportDiscord: false,
      canManageUsers: false,
    },
    createdAt: '2026-08-26',
  },
];

export const DEFAULT_USERS: AuthorizedUser[] = [
  {
    id: 'user-owner',
    email: OWNER_EMAIL,
    username: 'Dofy',
    name: 'Dofy',
    age: '24',
    userCode: 'MS-1001',
    role: 'owner',
    customRoleId: 'owner',
    addedAt: '2026-08-26',
    addedBy: 'النظام الأساسي',
    isActive: true,
  },
];

// ================= SYNC WITH SERVER ================= //

async function syncWithServer<T>(url: string, method: string = 'GET', body?: any): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Ignore offline or quiet errors
  }
  return null;
}

// Trigger initial background sync
if (typeof window !== 'undefined') {
  setTimeout(() => {
    // Sync Users from server
    syncWithServer<{ success: boolean; users: AuthorizedUser[] }>('/api/users').then((data) => {
      if (data && data.users && data.users.length > 0) {
        saveAuthorizedUsers(data.users, false);
      } else {
        // push local users to server
        const localUsers = loadAuthorizedUsers();
        syncWithServer('/api/users', 'POST', { users: localUsers });
      }
    });

    // Sync Requests from server
    syncWithServer<{ success: boolean; requests: ActivationRequest[] }>('/api/activation-requests').then((data) => {
      if (data && data.requests) {
        saveActivationRequests(data.requests, false);
      }
    });

    // Sync Custom Roles
    syncWithServer<{ success: boolean; roles: CustomRole[] }>('/api/custom-roles').then((data) => {
      if (data && data.roles && data.roles.length > 0) {
        saveCustomRoles(data.roles, false);
      } else {
        const localRoles = loadCustomRoles();
        syncWithServer('/api/custom-roles', 'POST', { roles: localRoles });
      }
    });
  }, 100);
}

// ================= ROLES MANAGEMENT ================= //

export function loadCustomRoles(): CustomRole[] {
  if (typeof window === 'undefined') return DEFAULT_ROLES;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_ROLES_KEY);
    if (saved) {
      const parsed: CustomRole[] = JSON.parse(saved);
      const ownerIdx = parsed.findIndex((r) => r.id === 'owner');
      if (ownerIdx === -1) {
        parsed.unshift(DEFAULT_ROLES[0]);
      } else {
        parsed[ownerIdx].isSystem = true;
        parsed[ownerIdx].permissions = {
          canEditViolations: true,
          canEditCategories: true,
          canManageStaff: true,
          canUseCalculator: true,
          canExportDiscord: true,
          canManageUsers: true,
        };
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading roles from localStorage:', e);
  }
  return DEFAULT_ROLES;
}

export function saveCustomRoles(roles: CustomRole[], pushToServer = true) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_ROLES_KEY, JSON.stringify(roles));
    if (pushToServer) {
      syncWithServer('/api/custom-roles', 'POST', { roles });
    }
  } catch (e) {
    console.error('Error saving roles to localStorage:', e);
  }
}

export function createCustomRole(roleData: {
  name: string;
  description?: string;
  color: string;
  badgeIcon?: string;
  permissions: RolePermissions;
}): CustomRole {
  const roles = loadCustomRoles();
  const id = `role-${Date.now()}`;
  const newRole: CustomRole = {
    id,
    name: roleData.name.trim() || 'رتبة جديدة',
    description: roleData.description?.trim() || '',
    color: roleData.color || '#f97316',
    badgeIcon: roleData.badgeIcon || 'Shield',
    isSystem: false,
    permissions: roleData.permissions,
    createdAt: new Date().toISOString().split('T')[0],
  };

  roles.push(newRole);
  saveCustomRoles(roles);
  return newRole;
}

export function updateCustomRole(
  roleId: string,
  updates: Partial<Omit<CustomRole, 'id' | 'isSystem'>>
): boolean {
  const roles = loadCustomRoles();
  const role = roles.find((r) => r.id === roleId);
  if (!role) return false;

  if (roleId === 'owner') {
    if (updates.name) role.name = updates.name;
    if (updates.description !== undefined) role.description = updates.description;
    if (updates.color) role.color = updates.color;
    role.permissions = {
      canEditViolations: true,
      canEditCategories: true,
      canManageStaff: true,
      canUseCalculator: true,
      canExportDiscord: true,
      canManageUsers: true,
    };
  } else {
    if (updates.name) role.name = updates.name;
    if (updates.description !== undefined) role.description = updates.description;
    if (updates.color) role.color = updates.color;
    if (updates.badgeIcon) role.badgeIcon = updates.badgeIcon;
    if (updates.permissions) {
      role.permissions = { ...role.permissions, ...updates.permissions };
    }
  }

  saveCustomRoles(roles);
  return true;
}

export function deleteCustomRole(roleId: string): boolean {
  if (roleId === 'owner' || roleId === 'viewer') return false;
  const roles = loadCustomRoles();
  const filtered = roles.filter((r) => r.id !== roleId);
  saveCustomRoles(filtered);

  const users = loadAuthorizedUsers();
  let modified = false;
  users.forEach((u) => {
    if (u.role === roleId || u.customRoleId === roleId) {
      u.role = 'editor';
      u.customRoleId = 'editor';
      modified = true;
    }
  });
  if (modified) saveAuthorizedUsers(users);

  return true;
}

export function getRoleById(roleIdOrName: string): CustomRole {
  const roles = loadCustomRoles();
  const found = roles.find(
    (r) => r.id === roleIdOrName || r.name.toLowerCase() === roleIdOrName.toLowerCase()
  );
  if (found) return found;

  if (roleIdOrName === 'admin') {
    return roles.find((r) => r.id === 'admin') || DEFAULT_ROLES[1];
  }
  if (roleIdOrName === 'editor') {
    return roles.find((r) => r.id === 'editor') || DEFAULT_ROLES[3];
  }
  if (roleIdOrName === 'owner') {
    return roles.find((r) => r.id === 'owner') || DEFAULT_ROLES[0];
  }
  return roles.find((r) => r.id === 'viewer') || DEFAULT_ROLES[4];
}

export function getUserRoleObj(user: AuthorizedUser | null): CustomRole {
  if (!user) return DEFAULT_ROLES[4]; // Viewer
  if (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase() || user.role === 'owner') {
    return DEFAULT_ROLES[0];
  }
  const roleId = user.customRoleId || user.role;
  return getRoleById(roleId);
}

export function getUserPermissions(user: AuthorizedUser | null): RolePermissions {
  if (!user || !user.isActive) {
    return {
      canEditViolations: false,
      canEditCategories: false,
      canManageStaff: false,
      canUseCalculator: true,
      canExportDiscord: false,
      canManageUsers: false,
    };
  }

  if (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase() || user.role === 'owner') {
    return {
      canEditViolations: true,
      canEditCategories: true,
      canManageStaff: true,
      canUseCalculator: true,
      canExportDiscord: true,
      canManageUsers: true,
    };
  }

  const roleObj = getUserRoleObj(user);
  return roleObj.permissions;
}

export function hasUserPermission(
  user: AuthorizedUser | null,
  permissionKey: keyof RolePermissions
): boolean {
  if (!user || !user.isActive) return false;
  if (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase() || user.role === 'owner') return true;
  const perms = getUserPermissions(user);
  return !!perms[permissionKey];
}

// ================= PASSCODE & CODE MANAGEMENT ================= //

export function getMasterPasscode(): string {
  if (typeof window === 'undefined') return DEFAULT_MASTER_CODE;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_MASTER_CODE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {
    console.error('Error reading master code:', e);
  }
  return DEFAULT_MASTER_CODE;
}

export function setMasterPasscode(newCode: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const clean = newCode.trim().toUpperCase();
    if (!clean) return false;
    localStorage.setItem(LOCAL_STORAGE_MASTER_CODE_KEY, clean);
    syncWithServer('/api/master-passcode', 'POST', { passcode: clean });
    return true;
  } catch (e) {
    console.error('Error saving master code:', e);
    return false;
  }
}

// ================= USERS MANAGEMENT ================= //

export function loadAuthorizedUsers(): AuthorizedUser[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (saved) {
      let parsed: AuthorizedUser[] = JSON.parse(saved);
      // Remove old hardcoded mock template users (Shadow, Sniper)
      const filtered = parsed.filter(
        (u) => u.id !== 'user-shadow' && u.id !== 'user-sniper'
      );
      let modified = filtered.length !== parsed.length;
      parsed = filtered;

      // Ensure all users have userCode
      parsed.forEach((u, i) => {
        if (!u.userCode) {
          u.userCode =
            u.id === 'user-owner' || u.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()
              ? 'MS-1001'
              : generateUserCode(u.name);
          modified = true;
        }
      });
      const ownerIdx = parsed.findIndex(
        (u) => u.email?.toLowerCase() === OWNER_EMAIL.toLowerCase() || u.role === 'owner'
      );
      if (ownerIdx === -1) {
        parsed.unshift(DEFAULT_USERS[0]);
        modified = true;
      } else {
        parsed[ownerIdx].role = 'owner';
        parsed[ownerIdx].isActive = true;
      }
      if (modified) {
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading users from localStorage:', e);
  }
  return DEFAULT_USERS;
}

export function resetUsersToOwnerOnly(): AuthorizedUser[] {
  const ownerOnly = [...DEFAULT_USERS];
  saveAuthorizedUsers(ownerOnly, true);
  return ownerOnly;
}

export function saveAuthorizedUsers(users: AuthorizedUser[], pushToServer = true) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
    if (pushToServer) {
      syncWithServer('/api/users', 'POST', { users });
    }
  } catch (e) {
    console.error('Error saving users to localStorage:', e);
  }
}

export function loadCurrentSession(): AuthorizedUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (saved) {
      const parsed: AuthorizedUser = JSON.parse(saved);
      if (parsed.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
        parsed.role = 'owner';
      }
      if (!parsed.userCode) {
        parsed.userCode = generateUserCode(parsed.name);
        saveCurrentSession(parsed);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading current auth session:', e);
  }
  return null;
}

export function saveCurrentSession(user: AuthorizedUser | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      if (!user.userCode) {
        user.userCode = generateUserCode(user.name);
      }
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    }
  } catch (e) {
    console.error('Error saving session:', e);
  }
}

/**
 * Authenticates user directly by Email, Username, or UserCode (No Password Required).
 * Automatically creates account as Viewer if not found.
 */
export function authenticateUser(
  identifier: string
): { success: boolean; user?: AuthorizedUser; message: string } {
  const users = loadAuthorizedUsers();
  const cleanId = identifier.trim().toLowerCase();

  if (!cleanId) {
    return {
      success: false,
      message: 'يرجى إدخال البريد الإلكتروني، اسم المستخدم، أو كود العضو الخاص بك.',
    };
  }

  // Check if owner
  const isOwner =
    cleanId === OWNER_EMAIL.toLowerCase() ||
    cleanId === 'dofy' ||
    cleanId === 'dooofy' ||
    cleanId.includes('alhassanalbleas');

  if (isOwner) {
    let ownerUser = users.find((u) => u.email.toLowerCase() === OWNER_EMAIL.toLowerCase());
    if (!ownerUser) {
      ownerUser = DEFAULT_USERS[0];
      users.unshift(ownerUser);
      saveAuthorizedUsers(users);
    }
    return {
      success: true,
      user: ownerUser,
      message: 'مرحبًا بك يا Dofy! تم تفعيل كامل صلاحيات المالك ووضع التعديل بنجاح.',
    };
  }

  // Find matching user by email, username, or userCode
  const matched = users.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      (u.username && u.username.toLowerCase() === cleanId) ||
      (u.userCode && u.userCode.toLowerCase() === cleanId)
  );

  if (matched) {
    if (!matched.isActive) {
      return {
        success: false,
        message: 'هذا الحساب معطل حالياً من قِبل إدارة السيرفر.',
      };
    }
    matched.lastLogin = new Date().toISOString();
    saveAuthorizedUsers(users);
    const roleObj = getUserRoleObj(matched);
    return {
      success: true,
      user: matched,
      message: `مرحبًا بك يا ${matched.name}! تم تسجيل الدخول بنجاح برتبة (${roleObj.name}).`,
    };
  }

  // If not found, auto-create as Viewer
  const displayName = cleanId.includes('@') ? cleanId.split('@')[0] : cleanId;
  const isEmail = cleanId.includes('@');

  const newUser: AuthorizedUser = {
    id: `user-${Date.now()}`,
    email: isEmail ? cleanId : `${cleanId.replace(/\s+/g, '')}@user.state`,
    name: displayName,
    username: !isEmail ? cleanId : undefined,
    userCode: generateUserCode(displayName),
    role: 'viewer',
    customRoleId: 'viewer',
    addedAt: new Date().toISOString().split('T')[0],
    addedBy: 'تسجيل دخول تلقائي (مشاهد)',
    isActive: true,
    lastLogin: new Date().toISOString(),
  };

  const updatedList = [...users, newUser];
  saveAuthorizedUsers(updatedList);

  return {
    success: true,
    user: newUser,
    message: `أهلاً بك يا ${newUser.name}! تم تسجيل دخولك برتبة مشاهد (كودك الخاص: ${newUser.userCode}).`,
  };
}

/**
 * Registers a new user account with Email and Name without password.
 */
export function registerNewUser(
  email: string,
  name: string,
  username?: string,
  passcode?: string,
  age?: string | number
): { success: boolean; user?: AuthorizedUser; message: string } {
  const users = loadAuthorizedUsers();
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const cleanUsername = username ? username.trim() : '';
  const cleanPasscode = passcode ? passcode.trim().toUpperCase() : '';

  if (!cleanEmail) {
    return {
      success: false,
      message: 'يرجى كتابة البريد الإلكتروني الخاص بك.',
    };
  }

  // Check if email already exists
  const existingIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
  if (existingIndex !== -1) {
    const existing = users[existingIndex];
    if (age) existing.age = age;
    if (cleanUsername) existing.username = cleanUsername;
    if (cleanName) existing.name = cleanName;
    if (!existing.userCode) existing.userCode = generateUserCode(existing.name);
    
    // If user entered valid master passcode, upgrade their role
    if (cleanPasscode && cleanPasscode === getMasterPasscode()) {
      if (existing.role === 'viewer' || existing.customRoleId === 'viewer') {
        existing.role = 'editor';
        existing.customRoleId = 'editor';
      }
    }
    saveAuthorizedUsers(users);
    const roleObj = getUserRoleObj(existing);
    return {
      success: true,
      user: existing,
      message: `الحساب مسجل بالفعل، مرحبًا بك يا ${existing.name} (${roleObj.name})! كودك الخاص: ${existing.userCode}`,
    };
  }

  const isOwner = cleanEmail === OWNER_EMAIL.toLowerCase() || cleanUsername.toLowerCase() === 'dofy';
  
  let role: UserRole = 'viewer';
  let customRoleId: string = 'viewer';

  if (isOwner) {
    role = 'owner';
    customRoleId = 'owner';
  } else if (cleanPasscode && cleanPasscode === getMasterPasscode()) {
    role = 'editor';
    customRoleId = 'editor';
  }

  const newUser: AuthorizedUser = {
    id: `user-${Date.now()}`,
    email: cleanEmail,
    name: cleanName || cleanUsername || cleanEmail.split('@')[0],
    username: cleanUsername || undefined,
    age: age || undefined,
    userCode: generateUserCode(cleanName || cleanUsername),
    role: role,
    customRoleId: customRoleId,
    addedAt: new Date().toISOString().split('T')[0],
    addedBy: cleanPasscode === getMasterPasscode() ? 'كود التفعيل السري' : 'تسجيل عبر الموقع',
    isActive: true,
    lastLogin: new Date().toISOString(),
  };

  const updatedList = [...users, newUser];
  saveAuthorizedUsers(updatedList);

  const roleObj = getRoleById(customRoleId);

  return {
    success: true,
    user: newUser,
    message: isOwner
      ? `تم إنشاء حساب المالك بنجاح! أهلاً بك يا ${newUser.name}.`
      : cleanPasscode === getMasterPasscode()
      ? `تم إنشاء الحساب وترقيته كـ (${roleObj.name}) بنجاح! كودك الخاص: ${newUser.userCode}`
      : `تم إنشاء الحساب بنجاح برتبة (${roleObj.name})! كودك الخاص هو: ${newUser.userCode}`,
  };
}

// ================= ACTIVATION REQUESTS SYSTEM ================= //

export function loadActivationRequests(): ActivationRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_REQUESTS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading activation requests:', e);
  }
  return [];
}

export function saveActivationRequests(requests: ActivationRequest[], pushToServer = true) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_REQUESTS_KEY, JSON.stringify(requests));
    if (pushToServer) {
      syncWithServer('/api/activation-requests', 'POST', requests);
    }
  } catch (e) {
    console.error('Error saving activation requests:', e);
  }
}

export function submitActivationRequest(data: {
  name: string;
  discordTag?: string;
  age?: string | number;
  requestedRole?: string;
  passcodeUsed?: string;
  userCode?: string;
  userEmail?: string;
  notes?: string;
}): { success: boolean; request: ActivationRequest; userCode: string; message: string; isInstantActive?: boolean; user?: AuthorizedUser } {
  const requests = loadActivationRequests();
  const users = loadAuthorizedUsers();

  const cleanName = data.name.trim();
  const cleanTag = data.discordTag?.trim() || '';
  const cleanPasscode = data.passcodeUsed?.trim().toUpperCase() || '';
  const code = data.userCode || generateUserCode(cleanName);

  // Check if master passcode was matched
  const isMasterPasscode = cleanPasscode && cleanPasscode === getMasterPasscode().toUpperCase();

  const newReq: ActivationRequest = {
    id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: cleanName,
    discordTag: cleanTag || undefined,
    age: data.age || undefined,
    requestedRole: data.requestedRole || undefined,
    passcodeUsed: cleanPasscode || undefined,
    userCode: code,
    userEmail: data.userEmail?.trim().toLowerCase() || undefined,
    status: 'pending',
    assignedRole: undefined,
    submittedAt: new Date().toISOString(),
    notes: [
      data.notes?.trim(),
      isMasterPasscode ? '✔️ تم التحقق من الكود السري بنجاح (بانتظار تحديد الرتبة بواسطة المالك Dofy)' : '',
    ]
      .filter(Boolean)
      .join(' | ') || undefined,
  };

  // Check if duplicate request from same code
  const existingIdx = requests.findIndex((r) => r.userCode === code);
  if (existingIdx >= 0) {
    requests[existingIdx] = newReq;
  } else {
    requests.unshift(newReq);
  }

  saveActivationRequests(requests);
  syncWithServer('/api/activation-requests', 'POST', newReq);

  // Sync / register user account in users list with viewer status until approved by Dofy
  const userIdx = users.findIndex(
    (u) =>
      (u.userCode && u.userCode.toLowerCase() === code.toLowerCase()) ||
      (data.userEmail && u.email.toLowerCase() === data.userEmail.toLowerCase())
  );

  let targetUser: AuthorizedUser;

  if (userIdx >= 0) {
    users[userIdx].name = cleanName;
    if (cleanTag) users[userIdx].username = cleanTag;
    if (data.age) users[userIdx].age = data.age;
    users[userIdx].userCode = code;
    targetUser = users[userIdx];
  } else {
    targetUser = {
      id: `user-${Date.now()}`,
      email: data.userEmail || `${(cleanTag || cleanName).replace(/\s+/g, '')}@user.state`,
      name: cleanName,
      username: cleanTag || undefined,
      age: data.age || undefined,
      userCode: code,
      role: 'viewer',
      customRoleId: 'viewer',
      addedAt: new Date().toISOString().split('T')[0],
      addedBy: 'طلب تفعيل جديد',
      isActive: true,
    };
    users.push(targetUser);
  }

  saveAuthorizedUsers(users);
  if (typeof window !== 'undefined') {
    localStorage.setItem('my_personal_user_code', code);
  }

  return {
    success: true,
    request: newReq,
    userCode: code,
    isInstantActive: false,
    user: targetUser,
    message: `تم تسجيل طلبك وكودك الخاص (${code}) بنجاح! سيقوم المالك (Dofy) بتحديد رتبتك واعتماد صلاحياتك يدوياً.`,
  };
}

/**
 * Check if a user's code has been activated or promoted by the Owner.
 */
export function checkActivationStatus(userCodeOrIdentifier: string): {
  success: boolean;
  isApproved: boolean;
  user?: AuthorizedUser;
  message: string;
} {
  const users = loadAuthorizedUsers();
  const clean = userCodeOrIdentifier.trim().toLowerCase();
  if (!clean) {
    return { success: false, isApproved: false, message: 'يرجى إدخال كود العضو أو اسم المستخدم.' };
  }

  const matched = users.find(
    (u) =>
      (u.userCode && u.userCode.toLowerCase() === clean) ||
      (u.username && u.username.toLowerCase() === clean) ||
      u.email.toLowerCase() === clean ||
      u.name.toLowerCase() === clean
  );

  if (!matched) {
    return {
      success: false,
      isApproved: false,
      message: 'لم يتم العثور على حساب بهذا الكود. يرجى إرسال طلب تفعيل أولاً.',
    };
  }

  const roleObj = getUserRoleObj(matched);
  const isElevated = matched.role !== 'viewer' && matched.customRoleId !== 'viewer' && matched.isActive;

  if (isElevated) {
    saveCurrentSession(matched);
    return {
      success: true,
      isApproved: true,
      user: matched,
      message: `🎉 مرحباً ${matched.name}! تم تفعيل رتبتك الإدارية [${roleObj.name}] بنجاح! تم فتح وضع التعديل وصلاحياتك كاملة.`,
    };
  }

  return {
    success: true,
    isApproved: false,
    user: matched,
    message: `طلبك بكود [${matched.userCode}] ما زال قيد الانتظار لموافقة المالك Dofy.`,
  };
}

export function approveActivationRequest(
  requestId: string,
  assignedRole: string,
  reviewerName = 'Dofy'
): { success: boolean; message: string } {
  const requests = loadActivationRequests();
  const users = loadAuthorizedUsers();

  const req = requests.find((r) => r.id === requestId);
  if (!req) return { success: false, message: 'الطلب غير موجود' };

  req.status = 'approved';
  req.assignedRole = assignedRole;
  req.reviewedBy = reviewerName;
  req.reviewedAt = new Date().toISOString();
  saveActivationRequests(requests);
  syncWithServer(`/api/activation-requests/${requestId}`, 'PUT', req);

  const roleObj = getRoleById(assignedRole);
  const standardRole: UserRole =
    assignedRole === 'owner'
      ? 'owner'
      : assignedRole === 'admin'
      ? 'admin'
      : assignedRole === 'viewer'
      ? 'viewer'
      : 'editor';

  // Find or update user
  const userIdx = users.findIndex(
    (u) =>
      (u.userCode && u.userCode === req.userCode) ||
      (req.userEmail && u.email.toLowerCase() === req.userEmail.toLowerCase()) ||
      (req.discordTag && u.username && u.username.toLowerCase() === req.discordTag.toLowerCase())
  );

  if (userIdx >= 0) {
    users[userIdx].role = standardRole;
    users[userIdx].customRoleId = assignedRole;
    users[userIdx].isActive = true;
    if (req.age) users[userIdx].age = req.age;
    if (req.name) users[userIdx].name = req.name;
    if (req.discordTag) users[userIdx].username = req.discordTag;
  } else {
    const newUser: AuthorizedUser = {
      id: `user-${Date.now()}`,
      email: req.userEmail || `${(req.discordTag || req.name).replace(/\s+/g, '')}@user.state`,
      name: req.name,
      username: req.discordTag || undefined,
      age: req.age || undefined,
      userCode: req.userCode,
      role: standardRole,
      customRoleId: assignedRole,
      addedAt: new Date().toISOString().split('T')[0],
      addedBy: `موافقة طلب تفعيل (${reviewerName})`,
      isActive: true,
    };
    users.push(newUser);
  }

  saveAuthorizedUsers(users);
  return {
    success: true,
    message: `تمت الموافقة على طلب (${req.name}) ومنحه رتبة [${roleObj.name}] بنجاح!`,
  };
}

export function rejectActivationRequest(requestId: string, reviewerName = 'Dofy'): boolean {
  const requests = loadActivationRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) return false;
  req.status = 'rejected';
  req.reviewedBy = reviewerName;
  req.reviewedAt = new Date().toISOString();
  saveActivationRequests(requests);
  syncWithServer(`/api/activation-requests/${requestId}`, 'PUT', req);
  return true;
}

export function deleteActivationRequest(requestId: string): boolean {
  let requests = loadActivationRequests();
  requests = requests.filter((r) => r.id !== requestId);
  saveActivationRequests(requests);
  syncWithServer(`/api/activation-requests/${requestId}`, 'DELETE');
  return true;
}

/**
 * Add or promote a staff member directly by their User Code or Username!
 */
export function addOrPromoteByUserCode(
  userCodeOrTag: string,
  roleId: string,
  details?: { name?: string; age?: string | number; username?: string }
): { success: boolean; user: AuthorizedUser; message: string } {
  const users = loadAuthorizedUsers();
  const cleanCode = userCodeOrTag.trim();
  const cleanLower = cleanCode.toLowerCase();

  if (!cleanCode) {
    throw new Error('يرجى كتابة كود العضو الخاص أو اسم المستخدم');
  }

  const roleObj = getRoleById(roleId);
  const standardRole: UserRole =
    roleId === 'owner' ? 'owner' : roleId === 'admin' ? 'admin' : roleId === 'viewer' ? 'viewer' : 'editor';

  const existingIdx = users.findIndex(
    (u) =>
      (u.userCode && u.userCode.toLowerCase() === cleanLower) ||
      (u.username && u.username.toLowerCase() === cleanLower) ||
      u.email.toLowerCase() === cleanLower ||
      u.name.toLowerCase() === cleanLower
  );

  if (existingIdx >= 0) {
    users[existingIdx].role = standardRole;
    users[existingIdx].customRoleId = roleId;
    users[existingIdx].isActive = true;
    if (details?.name) users[existingIdx].name = details.name.trim();
    if (details?.username) users[existingIdx].username = details.username.trim();
    if (details?.age) users[existingIdx].age = details.age;
    saveAuthorizedUsers(users);
    return {
      success: true,
      user: users[existingIdx],
      message: `تم ترقية وتعيين رتبة [${roleObj.name}] للعضو (${users[existingIdx].name}) بكود [${users[existingIdx].userCode}] بنجاح!`,
    };
  }

  // Create new user directly with this user code
  const isCodeFormat = cleanCode.toUpperCase().startsWith('MS-');
  const userCode = isCodeFormat ? cleanCode.toUpperCase() : generateUserCode(cleanCode);
  const newUser: AuthorizedUser = {
    id: `user-${Date.now()}`,
    email: `${cleanCode.replace(/\s+/g, '')}@majan.state`,
    name: details?.name?.trim() || cleanCode,
    username: details?.username?.trim() || (!isCodeFormat ? cleanCode : undefined),
    age: details?.age || undefined,
    userCode: userCode,
    role: standardRole,
    customRoleId: roleId,
    addedAt: new Date().toISOString().split('T')[0],
    addedBy: 'المالك Dofy (بواسطة كود العضو)',
    isActive: true,
  };

  users.push(newUser);
  saveAuthorizedUsers(users);

  return {
    success: true,
    user: newUser,
    message: `تم إضافة العضو (${newUser.name}) وتعيين رتبة [${roleObj.name}] بكود [${newUser.userCode}] بنجاح!`,
  };
}

/**
 * 1-Click Update User Role
 */
export function updateUserRole(userId: string, newRole: UserRole | string): boolean {
  const users = loadAuthorizedUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return false;
  if (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase() && newRole !== 'owner') {
    return false;
  }
  const standardRole: UserRole =
    newRole === 'owner' ? 'owner' : newRole === 'admin' ? 'admin' : newRole === 'viewer' ? 'viewer' : 'editor';

  user.role = standardRole;
  user.customRoleId = newRole;
  saveAuthorizedUsers(users);
  return true;
}

/**
 * Update complete user account details
 */
export function updateUserAccountDetails(
  userId: string,
  details: {
    name?: string;
    username?: string;
    email?: string;
    age?: string | number;
    userCode?: string;
    role?: string;
    isActive?: boolean;
  }
): { success: boolean; message: string; user?: AuthorizedUser } {
  const users = loadAuthorizedUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { success: false, message: 'المستخدم غير موجود' };
  }

  const isOwnerAccount = user.email.toLowerCase() === OWNER_EMAIL.toLowerCase();

  if (details.name && details.name.trim()) {
    user.name = details.name.trim();
  }
  if (details.username !== undefined) {
    user.username = details.username.trim() || undefined;
  }
  if (details.age !== undefined) {
    user.age = details.age;
  }
  if (details.userCode && details.userCode.trim()) {
    user.userCode = details.userCode.trim().toUpperCase();
  }
  if (details.email && details.email.trim()) {
    if (!isOwnerAccount) {
      user.email = details.email.trim().toLowerCase();
    }
  }
  if (details.role && !isOwnerAccount) {
    const standardRole: UserRole =
      details.role === 'owner'
        ? 'owner'
        : details.role === 'admin'
        ? 'admin'
        : details.role === 'viewer'
        ? 'viewer'
        : 'editor';
    user.role = standardRole;
    user.customRoleId = details.role;
  }
  if (details.isActive !== undefined && !isOwnerAccount) {
    user.isActive = details.isActive;
  }

  saveAuthorizedUsers(users);
  return { success: true, message: 'تم تحديث بيانات الحساب بنجاح', user };
}

/**
 * 1-Click Toggle Active / Disabled Status
 */
export function toggleUserStatus(userId: string): boolean {
  const users = loadAuthorizedUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return false;
  if (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) return false;
  user.isActive = !user.isActive;
  saveAuthorizedUsers(users);
  return true;
}

/**
 * Delete User Account
 */
export function removeUserAccount(userId: string): boolean {
  const users = loadAuthorizedUsers();
  const user = users.find((u) => u.id === userId);
  if (!user || user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) return false;
  const filtered = users.filter((u) => u.id !== userId);
  saveAuthorizedUsers(filtered);
  syncWithServer(`/api/users/${userId}`, 'DELETE');
  return true;
}

/**
 * Export Users Database to JSON
 */
export function exportUsersDatabase(): string {
  const users = loadAuthorizedUsers();
  return JSON.stringify(users, null, 2);
}

/**
 * Import Users Database from JSON
 */
export function importUsersDatabase(jsonData: string): { success: boolean; message: string; count?: number } {
  try {
    const parsed: AuthorizedUser[] = JSON.parse(jsonData);
    if (!Array.isArray(parsed)) {
      return { success: false, message: 'صيغة الملف غير صحيحة (يجب أن تكون مصفوفة JSON).' };
    }
    if (!parsed.some((u) => u.email.toLowerCase() === OWNER_EMAIL.toLowerCase())) {
      parsed.unshift(DEFAULT_USERS[0]);
    }
    saveAuthorizedUsers(parsed);
    return {
      success: true,
      message: `تم استعادة وتحديث قاعدة بيانات المستخدمين بنجاح (${parsed.length} حساب).`,
      count: parsed.length,
    };
  } catch (e) {
    return { success: false, message: 'حدث خطأ أثناء قراءة البيانات، تأكد من صحة نص الـ JSON.' };
  }
}


