import React, { useEffect, useRef, useState } from 'react';
import { 
  Search, 
  Bell, 
  User, 
  Settings,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeSSE } from '../../services/realtime';
import { getAdminSettings } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { generateAvatar } from '../../utils/avatar';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });
  const [unread, setUnread] = useState(0);
  const [adminEnabled, setAdminEnabled] = useState<boolean>(true);
  const adminEnabledRef = useRef<boolean>(true);

  useEffect(() => {
    adminEnabledRef.current = adminEnabled;
  }, [adminEnabled]);

  // Fetch initial settings and listen for runtime updates from Settings page
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await getAdminSettings();
        if (!alive) return;
        setAdminEnabled(!!s.adminNotifications);
      } catch {}
    })();

    const onSettingsUpdated = (e: Event) => {
      try {
        const anyEvt = e as CustomEvent<any>;
        const s = anyEvt?.detail;
        if (s && typeof s.adminNotifications === 'boolean') {
          setAdminEnabled(!!s.adminNotifications);
          if (!s.adminNotifications) setUnread(0);
        }
      } catch {}
    };
    try { window.addEventListener('settings:updated', onSettingsUpdated); } catch {}
    return () => {
      alive = false;
      try { window.removeEventListener('settings:updated', onSettingsUpdated); } catch {}
    };
  }, []);

  // Subscribe to realtime SSE for activity events
  useEffect(() => {
    const unsubscribe = subscribeSSE({
      onActivity: () => {
        setUnread((prev) => (adminEnabledRef.current ? prev + 1 : 0));
      }
    });
    return () => { try { unsubscribe(); } catch {} };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch {}
    setTheme(next);
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  const handleNotificationsClick = () => {
    setUnread(0);
    try { navigate('/analytics'); } catch {}
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Search Bar */}
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search..."
            className={styles.searchInput}
          />
        </div>

        {/* Right Section */}
        <div className={styles.rightSection}>
          {/* Theme Toggle */}
          <button className={styles.iconButton} onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {/* Notifications */}
          <button 
            className={styles.iconButton}
            onClick={handleNotificationsClick}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={20} />
            {adminEnabled && unread > 0 && (
              <span className={styles.notificationBadge}>{unread}</span>
            )}
          </button>

          {/* Profile Dropdown */}
          <div className={styles.profileDropdown}>
            <button 
              className={styles.profileButton}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <img 
                src={user?.avatar || generateAvatar(user?.name)} 
                alt="Profile" 
                className={styles.avatar}
              />
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.name || 'Admin'}</span>
                <span className={styles.userRole}>{user?.role || 'admin'}</span>
              </div>
            </button>

            {showDropdown && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropdownTitle}>Signed in as</span>
                  <span className={styles.dropdownEmail}>{user?.email || 'admin@example.com'}</span>
                </div>
                <div className={styles.dropdownDivider} />
                <button
                  className={styles.dropdownItem}
                  onClick={() => { try { navigate('/users'); } catch {}; setShowDropdown(false); }}
                >
                  <User size={16} />
                  Profile
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => { try { navigate('/settings'); } catch {}; setShowDropdown(false); }}
                >
                  <Settings size={16} />
                  Settings
                </button>
                <div className={styles.dropdownDivider} />
                <button className={styles.dropdownItem} onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
