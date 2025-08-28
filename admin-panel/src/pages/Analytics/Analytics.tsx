import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import styles from './Analytics.module.css';
import { getAdminStats, getAdminSettings, updateAdminSettings } from '../../services/api';
import type { AdminSettings, DashboardStats } from '../../types';
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

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#1D4ED8', '#14B8A6', '#60A5FA'];

type CountryMetric = 'visits' | 'devices';

const Analytics: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countryMetric, setCountryMetric] = useState<CountryMetric>('visits');
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [retentionDays, setRetentionDays] = useState<number | null>(null);
  const [updatingRetention, setUpdatingRetention] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [deviceSearch, setDeviceSearch] = useState('');

  const countryChartRef = useRef<HTMLDivElement | null>(null);
  const deviceChartRef = useRef<HTMLDivElement | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const s = await getAdminStats();
      setStats(s);
      setLastUpdated(Date.now());
    } catch (e: any) {
      setError(e?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // fetch settings for current retention window
    (async () => {
      try {
        const s = await getAdminSettings();
        setRetentionDays(s?.autoDeleteDays ?? null);
      } catch {}
    })();
    const id = setInterval(fetchStats, 15000);
    return () => clearInterval(id);
  }, [fetchStats]);

  function downloadCSV(filename: string, rows: Array<Record<string, any>>) {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadChartPNG(ref: React.RefObject<HTMLDivElement | null>, filename: string) {
    try {
      const el = ref.current;
      if (!el) return;
      const svg = el.querySelector('svg');
      if (!svg) return;
      // Determine size
      const { width, height } = (svg as SVGGraphicsElement).getBBox();
      const vb = (svg as SVGSVGElement).getAttribute('viewBox');
      let w = (svg as SVGSVGElement).width.baseVal.value || el.clientWidth || 600;
      let h = (svg as SVGSVGElement).height.baseVal.value || el.clientHeight || 300;
      if (vb) {
        const parts = vb.split(' ').map(Number);
        if (parts.length === 4) { w = parts[2]; h = parts[3]; }
      } else if (width && height) {
        w = Math.max(w, width + 24);
        h = Math.max(h, height + 24);
      }
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('width', String(w));
      clone.setAttribute('height', String(h));
      const xml = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(url); return; }
        // Fill background for better readability
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob((b) => {
          if (!b) return;
          const dl = URL.createObjectURL(b);
          const a = document.createElement('a');
          a.href = dl;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(dl);
        });
      };
      img.src = url;
    } catch {}
  }

  const deviceTypeData = useMemo(() => {
    const map = stats?.deviceTypeDevices || stats?.deviceTypeVisits || {};
    const rows = Object.entries(map).map(([name, value]) => ({ name, value }));
    const term = deviceSearch.trim().toLowerCase();
    return term ? rows.filter(r => r.name.toLowerCase().includes(term)) : rows;
  }, [stats, deviceSearch]);

  const countryVisitsData = useMemo(() => {
    const visits = stats?.countryVisits || {};
    const devices = stats?.countryDevices || {};
    const source = countryMetric === 'visits' ? visits : devices;
    const sorted = Object.entries(source).sort((a, b) => (b[1] as number) - (a[1] as number));
    const rows = sorted.map(([name, value]) => ({ name, value }));
    const term = countrySearch.trim().toLowerCase();
    const filtered = term ? rows.filter(r => r.name.toLowerCase().includes(term)) : rows;
    return filtered.slice(0, 7);
  }, [stats, countryMetric, countrySearch]);

  const kpis = useMemo(() => ([
    { label: `Total Visits${retentionDays ? ` (last ${retentionDays}d)` : ''}`, value: stats?.totalVisits ?? 0 },
    { label: 'Unique Devices', value: stats?.uniqueDevices ?? 0 },
    { label: 'New Devices Today', value: stats?.newDevicesToday ?? 0 },
    { label: 'Conversion Rate', value: `${(stats?.conversionRate ?? 0).toFixed(2)}%` },
  ]), [stats, retentionDays]);

  const topCountries = useMemo(() => {
    const src = (countryMetric === 'visits' ? (stats?.countryVisits || {}) : (stats?.countryDevices || {}));
    const sorted = Object.entries(src).sort((a, b) => (b[1] as number) - (a[1] as number));
    const rows = sorted.map(([name, value]) => ({ name, value }));
    const term = countrySearch.trim().toLowerCase();
    const filtered = term ? rows.filter(r => r.name.toLowerCase().includes(term)) : rows;
    return filtered.slice(0, 10);
  }, [stats, countryMetric, countrySearch]);

  const deviceTable = useMemo(() => {
    const map = stats?.deviceTypeDevices || stats?.deviceTypeVisits || {};
    const sorted = Object.entries(map).sort((a, b) => (b[1] as number) - (a[1] as number));
    const rows = sorted.map(([name, value]) => ({ name, value }));
    const term = deviceSearch.trim().toLowerCase();
    return term ? rows.filter(r => r.name.toLowerCase().includes(term)) : rows;
  }, [stats, deviceSearch]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>Analytics</div>
        <div className={styles.actions}>
          <div className={styles.segmented} role="tablist" aria-label="Country metric">
            <button
              className={`${styles.segButton} ${countryMetric === 'visits' ? styles.segActive : ''}`}
              onClick={() => setCountryMetric('visits')}
              role="tab"
              aria-selected={countryMetric === 'visits'}
            >Visits</button>
            <button
              className={`${styles.segButton} ${countryMetric === 'devices' ? styles.segActive : ''}`}
              onClick={() => setCountryMetric('devices')}
              role="tab"
              aria-selected={countryMetric === 'devices'}
            >Devices</button>
          </div>
          <div className={styles.segmented} role="tablist" aria-label="Retention window">
            {[7, 14, 30].map(d => (
              <button
                key={d}
                className={`${styles.segButton} ${retentionDays === d ? styles.segActive : ''}`}
                onClick={async () => {
                  if (retentionDays === d || updatingRetention) return;
                  setUpdatingRetention(true);
                  const prev = retentionDays;
                  setRetentionDays(d);
                  try {
                    await updateAdminSettings({ autoDeleteDays: d } as Partial<AdminSettings>);
                    await fetchStats();
                  } catch (e) {
                    setRetentionDays(prev ?? null);
                  } finally {
                    setUpdatingRetention(false);
                  }
                }}
                role="tab"
                aria-selected={retentionDays === d}
                aria-busy={updatingRetention}
              >{d}d</button>
            ))}
          </div>
          <button className={styles.btn} onClick={fetchStats}>Refresh</button>
          {lastUpdated && (
            <span className={styles.hint} aria-live="polite">Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {loading && (
        <>
          <section className={styles.kpis}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`${styles.kpiCard} ${styles.skeletonCard}`} />
            ))}
          </section>
          <section className={styles.grid}>
            <div className={styles.panel}>
              <div className={`${styles.chartWrap} ${styles.skeletonChart}`} />
            </div>
            <div className={styles.panel}>
              <div className={`${styles.chartWrap} ${styles.skeletonChart}`} />
            </div>
          </section>
        </>
      )}
      {!loading && error && <div className={styles.panel} style={{ color: 'var(--accent-error)' }}>{error}</div>}

      {!loading && !error && (
        <>
          <section className={styles.kpis}>
            {kpis.map(k => (
              <div key={k.label} className={styles.kpiCard}>
                <div className={styles.kpiLabel}>{k.label}</div>
                <div className={styles.kpiValue}>{k.value}</div>
              </div>
            ))}
          </section>

          <section className={styles.grid}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>Top Countries ({countryMetric})</div>
                <div className={styles.actions}>
                  <button
                    className={styles.btnGhost}
                    onClick={() => downloadCSV(`top-countries-${countryMetric}.csv`, countryVisitsData.map(r => ({ Country: r.name, Count: r.value })))}
                  >Export CSV</button>
                  <button
                    className={styles.btnGhost}
                    onClick={() => downloadChartPNG(countryChartRef, `top-countries-${countryMetric}.png`)}
                  >Export PNG</button>
                  <div className={styles.hint}>Top 7</div>
                </div>
              </div>
              <div className={styles.chartWrap} ref={countryChartRef}>
                <ResponsiveContainer>
                  <BarChart data={countryVisitsData}>
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
                <div>Device Types</div>
                <div className={styles.actions}>
                  <button
                    className={styles.btnGhost}
                    onClick={() => downloadCSV('device-types.csv', deviceTypeData.map(r => ({ Type: r.name, Count: r.value })))}
                  >Export CSV</button>
                  <button
                    className={styles.btnGhost}
                    onClick={() => downloadChartPNG(deviceChartRef, 'device-types.png')}
                  >Export PNG</button>
                  <div className={styles.hint}>from unique devices</div>
                </div>
              </div>
              <div className={styles.chartWrap} ref={deviceChartRef}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={deviceTypeData} dataKey="value" nameKey="name" outerRadius={90} label>
                      {deviceTypeData.map((_, idx) => (
                        <Cell key={`dev-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className={styles.grid}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>Top Countries ({countryMetric})</div>
                <div className={styles.actions}>
                  <button
                    className={styles.btnGhost}
                    onClick={() => downloadCSV(`top-10-countries-${countryMetric}.csv`, topCountries.map(r => ({ Country: r.name, Count: r.value })))}
                  >Export CSV</button>
                  <div className={styles.hint}>Top 10</div>
                </div>
              </div>
              <div className={styles.searchRow}>
                <input
                  value={countrySearch}
                  onChange={e => setCountrySearch(e.target.value)}
                  placeholder={`Search ${countryMetric}`}
                  className={styles.input}
                />
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {topCountries.length === 0 && (
                    <tr><td colSpan={2} className={styles.hint}>No data</td></tr>
                  )}
                  {topCountries.map(row => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>Devices Breakdown</div>
                <div className={styles.actions}>
                  <button
                    className={styles.btnGhost}
                    onClick={() => downloadCSV('devices-breakdown.csv', deviceTable.map(r => ({ Type: r.name, Count: r.value })))}
                  >Export CSV</button>
                  <div className={styles.hint}>by type</div>
                </div>
              </div>
              <div className={styles.searchRow}>
                <input
                  value={deviceSearch}
                  onChange={e => setDeviceSearch(e.target.value)}
                  placeholder="Search device type"
                  className={styles.input}
                />
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {deviceTable.length === 0 && (
                    <tr><td colSpan={2} className={styles.hint}>No data</td></tr>
                  )}
                  {deviceTable.map(row => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Analytics;
