import React, { useEffect, useMemo, useState } from 'react';
import styles from './Files.module.css';
import type { FileRecord } from '../../types';
import { FileText, RotateCcw } from 'lucide-react';
import { getFiles, seedMockFiles } from '../../services/api';

// Fetch from backend

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${val} ${sizes[i]}`;
}

const Files: React.FC = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await getFiles({ range, limit: 300 });
        if (!cancelled) setFiles(list || []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load files');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [range, refreshTick]);

  const data = useMemo(() => {
    return (files || []).filter((f) => {
      const q = query.trim().toLowerCase();
      const matchQ = !q || f.name.toLowerCase().includes(q) || f.uploadedBy.toLowerCase().includes(q);
      const matchS = status === 'all' || f.status === status;
      return matchQ && matchS;
    });
  }, [files, query, status]);

  const onRefresh = () => setRefreshTick((n) => n + 1);

  const onSeed = async () => {
    try {
      setLoading(true);
      setError(null);
      await seedMockFiles(12, false);
      setRefreshTick((n) => n + 1);
    } catch (e: any) {
      setError(e?.message || 'Failed to seed mock files');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <div className={styles.titleIcon}>
            <FileText size={18} />
          </div>
          <h2 className={styles.title}>Files</h2>
          <span className={styles.subtitle}>Recent processed files (Mongo-backed)</span>
        </div>
        <button className={styles.refreshBtn} onClick={onRefresh} title="Refresh">
          <RotateCcw size={16} /> Refresh
        </button>
      </header>

      <div className={styles.filters}>
        <input
          className={styles.search}
          type="text"
          placeholder="Search by file name or uploader..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className={styles.select}
          value={range}
          onChange={(e) => setRange(e.target.value as any)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>
        <select
          className={styles.select}
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="all">All statuses</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </select>
        {files.length === 0 && (
          <button className={styles.refreshBtn} onClick={onSeed} title="Seed mock files in MongoDB">
            Seed mock
          </button>
        )}
      </div>

      {loading && (
        <div className={styles.empty}>Loading files...</div>
      )}
      {error && (
        <div className={styles.empty}>Error: {error}</div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>File</th>
              <th>Type</th>
              <th>Original</th>
              <th>Converted</th>
              <th>Compression</th>
              <th>Status</th>
              <th>Uploaded</th>
              <th>Converted</th>
            </tr>
          </thead>
          <tbody>
            {data.map((f) => {
              const convertedSize = f.compressionRatio && f.compressionRatio > 0 ? f.size * f.compressionRatio : undefined;
              return (
                <tr key={f.id}>
                  <td className={styles.fileCell}>
                    <span className={styles.fileName}>{f.name}</span>
                    <span className={styles.uploader}>{f.uploadedBy}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeMute}`}>{f.type}</span>
                  </td>
                  <td>{formatBytes(f.size)}<span className={styles.format}>.{f.originalFormat}</span></td>
                  <td>
                    {convertedSize ? (
                      <>
                        {formatBytes(convertedSize)}<span className={styles.format}>.{f.convertedFormat || '-'}</span>
                      </>
                    ) : (
                      <span className={styles.muted}>-</span>
                    )}
                  </td>
                  <td>
                    {f.compressionRatio && f.compressionRatio > 0 ? (
                      <span className={`${styles.badge} ${styles.badgeGood}`}>
                        {(100 - f.compressionRatio * 100).toFixed(0)}% smaller
                      </span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeMute}`}>N/A</span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${
                      f.status === 'completed' ? styles.badgeGood : f.status === 'processing' ? styles.badgeWarn : styles.badgeBad
                    }`}>
                      {f.status}
                    </span>
                  </td>
                  <td>{new Date(f.uploadedAt).toLocaleString()}</td>
                  <td>{f.convertedAt ? new Date(f.convertedAt).toLocaleString() : <span className={styles.muted}>-</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className={styles.empty}>No files match your filters.</div>
        )}
      </div>

      <footer className={styles.note}>
        Note: Showing files from backend. Use range filter to view last week/month or all.
      </footer>
    </div>
  );
};

export default Files;
