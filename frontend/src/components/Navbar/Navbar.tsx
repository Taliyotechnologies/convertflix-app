import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Moon, 
  Sun, 
  ChevronDown,
  Menu
} from 'lucide-react';
import styles from './Navbar.module.css';
import { generateAvatar } from '../../utils/avatar';

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

	// Hover intent timers to prevent flicker
	const toolsOpenTimer = useRef<number | undefined>(undefined);
	const toolsCloseTimer = useRef<number | undefined>(undefined);
	const companyOpenTimer = useRef<number | undefined>(undefined);
	const companyCloseTimer = useRef<number | undefined>(undefined);
	const profileOpenTimer = useRef<number | undefined>(undefined);
	const profileCloseTimer = useRef<number | undefined>(undefined);

	const scheduleOpen = (
		setter: React.Dispatch<React.SetStateAction<boolean>>,
		openTimerRef: React.MutableRefObject<number | undefined>,
		closeTimerRef: React.MutableRefObject<number | undefined>,
		delay = 80
	) => {
		if (closeTimerRef.current) {
			window.clearTimeout(closeTimerRef.current);
			closeTimerRef.current = undefined;
		}
		if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
		openTimerRef.current = window.setTimeout(() => setter(true), delay);
	};

	const scheduleClose = (
		setter: React.Dispatch<React.SetStateAction<boolean>>,
		openTimerRef: React.MutableRefObject<number | undefined>,
		closeTimerRef: React.MutableRefObject<number | undefined>,
		delay = 150
	) => {
		if (openTimerRef.current) {
			window.clearTimeout(openTimerRef.current);
			openTimerRef.current = undefined;
		}
		if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
		closeTimerRef.current = window.setTimeout(() => setter(false), delay);
	};
  
  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setIsToolsDropdownOpen(false);
      }
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setIsCompanyDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>
            <img src="/icon-converter.svg" alt="ConvertFlix" width={24} height={24} />
          </span>
          <span className={styles.logoText}>ConvertFlix</span>
        </Link>

        {/* Desktop Navigation */}
        <div className={styles.desktopNav}>
          <Link to="/" className={`${styles.navLink} ${location.pathname === '/' ? styles.active : ''}`}>
            Home
          </Link>
          
			{/* Tools Dropdown */}
			<div
				className={styles.dropdown}
				ref={toolsDropdownRef}
				onMouseEnter={() => scheduleOpen(setIsToolsDropdownOpen, toolsOpenTimer, toolsCloseTimer)}
				onMouseLeave={() => scheduleClose(setIsToolsDropdownOpen, toolsOpenTimer, toolsCloseTimer)}
			>
            <button
              className={`${styles.dropdownToggle} ${isToolsDropdownOpen ? styles.active : ''}`}
					onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
            >
              Tools
              <span className={styles.dropdownArrow}>
                <ChevronDown size={16} />
              </span>
            </button>
            {isToolsDropdownOpen && (
					<div
						className={styles.dropdownMenu}
						onMouseEnter={() => scheduleOpen(setIsToolsDropdownOpen, toolsOpenTimer, toolsCloseTimer)}
						onMouseLeave={() => scheduleClose(setIsToolsDropdownOpen, toolsOpenTimer, toolsCloseTimer)}
					>
                <div className={styles.dropdownSection}>
                  <h4>Compress</h4>
                  <Link to="/tools/compress-image">Compress Image</Link>
                  <Link to="/tools/compress-video">Compress Video</Link>
                  <Link to="/tools/compress-pdf">Compress PDF</Link>
                  <Link to="/tools/compress-audio">Compress Audio</Link>
                </div>
                <div className={styles.dropdownSection}>
                  <h4>Convert</h4>
                  <Link to="/tools/convert-image">Convert Image</Link>
                  <Link to="/tools/convert-video">Convert Video</Link>
                  <Link to="/tools/convert-pdf">Convert PDF</Link>
                  <Link to="/tools/convert-audio">Convert Audio</Link>
                </div>
					</div>
            )}
          </div>

			{/* Company Dropdown */}
			<div
				className={styles.dropdown}
				ref={companyDropdownRef}
				onMouseEnter={() => scheduleOpen(setIsCompanyDropdownOpen, companyOpenTimer, companyCloseTimer)}
				onMouseLeave={() => scheduleClose(setIsCompanyDropdownOpen, companyOpenTimer, companyCloseTimer)}
			>
            <button
              className={`${styles.dropdownToggle} ${isCompanyDropdownOpen ? styles.active : ''}`}
					onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
            >
              Company
              <span className={styles.dropdownArrow}>
                <ChevronDown size={16} />
              </span>
            </button>
            {isCompanyDropdownOpen && (
					<div
						className={styles.dropdownMenu}
						onMouseEnter={() => scheduleOpen(setIsCompanyDropdownOpen, companyOpenTimer, companyCloseTimer)}
						onMouseLeave={() => scheduleClose(setIsCompanyDropdownOpen, companyOpenTimer, companyCloseTimer)}
					>
                <Link to="/about">About Us</Link>
                <Link to="/contact">Contact</Link>
                <Link to="/owner">Owner</Link>
					</div>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className={styles.rightSection}>
          {/* Theme Toggle */}
          <button
            className={`${styles.themeToggle} ${theme === 'dark' ? styles.themeToggleDark : ''}`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Auth Section */}
          {user ? (
            <div
              className={styles.profileDropdown}
              ref={profileDropdownRef}
              onMouseEnter={() => scheduleOpen(setIsProfileDropdownOpen, profileOpenTimer, profileCloseTimer)}
              onMouseLeave={() => scheduleClose(setIsProfileDropdownOpen, profileOpenTimer, profileCloseTimer)}
            >
              <button
                className={styles.profileButton}
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                <img src={user.avatar || generateAvatar(user.fullName)} alt={user.email} className={styles.avatar} />
                <span className={styles.userName}>{user.fullName}</span>
                <span className={styles.dropdownArrow}>
                  <ChevronDown size={16} />
                </span>
              </button>
              {isProfileDropdownOpen && (
                <div
                  className={styles.dropdownMenu}
                  onMouseEnter={() => scheduleOpen(setIsProfileDropdownOpen, profileOpenTimer, profileCloseTimer)}
                  onMouseLeave={() => scheduleClose(setIsProfileDropdownOpen, profileOpenTimer, profileCloseTimer)}
                >
                  <Link to="/profile">Profile</Link>
                  <Link to="/settings">Settings</Link>
                  <button onClick={handleLogout} className={styles.logoutButton}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Link to="/login" className={styles.loginButton}>Login</Link>
              <Link to="/signup" className={styles.signupButton}>Sign Up</Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className={styles.mobileMenuButton}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/" className={styles.mobileNavLink}>Home</Link>
          
          <div className={styles.mobileDropdown}>
            <button className={styles.mobileDropdownToggle}>
              Tools
            </button>
            <div className={styles.mobileDropdownContent}>
              <Link to="/tools/compress-image">Compress Image</Link>
              <Link to="/tools/compress-video">Compress Video</Link>
              <Link to="/tools/compress-pdf">Compress PDF</Link>
              <Link to="/tools/compress-audio">Compress Audio</Link>
              <Link to="/tools/convert-image">Convert Image</Link>
              <Link to="/tools/convert-video">Convert Video</Link>
              <Link to="/tools/convert-pdf">Convert PDF</Link>
              <Link to="/tools/convert-audio">Convert Audio</Link>
            </div>
          </div>

          <div className={styles.mobileDropdown}>
            <button className={styles.mobileDropdownToggle}>
              Company
            </button>
            <div className={styles.mobileDropdownContent}>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/owner">Owner</Link>
            </div>
          </div>

          {!user && (
            <>
              <Link to="/login" className={styles.mobileAuthButton}>Login</Link>
              <Link to="/signup" className={styles.mobileAuthButton}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
