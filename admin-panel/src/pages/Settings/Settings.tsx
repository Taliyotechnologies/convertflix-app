import React, { useEffect, useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Key, 
  Shield, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { getAdminSettings, updateAdminSettings } from '../../services/api';
import type { AdminSettings } from '../../types';
import styles from './Settings.module.css';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    siteName: 'ConvertFlix',
    maxFileSize: 200 * 1024 * 1024,
    allowedFormats: ['jpg', 'png', 'mp4', 'mp3', 'pdf', 'docx'],
    maintenanceMode: false,
    emailNotifications: true,
    autoDeleteDays: 7,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await getAdminSettings();
        if (!alive) return;
        setSettings(s);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    (async () => {
      try {
        const updated = await updateAdminSettings(settings);
        setSettings(updated);
        setShowError('');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (e: any) {
        setShowError(e?.message || 'Failed to save settings');
      }
    })();
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setShowError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setShowError('Password must be at least 8 characters long');
      return;
    }

    // Mock action - in real app, this would call an API
    console.log('Changing password:', passwordData);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowError('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Configure your ConvertFlix platform settings</p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className={styles.successMessage}>
          <CheckCircle size={20} />
          Settings saved successfully!
        </div>
      )}

      {/* Error Message */}
      {showError && (
        <div className={styles.errorMessage}>
          <AlertTriangle size={20} />
          {showError}
        </div>
      )}

      <div className={styles.settingsGrid}>
        {/* General Settings */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <SettingsIcon size={24} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>General Settings</h3>
          </div>
          
          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>Site Name</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => handleSettingChange('siteName', e.target.value)}
              className={styles.settingInput}
            />
          </div>

          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>Maximum File Size (MB)</label>
            <input
              type="number"
              value={Math.round(settings.maxFileSize / (1024 * 1024))}
              onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value) * 1024 * 1024)}
              className={styles.settingInput}
            />
          </div>

          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>Auto Delete Files After (Days)</label>
            <input
              type="number"
              value={settings.autoDeleteDays}
              onChange={(e) => handleSettingChange('autoDeleteDays', parseInt(e.target.value))}
              className={styles.settingInput}
            />
          </div>
        </div>

        {/* Security Settings */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <Shield size={24} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Security Settings</h3>
          </div>

          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>Maintenance Mode</label>
            <div className={styles.toggleContainer}>
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                className={styles.toggleInput}
              />
              <label htmlFor="maintenanceMode" className={styles.toggleLabel}>
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <p className={styles.settingDescription}>
              When enabled, only admins can access the platform
            </p>
          </div>

          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>Email Notifications</label>
            <div className={styles.toggleContainer}>
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                className={styles.toggleInput}
              />
              <label htmlFor="emailNotifications" className={styles.toggleLabel}>
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <p className={styles.settingDescription}>
              Send email notifications for important events
            </p>
          </div>
        </div>

        {/* Admin Password Change */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <Key size={24} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Change Admin Password</h3>
          </div>

          <form onSubmit={handlePasswordChange} className={styles.passwordForm}>
            <div className={styles.settingGroup}>
              <label className={styles.settingLabel}>Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className={styles.settingInput}
                required
              />
            </div>

            <div className={styles.settingGroup}>
              <label className={styles.settingLabel}>New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className={styles.settingInput}
                required
              />
            </div>

            <div className={styles.settingGroup}>
              <label className={styles.settingLabel}>Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className={styles.settingInput}
                required
              />
            </div>

            <button type="submit" className={styles.passwordButton}>
              <Key size={16} />
              Change Password
            </button>
          </form>
        </div>

        {/* Environment Variables */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <SettingsIcon size={24} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Environment Variables</h3>
          </div>

          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>Database URL</label>
            <input
              type="text"
              placeholder="mongodb://localhost:27017/convertflix"
              className={styles.settingInput}
              disabled
            />
            <p className={styles.settingDescription}>
              Database connection string (read-only)
            </p>
          </div>

          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>API Key</label>
            <input
              type="password"
              placeholder="••••••••••••••••"
              className={styles.settingInput}
              disabled
            />
            <p className={styles.settingDescription}>
              External API key (read-only)
            </p>
          </div>

          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>Storage Path</label>
            <input
              type="text"
              placeholder="/uploads"
              className={styles.settingInput}
              disabled
            />
            <p className={styles.settingDescription}>
              File storage directory (read-only)
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className={styles.saveSection}>
        <button onClick={handleSaveSettings} className={styles.saveButton}>
          <Save size={20} />
          Save All Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
