import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  BarChart3,
  Mail,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Sidebar.module.css';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigation = [
    { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/analytics', name: 'Analytics', icon: BarChart3 },
    { path: '/users', name: 'Users', icon: Users },
    { path: '/contacts', name: 'Contacts', icon: Mail },
    { path: '/files', name: 'Files', icon: FileText },
    { path: '/settings', name: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button className={styles.mobileMenuButton} onClick={toggleMobileMenu}>
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className={styles.mobileOverlay} onClick={toggleMobileMenu} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isMobileOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.sidebarContent}>
          {/* Logo */}
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <LayoutDashboard size={24} />
            </div>
            <span className={styles.logoText}>ConvertFlix Admin</span>
          </div>

          {/* Navigation */}
          <nav className={styles.navigation}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Icon size={20} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout Section */}
          <div className={styles.logoutSection}>
            <button className={styles.logoutButton} onClick={handleLogout}>
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
