/**
 * Centralized API & Cloud Sync Configuration
 * Supports seamless communication whether running on Cloud Run, AI Studio, or external Netlify (majann.netlify.app)
 */

export const DEFAULT_REMOTE_BACKEND_URL = 'https://ais-dev-llndge4cehr2rkzwfxjbq4-606760982042.europe-west2.run.app';
export const LOCAL_STORAGE_REMOTE_BACKEND_KEY = 'majan_state_custom_backend_url';

export function getBackendBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  // If user configured a custom backend in local storage
  const custom = localStorage.getItem(LOCAL_STORAGE_REMOTE_BACKEND_KEY);
  if (custom && custom.trim().startsWith('http')) {
    return custom.trim().replace(/\/$/, '');
  }

  // If running on Netlify or external static host, fallback to the live Cloud Run backend
  const host = window.location.hostname;
  if (host.includes('netlify.app') || host.includes('vercel.app') || host.includes('github.io')) {
    return DEFAULT_REMOTE_BACKEND_URL;
  }

  // Otherwise, use relative path (same host)
  return '';
}

export function buildApiUrl(endpoint: string): string {
  const base = getBackendBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!base) return cleanEndpoint;
  return `${base}${cleanEndpoint}`;
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const url = buildApiUrl(endpoint);
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Quiet fail on network hiccups
  }
  return null;
}
