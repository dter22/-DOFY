// Site Title & Branding Configuration
// Only the Owner (Owner Role or OWNER_EMAIL) has permissions to modify site title

export interface SiteSettings {
  siteTitle: string;
  siteSubtitle: string;
  serverName: string;
  browserTabTitle: string;
  logoUrl?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteTitle: 'Server Rival',
  siteSubtitle: 'النظام الرسمي للوائح المحاسبة ومخالفات الرول بلاي',
  serverName: 'سيرفر Rival',
  browserTabTitle: 'قوانين المخالفات',
  logoUrl: '',
};

const LOCAL_STORAGE_SITE_SETTINGS_KEY = 'server_site_settings_v3';

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
      document.title = settings.browserTabTitle || 'قوانين المخالفات';
      
      // Update favicon if custom logoUrl is provided
      if (settings.logoUrl) {
        const iconLinks = document.querySelectorAll("link[rel*='icon']");
        iconLinks.forEach((link) => {
          (link as HTMLLinkElement).href = settings.logoUrl || '/majan_logo.jpg';
        });
      }
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
