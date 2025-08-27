import type { AdminSettings, DashboardStats } from '../types';

const BASE: string = (import.meta.env.VITE_API_BASE_URL as string) || '';

function normalizeHeaders(h?: HeadersInit): Record<string, string> {
  if (!h) return {};
  if (Array.isArray(h)) return Object.fromEntries(h as [string, string][]);
  if (typeof Headers !== 'undefined' && h instanceof Headers) {
    return Object.fromEntries((h as Headers).entries());
  }
  return h as Record<string, string>;
}

function emitUnauthorized() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  } catch {}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('adminToken');
  const baseHeaders: Record<string, string> = { 'Accept': 'application/json' };
  if (token) baseHeaders['Authorization'] = `Bearer ${token}`;
  const mergedHeaders = { ...baseHeaders, ...normalizeHeaders(init?.headers) };
  const res = await fetch(BASE + path, { ...(init || {}), headers: mergedHeaders });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) emitUnauthorized();
    const text = await res.text().catch(() => '');
    throw new Error(`API ${path} failed: ${res.status} ${res.statusText} ${text}`);
  }
  // Handle empty responses safely
  const text = await res.text();
  try {
    return (text ? JSON.parse(text) : {}) as T;
  } catch {
    // If not JSON, throw for visibility
    throw new Error(`API ${path} returned non-JSON response`);
  }
}

export async function getAdminSettings(): Promise<AdminSettings> {
  return request<AdminSettings>('/admin/settings');
}

export async function updateAdminSettings(payload: Partial<AdminSettings>): Promise<AdminSettings> {
  return request<AdminSettings>('/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getAdminStats(): Promise<DashboardStats> {
  return request<DashboardStats>('/admin/stats');
}
