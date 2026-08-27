// Rank System Configuration: Handles customizable 25 Rank Names & Colors

export interface PresetRankItem {
  id: string;
  number: number;
  name: string;
  defaultName: string;
  tierId: 'management' | 'middle-management' | 'high-management';
  tierTitle: string;
}

export interface ManagementTierGroup {
  id: 'management' | 'middle-management' | 'high-management';
  title: string;
  description: string;
  ranks: PresetRankItem[];
}

export const DEFAULT_PRESET_RANKS: PresetRankItem[] = [
  // Management (1 - 10)
  { id: 'rank-1', number: 1, name: 'Support', defaultName: 'Support', tierId: 'management', tierTitle: 'Management (الإدارة الأساسية)' },
  { id: 'rank-2', number: 2, name: 'Trial Mod', defaultName: 'Trial Mod', tierId: 'management', tierTitle: 'Management (الإدارة الأساسية)' },
  { id: 'rank-3', number: 3, name: 'Senior Mod', defaultName: 'Senior Mod', tierId: 'management', tierTitle: 'Management (الإدارة الأساسية)' },
  { id: 'rank-4', number: 4, name: 'Moderator', defaultName: 'Moderator', tierId: 'management', tierTitle: 'Management (الإدارة الأساسية)' },
  { id: 'rank-5', number: 5, name: 'Lead Mod', defaultName: 'Lead Mod', tierId: 'management', tierTitle: 'Management (الإدارة الأساسية)' },
  { id: 'rank-6', number: 6, name: 'Trial', defaultName: 'Trial', tierId: 'management', tierTitle: 'Management (الإدارة الأساسية)' },
  { id: 'rank-7', number: 7, name: 'Trusted', defaultName: 'Trusted', tierId: 'management', tierTitle: 'Management (الإدارة الأساسية)' },
  { id: 'rank-8', number: 8, name: 'Skilled', defaultName: 'Skilled', tierId: 'management', tierTitle: 'Management (الإدارة الأساسية)' },
  { id: 'rank-9', number: 9, name: 'Senior Staff', defaultName: 'Senior Staff', tierId: 'management', tierTitle: 'Management (الإدارة الأساسية)' },
  { id: 'rank-10', number: 10, name: 'Experienced', defaultName: 'Experienced', tierId: 'management', tierTitle: 'Management (الإدارة الأساسية)' },

  // Middle Management (11 - 20)
  { id: 'rank-11', number: 11, name: 'Senior Supervisor', defaultName: 'Senior Supervisor', tierId: 'middle-management', tierTitle: 'Middle Management (الإدارة الوسطى)' },
  { id: 'rank-12', number: 12, name: 'Supervisor', defaultName: 'Supervisor', tierId: 'middle-management', tierTitle: 'Middle Management (الإدارة الوسطى)' },
  { id: 'rank-13', number: 13, name: 'Staff', defaultName: 'Staff', tierId: 'middle-management', tierTitle: 'Middle Management (الإدارة الوسطى)' },
  { id: 'rank-14', number: 14, name: 'Operator', defaultName: 'Operator', tierId: 'middle-management', tierTitle: 'Middle Management (الإدارة الوسطى)' },
  { id: 'rank-15', number: 15, name: 'Senior Admin', defaultName: 'Senior Admin', tierId: 'middle-management', tierTitle: 'Middle Management (الإدارة الوسطى)' },
  { id: 'rank-16', number: 16, name: 'Trial Admin', defaultName: 'Trial Admin', tierId: 'middle-management', tierTitle: 'Middle Management (الإدارة الوسطى)' },
  { id: 'rank-17', number: 17, name: 'Admin', defaultName: 'Admin', tierId: 'middle-management', tierTitle: 'Middle Management (الإدارة الوسطى)' },
  { id: 'rank-18', number: 18, name: 'Lead Admin', defaultName: 'Lead Admin', tierId: 'middle-management', tierTitle: 'Middle Management (الإدارة الوسطى)' },
  { id: 'rank-19', number: 19, name: 'Head Admin', defaultName: 'Head Admin', tierId: 'middle-management', tierTitle: 'Middle Management (الإدارة الوسطى)' },
  { id: 'rank-20', number: 20, name: 'Executive Admin', defaultName: 'Executive Admin', tierId: 'middle-management', tierTitle: 'Middle Management (الإدارة الوسطى)' },

  // High Management (21 - 25)
  { id: 'rank-21', number: 21, name: 'Console', defaultName: 'Console', tierId: 'high-management', tierTitle: 'High Management (الإدارة العليا)' },
  { id: 'rank-22', number: 22, name: 'Director', defaultName: 'Director', tierId: 'high-management', tierTitle: 'High Management (الإدارة العليا)' },
  { id: 'rank-23', number: 23, name: 'Executive', defaultName: 'Executive', tierId: 'high-management', tierTitle: 'High Management (الإدارة العليا)' },
  { id: 'rank-24', number: 24, name: 'Controller', defaultName: 'Controller', tierId: 'high-management', tierTitle: 'High Management (الإدارة العليا)' },
  { id: 'rank-25', number: 25, name: 'Marshal', defaultName: 'Marshal', tierId: 'high-management', tierTitle: 'High Management (الإدارة العليا)' },
];

export const ARABIC_PRESET_NAMES: Record<number, string> = {
  1: 'دعم فني (Support)',
  2: 'مساعد متدرب (Trial Mod)',
  3: 'مساعد أول (Senior Mod)',
  4: 'مشرف (Moderator)',
  5: 'مشرف رئيسي (Lead Mod)',
  6: 'متدرب (Trial)',
  7: 'عضو موثوق (Trusted)',
  8: 'إداري محترف (Skilled)',
  9: 'طاقم إداري أول (Senior Staff)',
  10: 'إداري خبير (Experienced)',
  11: 'مشرف عام أول (Sr Supervisor)',
  12: 'مشرف عام (Supervisor)',
  13: 'مسؤول رقابة (Staff)',
  14: 'موجه عمليات (Operator)',
  15: 'إداري متقدم (Senior Admin)',
  16: 'إداري تجريبي (Trial Admin)',
  17: 'إداري (Admin)',
  18: 'إداري قيادي (Lead Admin)',
  19: 'كبير الإداريين (Head Admin)',
  20: 'إداري تنفيذي (Executive Admin)',
  21: 'كونسول السيرفر (Console)',
  22: 'مدير الإدارة (Director)',
  23: 'نائب المدير العام (Executive)',
  24: 'متحكم السيرفر (Controller)',
  25: 'المارشال العام (Marshal)',
};

export const DEFAULT_RANK_COLORS: Record<string, string> = {
  'Support': '#06B6D4',
  'Trial Mod': '#0EA5E9',
  'Senior Mod': '#3B82F6',
  'Moderator': '#10B981',
  'Lead Mod': '#14B8A6',
  'Trial': '#64748B',
  'Trusted': '#8B5CF6',
  'Skilled': '#6366F1',
  'Senior Staff': '#2563EB',
  'Experienced': '#059669',
  'Senior Supervisor': '#7C3AED',
  'Supervisor': '#9333EA',
  'Staff': '#0284C7',
  'Operator': '#0D9488',
  'Senior Admin': '#D97706',
  'Trial Admin': '#F59E0B',
  'Admin': '#EA580C',
  'Lead Admin': '#E11D48',
  'Head Admin': '#C026D3',
  'Executive Admin': '#DC2626',
  'Console': '#EAB308',
  'Director': '#F97316',
  'Executive': '#BE185D',
  'Controller': '#7E22CE',
  'Marshal': '#EF4444',
};

const LOCAL_STORAGE_RANKS_KEY = 'server_custom_ranks_list_v1';
const LOCAL_STORAGE_RANK_COLORS_KEY = 'server_custom_rank_colors_v2';

export function loadSavedRanks(): PresetRankItem[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_RANKS_KEY);
    if (saved) {
      const parsed: PresetRankItem[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading custom ranks:', e);
  }
  return DEFAULT_PRESET_RANKS;
}

export function saveRanksToStorage(ranks: PresetRankItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_RANKS_KEY, JSON.stringify(ranks));
  } catch (e) {
    console.error('Error saving custom ranks:', e);
  }
}

export const loadSavedRanksList = loadSavedRanks;
export const saveRanksListToStorage = saveRanksToStorage;

export function loadSavedRankColors(): Record<string, string> {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_RANK_COLORS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_RANK_COLORS, ...parsed };
    }
  } catch (e) {
    console.error('Error reading rank colors:', e);
  }
  return { ...DEFAULT_RANK_COLORS };
}

export function saveRankColorsToStorage(colors: Record<string, string>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_RANK_COLORS_KEY, JSON.stringify(colors));
  } catch (e) {
    console.error('Error saving rank colors:', e);
  }
}

export function getRankColor(
  rankName: string,
  customColors?: Record<string, string>,
  ranksList?: PresetRankItem[]
): string {
  if (!rankName) return '#F97316';

  // 1. Direct name match in custom colors
  if (customColors && customColors[rankName]) {
    return customColors[rankName];
  }

  // 2. Check if rankName matches any item in ranksList by id or defaultName
  if (ranksList) {
    const found = ranksList.find(
      (r) => r.name.toLowerCase() === rankName.toLowerCase() || r.defaultName.toLowerCase() === rankName.toLowerCase()
    );
    if (found) {
      if (customColors && customColors[found.name]) return customColors[found.name];
      if (customColors && customColors[found.defaultName]) return customColors[found.defaultName];
      if (customColors && customColors[found.id]) return customColors[found.id];
      if (DEFAULT_RANK_COLORS[found.defaultName]) return DEFAULT_RANK_COLORS[found.defaultName];
    }
  }

  // 3. Fallback to DEFAULT_RANK_COLORS
  if (DEFAULT_RANK_COLORS[rankName]) {
    return DEFAULT_RANK_COLORS[rankName];
  }

  return '#F97316';
}

export function groupRanksByTier(ranks: PresetRankItem[]): ManagementTierGroup[] {
  return [
    {
      id: 'management',
      title: 'Management (الإدارة الأساسية)',
      description: 'الرتب من 1 إلى 10',
      ranks: ranks.filter((r) => r.tierId === 'management'),
    },
    {
      id: 'middle-management',
      title: 'Middle Management (الإدارة الوسطى)',
      description: 'الرتب من 11 إلى 20',
      ranks: ranks.filter((r) => r.tierId === 'middle-management'),
    },
    {
      id: 'high-management',
      title: 'High Management (الإدارة العليا)',
      description: 'الرتب من 21 إلى 25',
      ranks: ranks.filter((r) => r.tierId === 'high-management'),
    },
  ];
}
