import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import Dashboard from './pages/Dashboard/Dashboard';
import Settings from './pages/Settings/Settings';
import Login from './pages/Login/Login';
import ForgotPassword from './pages/Auth/ForgotPassword.tsx';
import ResetPassword from './pages/Auth/ResetPassword.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import styles from './App.module.css';

const AppContent: React.FC = () => {
  const { isAuthenticated, user, loading, logout } = useAuth();

  // During initial auth check
  if (loading) {
    return (
      <div className={`${styles.app} ${styles.centered}`}>
        <div style={{ padding: '2rem' }}>Loading...</div>
      </div>
    );  
  }

  // If not authenticated, show auth routes (login/forgot/reset)
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const allowed = user && (user.role === 'admin' || user.role === 'sub-admin');
  if (!allowed) {
    return (
      <div className={styles.app}>
        <div className={styles.mainContent}>
          <main className={`${styles.content} ${styles.centered}`}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h2>Access denied</h2>
              <p>You do not have permission to access the admin panel.</p>
              <div style={{ marginTop: '1rem' }}>
                <button onClick={logout} style={{
                  background: 'linear-gradient(90deg, var(--button-start), var(--button-end))',
                  color: '#fff',
                  padding: '0.6rem 1rem',
                  borderRadius: '0.5rem'
                }}>Switch account</button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.app} ${styles.withSidebar}`}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <main className={styles.content}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;


