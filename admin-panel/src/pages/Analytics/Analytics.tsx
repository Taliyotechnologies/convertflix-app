import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users as UsersIcon,
  FileText,
  Activity as ActivityIcon,
  Database,
  PieChart as PieChartIcon,
  CheckCircle,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { getStats, getFiles, getActivity } from '../../services/api';
import { subscribeSSE, isSSEEnabled } from '../../services/realtime';
import { formatFileSize, formatPercentage, formatDate } from '../../utils/format';
import type { FileRecord, ActivityLog, DashboardStats } from '../../types';
import styles from './Analytics.module.css';
import {
  ResponsiveContainer,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart as RPieChart,
  Pie,
  Cell,
  CartesianGrid,
  ComposedChart,
} from 'recharts';

type RangeKey = '24h' | '7d' | '30d' | 'all';
type SeverityKey = 'all' | 'info' | 'error';
type StatusKey = 'all' | 'completed' | 'failed' | 'processing';
type TypeKey = 'all' | 'image' | 'video' | 'audio' | 'pdf' | 'document';

const Analytics: React.FC = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<DashboardStats>(() => ({
    totalUsers: 0,
    totalFiles: 0,
    totalStorage: 0,
    filesProcessedToday: 0,
    conversionRate: 0,
    averageFileSize: 0,
    activeUsers: 0,
    totalVisits: 0,
  }));

  // Filters
  const [range, setRange] = useState<RangeKey>('7d');
  const [severity, setSeverity] = useState<SeverityKey>('all');
  const [statusFilter, setStatusFilter] = useState<StatusKey>('all');
  const [typeFilter, setTypeFilter] = useState<TypeKey>('all');

  const rangeStart = useMemo(() => {
    const now = new Date();
    const d = new Date(now);
    switch (range) {
      case '24h': d.setDate(now.getDate() - 1); break;
      case '7d': d.setDate(now.getDate() - 7); break;
      case '30d': d.setDate(now.getDate() - 30); break;
      case 'all': return null;
    }
    return d;
  }, [range]);

  // Derived: distribution
  const fileTypeCounts = useMemo(() => files.reduce<Record<string, number>>((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1;
    return acc;
  }, {}), [files]);
  const fileTypeEntries = Object.entries(fileTypeCounts);

  // Derived: success vs failed vs processing
  const statusCounts = useMemo(() => {
    const res = { completed: 0, failed: 0, processing: 0 };
    for (const f of files) {
      if (f.status === 'completed') res.completed++;
      else if (f.status === 'failed') res.failed++;
      else if (f.status === 'processing') res.processing++;
    }
    return res;
  }, [files]);

  // Derived: averages
  const averages = useMemo(() => {
    const withRatio = files.filter(f => typeof f.compressionRatio === 'number');
    const avgCompression = withRatio.length
      ? (withRatio.reduce((s, f) => s + (f.compressionRatio as number), 0) / withRatio.length)
      : 0;

    const withTimes = files.filter(f => f.uploadedAt && f.convertedAt);
    const avgConvMs = withTimes.length
      ? (withTimes.reduce((s, f) => s + (new Date(f.convertedAt as string).getTime() - new Date(f.uploadedAt as string).getTime()), 0) / withTimes.length)
      : 0;

    const avgConvMins = avgConvMs / 60000;

    return { avgCompression, avgConvMins };
  }, [files]);

  // Top uploaders
  const topUploaders = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of files) {
      const key = f.uploadedBy || 'Unknown';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);
  }, [files]);

  // Recent conversions table (filterable)
  const filteredConversions = useMemo(() => {
    return files.filter(f => {
      const sOk = statusFilter === 'all' || f.status === statusFilter;
      const tOk = typeFilter === 'all' || f.type === typeFilter;
      return sOk && tOk;
    }).slice().sort((a,b)=> new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [statusFilter, typeFilter, files]);

  // Filtered activity logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const tOk = !rangeStart || new Date(log.timestamp) >= rangeStart;
      const sOk = severity === 'all' || log.severity === severity;
      return tOk && sOk;
    });
  }, [rangeStart, severity, logs]);

  // Theme-aware colors (fallbacks if CSS variables not resolved)
  const theme = useMemo(() => {
    if (typeof window === 'undefined') return {
      primary: '#3b82f6', secondary: '#60a5fa', success: '#10b981', error: '#ef4444', warn: '#f59e0b', text: '#64748b'
    };
    const s = getComputedStyle(document.documentElement);
    const get = (v: string, fb: string) => s.getPropertyValue(v)?.trim() || fb;
    return {
      primary: get('--accent-primary', '#3b82f6'),
      secondary: get('--accent-secondary', '#2563eb'),
      success: get('--accent-success', '#10b981'),
      error: get('--accent-error', '#ef4444'),
      warn: get('--accent-warning', '#f59e0b'),
      text: get('--text-muted', '#64748b')
    };
  }, []);

  // Data loading: initial fetch + realtime via SSE (fallback to polling)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, f, a] = await Promise.all([
          getStats().catch(() => null),
          getFiles(500).catch(() => []),
          getActivity({ limit: 200 }).catch(() => []),
        ]);
        if (!alive) return;
        if (s) setStats(s);
        setFiles(f || []);
        setLogs(a || []);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!isSSEEnabled()) return;
    const unsub = subscribeSSE({
      onFileUpsert: (file) => {
        setFiles(prev => {
          const idx = prev.findIndex(x => x.id === file.id);
          if (idx === -1) return [file, ...prev].slice(0, 500);
          const next = [...prev];
          next[idx] = { ...next[idx], ...file };
          return next;
        });
      },
      onFilesReplace: (arr) => setFiles(arr.slice(0, 500)),
      onActivity: (log) => setLogs(prev => [log, ...prev].slice(0, 500)),
      onActivitiesReplace: (arr) => setLogs(arr.slice(0, 200)),
      onStats: (s) => setStats(s),
    });
    return () => { try { unsub(); } catch {} };
  }, []);

  useEffect(() => {
    if (isSSEEnabled()) return;
    const id = setInterval(async () => {
      try {
        const [s, f, a] = await Promise.all([
          getStats().catch(() => null),
          getFiles(500).catch(() => null),
          getActivity({ limit: 200 }).catch(() => null),
        ]);
        if (s) setStats(s);
        if (f) setFiles(f);
        if (a) setLogs(a);
      } catch {}
    }, 10000);
    return () => clearInterval(id);
  }, []);

  // Daily aggregates for charts (based on uploadedAt and status)
  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; processed: number; completed: number; failed: number }>();
    for (const f of files) {
      const d = new Date(f.uploadedAt);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      if (rangeStart && d < rangeStart) continue;
      const entry = map.get(key) || { date: key, processed: 0, completed: 0, failed: 0 };
      entry.processed += 1;
      if (f.status === 'completed') entry.completed += 1;
      if (f.status === 'failed') entry.failed += 1;
      map.set(key, entry);
    }
    const arr = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    return arr.map(x => ({
      ...x,
      rate: x.processed ? Math.round((x.completed / x.processed) * 100) : 0
    }));
  }, [rangeStart, files]);

  const handleExportCsv = () => {
    const rows = [['id','type','message','timestamp','userId','severity'],
      ...filteredLogs.map(l => [l.id, l.type, l.message, l.timestamp, l.userId || '', l.severity])];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-${range}-${severity}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics</h1>
        <p className={styles.subtitle}>Key metrics and recent activity for ConvertFlix</p>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Date Range</label>
          <select value={range} onChange={(e) => setRange(e.target.value as RangeKey)} className={styles.select}>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Severity</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value as SeverityKey)} className={styles.select}>
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusKey)} className={styles.select}>
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="processing">Processing</option>
          </select>
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Type</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeKey)} className={styles.select}>
            <option value="all">All</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="pdf">PDF</option>
            <option value="document">Document</option>
          </select>
        </div>
        <button className={styles.exportButton} onClick={handleExportCsv}>Export CSV</button>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <UsersIcon size={22} className={styles.kpiIcon} />
            <span className={styles.kpiLabel}>Total Users</span>
          </div>
          <div className={styles.kpiValue}>{stats.totalUsers.toLocaleString()}</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <FileText size={22} className={styles.kpiIcon} />
            <span className={styles.kpiLabel}>Total Files</span>
          </div>
          <div className={styles.kpiValue}>{stats.totalFiles.toLocaleString()}</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <ActivityIcon size={22} className={styles.kpiIcon} />
            <span className={styles.kpiLabel}>Processed Today</span>
          </div>
          <div className={styles.kpiValue}>{stats.filesProcessedToday.toLocaleString()}</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <TrendingUp size={22} className={styles.kpiIcon} />
            <span className={styles.kpiLabel}>Conversion Rate</span>
          </div>
          <div className={styles.kpiValue}>{formatPercentage(stats.conversionRate)}</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <Database size={22} className={styles.kpiIcon} />
            <span className={styles.kpiLabel}>Total Storage</span>
          </div>
          <div className={styles.kpiValue}>{formatFileSize(stats.totalStorage)}</div>
        </div>

        
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Files processed & conversion rate */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <TrendingUp size={22} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Processing Trend</h3>
          </div>
          <div className={styles.chartWrap}>
            {dailyData.length === 0 ? (
              <div className={styles.emptyState}>No data for selected range</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={dailyData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.text + '55'} />
                  <XAxis dataKey="date" stroke={theme.text} fontSize={12} />
                  <YAxis yAxisId="left" stroke={theme.text} fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke={theme.text} fontSize={12} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="processed" fill={theme.secondary} stroke={theme.secondary} name="Processed" />
                  <Line yAxisId="right" type="monotone" dataKey="rate" stroke={theme.primary} name="Conversion %" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        {/* Success vs Failed */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <TrendingUp size={22} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Conversion Outcomes</h3>
          </div>
          <div className={styles.outcomes}> 
            <div className={styles.outcomeItem}>
              <span className={styles.outcomeLabel}>Completed</span>
              <span className={styles.outcomeValue}>{statusCounts.completed}</span>
              <div className={styles.outcomeBarWrap}><div className={styles.outcomeBarSuccess} style={{ width: `${Math.max(6, Math.round((statusCounts.completed / Math.max(1, files.length)) * 100))}%` }} /></div>
            </div>
            <div className={styles.outcomeItem}>
              <span className={styles.outcomeLabel}>Failed</span>
              <span className={styles.outcomeValue}>{statusCounts.failed}</span>
              <div className={styles.outcomeBarWrap}><div className={styles.outcomeBarError} style={{ width: `${Math.max(6, Math.round((statusCounts.failed / Math.max(1, files.length)) * 100))}%` }} /></div>
            </div>
            <div className={styles.outcomeItem}>
              <span className={styles.outcomeLabel}>Processing</span>
              <span className={styles.outcomeValue}>{statusCounts.processing}</span>
              <div className={styles.outcomeBarWrap}><div className={styles.outcomeBarWarn} style={{ width: `${Math.max(6, Math.round((statusCounts.processing / Math.max(1, files.length)) * 100))}%` }} /></div>
            </div>
          </div>
        </div>
        {/* File Type Distribution (Pie) */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <PieChartIcon size={22} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>File Type Distribution</h3>
          </div>
          <div className={styles.chartWrap}>
            {fileTypeEntries.length === 0 ? (
              <div className={styles.emptyState}>No file data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <RPieChart>
                  <Pie data={fileTypeEntries.map(([name, value]) => ({ name, value }))} dataKey="value" nameKey="name" outerRadius={100}>
                    {fileTypeEntries.map((e, idx) => (
                      <Cell key={e[0]} fill={[theme.primary, theme.secondary, theme.success, theme.warn, theme.error][idx % 5]} />
                    ))}
                  </Pie>
                  <Legend />
                </RPieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <BarChart3 size={22} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Recent Activity</h3>
          </div>
          <div className={styles.activityList}>
            {filteredLogs.map((log) => (
              <div key={log.id} className={styles.activityItem}>
                <div className={styles.activityLeft}>
                  {log.severity === 'error' ? (
                    <AlertTriangle size={16} className={styles.activityError} />
                  ) : (
                    <CheckCircle size={16} className={styles.activityOk} />
                  )}
                  <span className={styles.activityMsg}>{log.message}</span>
                </div>
                <div className={styles.activityMeta}>
                  <Calendar size={14} />
                  <span>{formatDate(log.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row */}
      <div className={styles.secondaryRow}>
        {/* Key Averages */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <BarChart3 size={22} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Key Averages</h3>
          </div>
          <div className={styles.avgGrid}>
            <div className={styles.avgItem}>
              <span className={styles.avgLabel}>Avg Compression</span>
              <span className={styles.avgValue}>{formatPercentage(averages.avgCompression)}</span>
            </div>
            <div className={styles.avgItem}>
              <span className={styles.avgLabel}>Avg Conversion Time</span>
              <span className={styles.avgValue}>{averages.avgConvMins.toFixed(1)} min</span>
            </div>
          </div>
        </div>

        {/* Top Uploaders */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <UsersIcon size={22} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Top Uploaders</h3>
          </div>
          <div className={styles.uploaderList}>
            {topUploaders.map(([email, count]) => (
              <div key={email} className={styles.uploaderItem}>
                <span className={styles.uploaderEmail}>{email}</span>
                <span className={styles.uploaderCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conversions Table */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <FileText size={22} className={styles.cardIcon} />
          <h3 className={styles.cardTitle}>Recent Conversions</h3>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th>Converted</th>
              </tr>
            </thead>
            <tbody>
              {filteredConversions.map(f => (
                <tr key={f.id}>
                  <td>{f.name}</td>
                  <td className={styles.cap}>{f.type}</td>
                  <td>
                    <span className={`${styles.badge} ${f.status === 'completed' ? styles.badgeSuccess : f.status === 'failed' ? styles.badgeError : styles.badgeWarn}`}>{f.status}</span>
                  </td>
                  <td>{formatFileSize(f.size)}</td>
                  <td>{formatDate(f.uploadedAt)}</td>
                  <td>{f.convertedAt ? formatDate(f.convertedAt) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
