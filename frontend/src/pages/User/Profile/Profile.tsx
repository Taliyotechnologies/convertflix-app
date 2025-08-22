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
  const [copied, setCopied] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

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
    </div>
  );
};

export default Profile;
