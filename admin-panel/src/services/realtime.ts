import type { FileRecord, ActivityLog, DashboardStats, User } from '../types';

const BASE: string = (import.meta as any).env?.VITE_API_BASE_URL as string || '';

export type RealtimeHandlers = {
  onFileUpsert?: (file: FileRecord) => void;
  onFilesReplace?: (files: FileRecord[]) => void;
  onActivity?: (log: ActivityLog) => void;
  onActivitiesReplace?: (logs: ActivityLog[]) => void;
  onStats?: (stats: DashboardStats) => void;
  onUsersReplace?: (users: User[]) => void;
  onUserUpsert?: (user: User) => void;
};

function buildSSEUrl(): string | undefined {
  const explicit = (import.meta as any).env?.VITE_SSE_URL as string | undefined;
  const token = (typeof window !== 'undefined') ? (localStorage.getItem('adminToken') || '') : '';
  if (explicit) {
    return explicit + (token ? (explicit.includes('?') ? '&' : '?') + `token=${encodeURIComponent(token)}` : '');
  }
  if (BASE) {
    const url = BASE + '/admin/stream';
    return url + (token ? `?token=${encodeURIComponent(token)}` : '');
  }
  return undefined;
}

export function isSSEEnabled(): boolean {
  return Boolean(buildSSEUrl());
}

function looksLikeFileRecord(v: any): v is FileRecord {
  return v && typeof v.id === 'string' && typeof v.name === 'string' && typeof v.uploadedAt === 'string';
}

function looksLikeDashboardStats(v: any): v is DashboardStats {
  return v && typeof v.totalUsers === 'number' && typeof v.totalFiles === 'number' && typeof v.totalStorage === 'number';
}

function looksLikeActivityLog(v: any): v is ActivityLog {
  return v && typeof v.id === 'string' && typeof v.message === 'string' && typeof v.timestamp === 'string';
}

function looksLikeUser(v: any): v is User {
  return v && typeof v.id === 'string' && typeof v.email === 'string' && typeof v.createdAt === 'string';
}

export function subscribeSSE(handlers: RealtimeHandlers): () => void {
  const url = buildSSEUrl();
  if (!url) {
    // No-op unsubscribe if not configured
    return () => {};
  }

  const es = new EventSource(url);

  const handlePayload = (raw: any) => {
    const payload = raw?.payload ?? raw;

    if (Array.isArray(payload)) {
      // Could be files or activities
      if (payload.length === 0) return;
      if (looksLikeFileRecord(payload[0])) {
        handlers.onFilesReplace?.(payload as FileRecord[]);
        return;
      }
      if (looksLikeActivityLog(payload[0])) {
        handlers.onActivitiesReplace?.(payload as ActivityLog[]);
        return;
      }
      if (looksLikeUser(payload[0])) {
        handlers.onUsersReplace?.(payload as User[]);
        return;
      }
    }

    if (looksLikeFileRecord(payload)) {
      handlers.onFileUpsert?.(payload as FileRecord);
      return;
    }

    if (looksLikeDashboardStats(payload)) {
      handlers.onStats?.(payload as DashboardStats);
      return;
    }

    if (looksLikeActivityLog(payload)) {
      handlers.onActivity?.(payload as ActivityLog);
      return;
    }

    if (looksLikeUser(payload)) {
      handlers.onUserUpsert?.(payload as User);
      return;
    }
  };

  es.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data);
      handlePayload(data);
    } catch (e) {
      // Non-JSON messages are ignored in this generic connector
      // console.debug('SSE non-JSON message', evt.data);
    }
  };

  // Optional named events if the server emits them
  ['file', 'files', 'stats', 'activity', 'activities', 'users'].forEach((eventName) => {
    es.addEventListener(eventName, (evt: MessageEvent) => {
      try {
        const data = JSON.parse(evt.data);
        handlePayload(data);
      } catch {}
    });
  });

  es.onerror = () => {
    // Let the browser retry automatically; minimal handling here
    // console.warn('SSE connection error');
  };

  return () => {
    try { es.close(); } catch {}
  };
}
