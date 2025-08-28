import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getAdminStats } from '../../services/api';
import type { DashboardStats } from '../../types';
import styles from './Dashboard.module.css';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(2)} ${units[i]}`;
}

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#1D4ED8'];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const s = await getAdminStats();
      setStats(s);
      setLastUpdated(Date.now());
    } catch (e: any) {
      setError(e?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 15000); // refresh every 15s
    return () => clearInterval(id);
  }, [fetchStats]);

  const deviceTypeData = useMemo(() => {
    const map = stats?.deviceTypeDevices || {};
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [stats]);

  const countryVisitData = useMemo(() => {
    const map = stats?.countryVisits || {};
    const sorted = Object.entries(map).sort((a, b) => (b[1] as number) - (a[1] as number));
    return sorted.slice(0, 5).map(([name, value]) => ({ name, value }));
  }, [stats]);

  const kpis = useMemo(() => ([
    { label: 'Total Users', value: stats?.totalUsers ?? 0 },
    { label: 'Total Files', value: stats?.totalFiles ?? 0 },
    { label: 'Files Today', value: stats?.filesProcessedToday ?? 0 },
    { label: 'Conversion Rate', value: `${(stats?.conversionRate ?? 0).toFixed(2)}%` },
    { label: 'Avg File Size', value: formatBytes(stats?.averageFileSize ?? 0) },
    { label: 'Active Users (7d)', value: stats?.activeUsers ?? 0 },
    { label: 'Total Visits', value: stats?.totalVisits ?? 0 },
    { label: 'Unique Devices', value: stats?.uniqueDevices ?? 0 },
  ]), [stats]);

  const mem = stats?.mem || { rssMB: 0, heapUsedMB: 0 } as any;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>Dashboard</div>
        <div className={styles.actions}>
          <button className={styles.button} onClick={fetchStats} title="Refresh">
            <RefreshCw size={16} style={{ marginRight: 6 }} /> Refresh
          </button>
          {lastUpdated && (
            <span className={styles.hint}>
              Updated {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className={styles.panel}>Loading stats...</div>
      )}

      {!loading && error && (
        <div className={styles.panel} style={{ color: 'var(--accent-error)' }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className={styles.kpis}>
            {kpis.map((k) => (
              <div key={k.label} className={styles.card}>
                <div className={styles.cardTitle}>{k.label}</div>
                <div className={styles.cardValue}>{k.value}</div>
              </div>
            ))}
          </section>

          <section className={styles.grid}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>Devices by Type</div>
                <div className={styles.hint}>from unique devices</div>
              </div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={deviceTypeData}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>Visits by Country (Top 5)</div>
                <div className={styles.hint}>recent window</div>
              </div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={countryVisitData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label
                    >
                      {countryVisitData.map((_, idx) => (
                        <Cell key={`c-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className={styles.smallGrid}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>Server Memory</div>
                <div className={styles.hint}>snapshot</div>
              </div>
              <div className={styles.list}>
                <div className={styles.row}>
                  <div>RSS</div>
                  <div className={styles.badge}>{mem.rssMB ?? 0} MB</div>
                </div>
                <div className={styles.row}>
                  <div>Heap Used</div>
                  <div className={styles.badge}>{mem.heapUsedMB ?? 0} MB</div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;
