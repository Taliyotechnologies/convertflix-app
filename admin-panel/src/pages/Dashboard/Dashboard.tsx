import React, { useEffect, useState } from 'react';
import {
  Users,
  FileText,
  HardDrive,
  Activity,
  Clock,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { getStats, getActivity, getFiles, getUsers, deleteFile } from '../../services/api';
import { subscribeSSE, isSSEEnabled } from '../../services/realtime';
import type { DashboardStats, ActivityLog, FileRecord, User } from '../../types';
import { formatFileSize, formatPercentage, formatRelativeTime } from '../../utils/format';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalFiles: 0,
    totalStorage: 0,
    filesProcessedToday: 0,
    conversionRate: 0,
    averageFileSize: 0,
    activeUsers: 0,
  });
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, a, f, u] = await Promise.all([
          getStats().catch(() => null),
          getActivity({ limit: 20 }).catch(() => []),
          getFiles(10).catch(() => []),
          getUsers({ limit: 5 }).catch(() => []),
        ]);
        if (!alive) return;
        if (s) setStats(s);
        setActivities(a || []);
        if (Array.isArray(f)) setFiles(f);
        if (Array.isArray(u)) setUsers(u);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!isSSEEnabled()) return;
    const unsub = subscribeSSE({
      onStats: (s) => setStats(s),
      onActivity: (log) => setActivities(prev => [log, ...prev].slice(0, 20)),
      onActivitiesReplace: (list) => setActivities(list.slice(0, 20)),
      onFilesReplace: (list) => setFiles(list.slice(0, 10)),
      onUsersReplace: (list) => setUsers(list.slice(0, 5)),
      onUserUpsert: (user) => setUsers(prev => {
        const next = [user, ...prev.filter(u => u.id !== user.id)];
        return next.slice(0, 5);
      }),
    });
    return () => { try { unsub(); } catch {} };
  }, []);

  useEffect(() => {
    if (isSSEEnabled()) return;
    const id = setInterval(async () => {
      try {
        const [s, a, f, u] = await Promise.all([
          getStats().catch(() => null),
          getActivity({ limit: 20 }).catch(() => null),
          getFiles(10).catch(() => null),
          getUsers({ limit: 5 }).catch(() => null),
        ]);
        if (s) setStats(s);
        if (a) setActivities(a);
        if (f) setFiles(f);
        if (u) setUsers(u);
      } catch {}
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const getActivityIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'file_upload':
        return <FileText size={16} />;
      case 'user_registration':
        return <Users size={16} />;
      case 'file_conversion':
        return <BarChart3 size={16} />;
      case 'user_login':
        return <Activity size={16} />;
      case 'error':
        return <AlertTriangle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Welcome back! Here's what's happening with your platform.</p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Users size={24} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statTitle}>Total Users</p>
            <h3 className={styles.statValue}>{stats.totalUsers.toLocaleString()}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FileText size={24} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statTitle}>Total Files</p>
            <h3 className={styles.statValue}>{stats.totalFiles.toLocaleString()}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <HardDrive size={24} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statTitle}>Storage Used</p>
            <h3 className={styles.statValue}>{formatFileSize(stats.totalStorage)}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Activity size={24} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statTitle}>Active Users (7d)</p>
            <h3 className={styles.statValue}>{stats.activeUsers.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Conversion Rate</h3>
            <BarChart3 size={20} className={styles.chartIcon} />
          </div>
          <div className={styles.chartValue}>
            <span className={styles.percentage}>{formatPercentage(stats.conversionRate)}</span>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${stats.conversionRate}%` }}
              />
            </div>
            <p className={styles.chartDescription}>{stats.filesProcessedToday} files processed today</p>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Storage Usage</h3>
            <HardDrive size={20} className={styles.chartIcon} />
          </div>
          <div className={styles.chartValue}>
            <span className={styles.fileSize}>{formatFileSize(stats.averageFileSize)}</span>
            <p className={styles.chartDescription}>Average file size per upload</p>
          </div>
        </div>
      </div>

      {/* Files and Users */}
      <div className={styles.chartsGrid}>
        <div className={styles.recentActivity}>
          <div className={styles.sectionHeader}>
            <FileText size={24} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Recent Files</h2>
          </div>
          <div className={styles.activityList}>
            {files.slice(0,10).map((file) => (
              <div key={file.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  <FileText size={16} />
                </div>
                <div className={styles.activityContent}>
                  <p className={styles.activityText}>
                    {file.name} • {file.status} • {formatFileSize(file.size)}
                  </p>
                  <p className={styles.activityTime}>
                    {formatRelativeTime(file.uploadedAt)}
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        const ok = typeof window !== 'undefined' ? window.confirm(`Delete ${file.name}?`) : true;
                        if (!ok) return;
                        await deleteFile(file.id);
                        setFiles(prev => prev.filter(f => f.id !== file.id));
                      } catch (e) {
                        console.error(e);
                        if (typeof window !== 'undefined') window.alert('Failed to delete file');
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.recentActivity}>
          <div className={styles.sectionHeader}>
            <Users size={24} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Latest Users</h2>
          </div>
          <div className={styles.activityList}>
            {users.slice(0,5).map((u) => (
              <div key={u.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  <Users size={16} />
                </div>
                <div className={styles.activityContent}>
                  <p className={styles.activityText}>
                    {(u.name || 'Unnamed')} • {u.email}
                  </p>
                  <p className={styles.activityTime}>
                    Last login {formatRelativeTime(u.lastLogin)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.recentActivity}>
        <div className={styles.sectionHeader}>
          <Activity size={24} className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
        </div>
        
        <div className={styles.activityList}>
          {activities.slice(0,5).map((activity) => (
            <div key={activity.id} className={styles.activityItem}>
              <div className={styles.activityIcon}>
                {getActivityIcon(activity.type)}
              </div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}>{activity.message}</p>
                <p className={styles.activityTime}>
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
