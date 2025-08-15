import React, { useState } from 'react';
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
import styles from './Header.module.css';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

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
          <button className={styles.iconButton}>
            <Bell size={20} />
            <span className={styles.notificationBadge}>3</span>
          </button>

          {/* Profile Dropdown */}
          <div className={styles.profileDropdown}>
            <button 
              className={styles.profileButton}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <img 
                src={user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'} 
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
                <button className={styles.dropdownItem}>
                  <User size={16} />
                  Profile
                </button>
                <button className={styles.dropdownItem}>
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
