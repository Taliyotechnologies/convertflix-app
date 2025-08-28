import type { FileRecord, ActivityLog, DashboardStats, User, ContactMessage } from '../types';

const BASE: string = (import.meta as any).env?.VITE_API_BASE_URL as string || '';

function emitUnauthorized() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  } catch {}
}

export type RealtimeHandlers = {
  onFileUpsert?: (file: FileRecord) => void;
  onFilesReplace?: (files: FileRecord[]) => void;
  onActivity?: (log: ActivityLog) => void;
  onActivitiesReplace?: (logs: ActivityLog[]) => void;
  onStats?: (stats: DashboardStats) => void;
  onUsersReplace?: (users: User[]) => void;
  onUserUpsert?: (user: User) => void;
  onContactsReplace?: (contacts: ContactMessage[]) => void;
  onContactUpsert?: (contact: ContactMessage) => void;
};

function buildSSEUrl(): string | undefined {
  const explicit = (import.meta as any).env?.VITE_SSE_URL as string | undefined;
  const token = (typeof window !== 'undefined') ? (localStorage.getItem('adminToken') || '') : '';
  if (explicit) {
    return explicit + (token ? (explicit.includes('?') ? '&' : '?') + `token=${encodeURIComponent(token)}` : '');
  }
  // SSE backend support removed; do not fallback to BASE + '/admin/stream'
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

function looksLikeContactMessage(v: any): v is ContactMessage {
  return v && typeof v.id === 'string' && typeof v.email === 'string' && typeof v.createdAt === 'string' && typeof v.message === 'string';
}

export function subscribeSSE(handlers: RealtimeHandlers): () => void {
  const url0 = buildSSEUrl();
  if (!url0) {
    // No-op unsubscribe if not configured
    return () => {};
  }

  let es: EventSource | null = null;
  let lastAuthCheck = 0;
  let unsubscribed = false;
  let paused = false;

  // Throttle stats updates to reduce re-renders when visible
  const throttleMs = 500;
  let latestStats: DashboardStats | null = null;
  let statsTimer: ReturnType<typeof setTimeout> | null = null;
  let lastStatsFlush = 0;

  const flushStats = () => {
    if (latestStats) {
      handlers.onStats?.(latestStats);
      latestStats = null;
      lastStatsFlush = Date.now();
    }
    if (statsTimer) { clearTimeout(statsTimer); statsTimer = null; }
  };

  const emitStatsThrottled = (s: DashboardStats) => {
    latestStats = s;
    const now = Date.now();
    const elapsed = now - lastStatsFlush;
    if (!statsTimer) {
      if (elapsed >= throttleMs) {
        flushStats();
      } else {
        statsTimer = setTimeout(flushStats, throttleMs - elapsed);
      }
    }
  };

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
      if (looksLikeContactMessage(payload[0])) {
        handlers.onContactsReplace?.(payload as ContactMessage[]);
        return;
      }
    }

    if (looksLikeFileRecord(payload)) {
      handlers.onFileUpsert?.(payload as FileRecord);
      return;
    }

    if (looksLikeDashboardStats(payload)) {
      emitStatsThrottled(payload as DashboardStats);
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

    if (looksLikeContactMessage(payload)) {
      handlers.onContactUpsert?.(payload as ContactMessage);
      return;
    }
  };

  const attachHandlers = (inst: EventSource) => {
    inst.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        handlePayload(data);
      } catch (e) {
        // ignore non-JSON
      }
    };
    ['file', 'files', 'stats', 'activity', 'activities', 'users', 'contact', 'contacts'].forEach((eventName) => {
      inst.addEventListener(eventName, (evt: MessageEvent) => {
        try {
          const data = JSON.parse(evt.data);
          handlePayload(data);
        } catch {}
      });
    });
    inst.onerror = async () => {
      // Let the browser retry automatically; do a light auth check to detect expirations
      const now = Date.now();
      if (now - lastAuthCheck < 5000) return; // throttle checks
      lastAuthCheck = now;
      try {
        const token = (typeof window !== 'undefined') ? (localStorage.getItem('adminToken') || '') : '';
        if (!BASE || !token) return;
        const res = await fetch(`${BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) emitUnauthorized();
      } catch {
        // Ignore network errors here; SSE will retry
      }
    };
  };

  const connect = () => {
    if (unsubscribed || paused) return;
    const url = buildSSEUrl();
    if (!url) return;
    try {
      es = new EventSource(url);
      attachHandlers(es);
    } catch {}
  };

  const disconnect = () => {
    if (es) {
      try { es.close(); } catch {}
      es = null;
    }
  };

  // Visibility-aware connect
  const canUseDoc = typeof document !== 'undefined' && !!document.addEventListener;
  if (canUseDoc && typeof document.hidden !== 'undefined') {
    paused = document.hidden;
    if (!paused) connect();
    const onVis = () => {
      if (unsubscribed) return;
      if (document.hidden) {
        paused = true;
        disconnect();
        // clear any pending timers
        if (statsTimer) { clearTimeout(statsTimer); statsTimer = null; }
      } else {
        paused = false;
        if (!es) connect();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      unsubscribed = true;
      disconnect();
      if (statsTimer) { try { clearTimeout(statsTimer); } catch {} statsTimer = null; }
      try { document.removeEventListener('visibilitychange', onVis); } catch {}
    };
  } else {
    // Fallback: no visibility API available
    connect();
    return () => {
      unsubscribed = true;
      disconnect();
      if (statsTimer) { try { clearTimeout(statsTimer); } catch {} statsTimer = null; }
    };
  }
}
