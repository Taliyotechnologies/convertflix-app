import type { DashboardStats, FileRecord, ActivityLog, User, AdminSettings } from '../types';

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

async function requestOk(path: string, init?: RequestInit): Promise<boolean> {
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
  return true;
}

export async function getStats(): Promise<DashboardStats> {
  return request<DashboardStats>('/admin/stats');
}

export async function getFiles(limit?: number): Promise<FileRecord[]> {
  const path = typeof limit === 'number' ? `/admin/files?limit=${limit}` : '/admin/files';
  return request<FileRecord[]>(path);
}

export async function getActivity(params?: { since?: string; limit?: number; severity?: 'info' | 'error' | 'warning' }): Promise<ActivityLog[]> {
  const qs = new URLSearchParams();
  if (params?.since) qs.set('since', params.since);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.severity) qs.set('severity', params.severity);
  const path = '/admin/activity' + (qs.toString() ? `?${qs.toString()}` : '');
  return request<ActivityLog[]>(path);
}

export async function getUsers(params?: { status?: 'active' | 'inactive'; q?: string; limit?: number }): Promise<User[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.q) qs.set('q', params.q);
  if (params?.limit) qs.set('limit', String(params.limit));
  const path = '/admin/users' + (qs.toString() ? `?${qs.toString()}` : '');
  return request<User[]>(path);
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

export async function deleteFile(id: string): Promise<boolean> {
  return requestOk(`/admin/files/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function createUser(payload: { email: string; password: string; name: string; role?: 'admin' | 'sub-admin' | 'user' }): Promise<User> {
  return request<User>('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id: string): Promise<boolean> {
  return requestOk(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function resetUserPassword(id: string): Promise<{ success: boolean; tempPassword?: string }> {
  return request<{ success: boolean; tempPassword?: string }>(`/users/${encodeURIComponent(id)}/reset-password`, { method: 'POST' });
}
