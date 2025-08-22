import React, { useState } from 'react';
import styles from './Profile.module.css';
import { useAuth } from '../../../contexts/AuthContext';
import { userAPI } from '../../../services/api';
import { generateAvatar } from '../../../utils/avatar';

const Profile: React.FC = () => {
  const { user, isLoading, logout, updateUser } = useAuth();
  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  return (
    <div className={styles.profilePage}>
      <div className={styles.header}>
        <img className={styles.avatar} src={user.avatar || generateAvatar(user.fullName)} alt={user.email} />
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
    </div>
  );
};

export default Profile;
