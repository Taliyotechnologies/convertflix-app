import type { AdminSettings, DashboardStats, ContactMessage, FileRecord } from '../types';

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

// Contacts
export async function getContacts(): Promise<ContactMessage[]> {
  return request<ContactMessage[]>('/admin/contacts');
}

export async function updateContactMessage(id: string, patch: Partial<ContactMessage>): Promise<ContactMessage> {
  return request<ContactMessage>(`/admin/contacts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch || {}),
  });
}

// Files
export async function getFiles(params?: {
  range?: '7d' | '30d' | 'all';
  from?: string; // ISO
  to?: string;   // ISO
  limit?: number;
}): Promise<FileRecord[]> {
  const q = new URLSearchParams();
  if (params?.range) q.set('range', params.range);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<FileRecord[]>(`/admin/files${qs ? `?${qs}` : ''}`);
}

export async function seedMockFiles(count?: number, force?: boolean): Promise<{ inserted: number; message?: string }> {
  const q = new URLSearchParams();
  if (typeof count === 'number') q.set('count', String(count));
  if (typeof force === 'boolean') q.set('force', String(force));
  const qs = q.toString();
  return request<{ inserted: number; message?: string }>(`/admin/files/seed-mock${qs ? `?${qs}` : ''}` , {
    method: 'POST',
  });
}
