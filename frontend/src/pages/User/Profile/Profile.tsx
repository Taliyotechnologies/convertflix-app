import React, { useEffect, useState } from 'react';
import styles from './Profile.module.css';
import { useAuth } from '../../../contexts/AuthContext';
import { userAPI, formatFileSize } from '../../../services/api';
import { generateAvatar } from '../../../utils/avatar';

const Profile: React.FC = () => {
  const { user, isLoading, logout, updateUser } = useAuth();
  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // New: Stats and Files state
  const [stats, setStats] = useState<any | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // API origin for static downloads (strip trailing /api)
  const API_BASE: string = (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const API_ORIGIN: string = API_BASE.replace(/\/api\/?$/, '');

  if (isLoading) return null;
  if (!user) return null;

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSaving(true);
    setStatus('idle');
    setErrorMsg(null);
    try {
      await userAPI.updateProfile(fullName.trim());
      const nextAvatar = user.avatar || generateAvatar(fullName.trim());
      updateUser({ fullName: fullName.trim(), avatar: nextAvatar });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateUser({ avatar: dataUrl });
      setAvatarError(null);
    };
    reader.readAsDataURL(file);
    // allow re-selecting the same file
    e.target.value = '';
  };

  const removeAvatar = () => {
    updateUser({ avatar: undefined });
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // no-op
    }
  };

  // New: Load stats and files
  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const res: any = await userAPI.getStats();
        setStats(res?.stats ?? res ?? null);
      } catch (err) {
        setStats(null);
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchFiles = async () => {
      setLoadingFiles(true);
      try {
        const res: any = await userAPI.getFiles();
        const list = res?.files ?? (Array.isArray(res) ? res : []);
        setFiles(list);
      } catch (err) {
        setFiles([]);
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchStats();
    fetchFiles();
  }, []);

  const getDownloadUrl = (item: any) => {
    const url: string | undefined = item?.downloadUrl;
    if (!url) return undefined;
    if (/^https?:\/\//i.test(url)) return url;
    return `${API_ORIGIN}${url}`;
  };

  const onDeleteFile = async (id: string) => {
    if (!id) return;
    const ok = window.confirm('Delete this file from your history?');
    if (!ok) return;
    setDeletingId(id);
    try {
      await userAPI.deleteFile(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete file');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.profilePage}>
      <div className={styles.header}>
        <div className={styles.avatarBlock}>
          <img
            className={styles.avatar}
            src={user.avatar || generateAvatar(user.fullName)}
            alt={user.email}
          />
          <div className={styles.avatarActions}>
            <label htmlFor="avatarInput" className={`${styles.button} ${styles.secondary} ${styles.small}`}>
              Change
            </label>
            <button
              type="button"
              className={`${styles.button} ${styles.small} ${styles.secondary} ${styles.danger}`}
              onClick={removeAvatar}
            >
              Remove
            </button>
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleAvatarChange}
            />
          </div>
          {avatarError && <div className={`${styles.helper} ${styles.statusError}`}>{avatarError}</div>}
        </div>
        <h1 className={styles.title}>Your Profile</h1>
      </div>

      <div className={styles.card}>
        <form onSubmit={onSave}>
          <div className={styles.row}>
            <div>
              <label className={styles.label}>Full Name</label>
              <input
                className={styles.input}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
              <div className={styles.helper}>This will be used for your display name and avatar initial.</div>
            </div>
            <div>
              <label className={styles.label}>Email</label>
              <input className={styles.input} type="email" value={user.email} disabled />
            </div>
            <div>
              <label className={styles.label}>User ID</label>
              <div className={styles.copyRow}>
                <input className={styles.input} type="text" value={user.id} disabled />
                <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={copyId}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
          <div className={styles.actions}>
            <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={logout}>Logout</button>
            <button type="submit" className={`${styles.button} ${styles.primary}`} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          {status === 'success' && (
            <div className={`${styles.helper} ${styles.statusSuccess}`}>Profile updated successfully.</div>
          )}
          {status === 'error' && (
            <div className={`${styles.helper} ${styles.statusError}`}>{errorMsg || 'Update failed'}</div>
          )}
        </form>
      </div>

      {/* Usage Stats */}
      <div className={styles.card} style={{ marginTop: 16 }}>
        <h2 className={styles.sectionTitle}>Usage Stats</h2>
        {loadingStats ? (
          <div className={styles.helper}>Loading stats...</div>
        ) : !stats ? (
          <div className={styles.helper}>No stats available.</div>
        ) : (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Files</div>
              <div className={styles.statValue}>{stats.totalFiles ?? 0}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Storage</div>
              <div className={styles.statValue}>{formatFileSize(Number(stats.totalStorage || 0))}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Compression Saved</div>
              <div className={styles.statValue}>{formatFileSize(Number(stats.compressionSavings || 0))}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Avg Compression</div>
              <div className={styles.statValue}>{Number(stats.averageCompressionRatio || 0).toFixed(1)}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Files */}
      <div className={styles.card} style={{ marginTop: 16 }}>
        <h2 className={styles.sectionTitle}>Recent Files</h2>
        {loadingFiles ? (
          <div className={styles.helper}>Loading files...</div>
        ) : files.length === 0 ? (
          <div className={styles.helper}>No recent files yet.</div>
        ) : (
          <div className={styles.filesList}>
            {files.map((item) => (
              <div key={item.id} className={styles.fileItem}>
                <div className={styles.fileMain}>
                  <div className={styles.fileName}>{item.processedName || item.originalName}</div>
                  <div className={styles.fileMeta}>
                    <span className={styles.pill}>{String(item.fileType || item.type || 'file')}</span>
                    <span>
                      {formatFileSize(Number(item.processedSize || item.size || 0))}
                      {item.originalSize
                        ? ` • Saved ${formatFileSize(
                            Math.max(0, Number(item.originalSize || 0) - Number(item.processedSize || 0))
                          )}`
                        : ''}
                    </span>
                    {item.compressionRatio !== undefined && (
                      <span>• {Number(item.compressionRatio).toFixed(1)}%</span>
                    )}
                    {item.createdAt && (
                      <span>• {new Date(item.createdAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className={styles.fileActions}>
                  {getDownloadUrl(item) && (
                    <a
                      className={`${styles.button} ${styles.secondary} ${styles.small}`}
                      href={getDownloadUrl(item)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download
                    </a>
                  )}
                  <button
                    className={`${styles.button} ${styles.secondary} ${styles.small} ${styles.danger}`}
                    onClick={() => onDeleteFile(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
