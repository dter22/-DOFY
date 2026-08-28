// Site Title & Branding Configuration
// Only the Owner (Owner Role or OWNER_EMAIL) has permissions to modify site title

export interface SiteSettings {
  siteTitle: string;
  siteSubtitle: string;
  serverName: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteTitle: 'Majan Management',
  siteSubtitle: 'النظام الرسمي للوائح المحاسبة ومخالفات الرول بلاي',
  serverName: 'سيرفر Majan State',
};

const LOCAL_STORAGE_SITE_SETTINGS_KEY = 'server_site_settings_v2';

export function loadSavedSiteSettings(): SiteSettings {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SITE_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_SITE_SETTINGS,
        ...parsed,
      };
    }
  } catch (e) {
    console.error('Error loading site settings:', e);
  }
  return DEFAULT_SITE_SETTINGS;
}

export function saveSiteSettingsToStorage(settings: SiteSettings): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_SITE_SETTINGS_KEY, JSON.stringify(settings));
    // Also broadcast change to update document title
    if (typeof document !== 'undefined') {
      document.title = `${settings.siteTitle} - ${settings.serverName}`;
    }
    // Async push to server
    fetch('/api/site-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteSettings: settings }),
    }).catch(() => {});
  } catch (e) {
    console.error('Error saving site settings:', e);
  }
}
