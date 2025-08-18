import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import Dashboard from './pages/Dashboard/Dashboard';
import Users from './pages/Users/Users';
import Files from './pages/Files/Files';
import Settings from './pages/Settings/Settings';
import Analytics from './pages/Analytics/Analytics';
import Login from './pages/Login/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import styles from './App.module.css';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <Login />;
  }

  const allowed = user && (user.role === 'admin' || user.role === 'sub-admin');
  if (!allowed) {
    return (
      <div className={styles.app}>
        <div className={styles.mainContent}>
          <main className={styles.content}>
            <div style={{ padding: '2rem' }}>
              <h2>Access denied</h2>
              <p>You do not have permission to access the admin panel.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <main className={styles.content}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/users" element={<Users />} />
            <Route path="/files" element={<Files />} />
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

