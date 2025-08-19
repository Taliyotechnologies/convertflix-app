import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use env-configured API base so it works in dev/prod without proxy
const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL || '';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const token = localStorage.getItem('adminToken');
        const userData = localStorage.getItem('adminUser');

        if (token) {
          // If API base is configured, verify token by fetching profile
          if (API_BASE) {
            try {
              const res = await fetch(`${API_BASE}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                const data = await res.json();
                const verifiedUser: User = {
                  id: data.user.id || '1',
                  email: data.user.email,
                  name: data.user.fullName || 'Admin User',
                  role: data.user.role || 'user',
                  createdAt: new Date().toISOString(),
                  lastLogin: new Date().toISOString(),
                  status: 'active',
                  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
                };
                localStorage.setItem('adminUser', JSON.stringify(verifiedUser));
                if (!cancelled) {
                  setUser(verifiedUser);
                  setIsAuthenticated(true);
                }
              } else {
                // Token invalid -> clear session
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                if (!cancelled) {
                  setUser(null);
                  setIsAuthenticated(false);
                }
              }
            } catch (_) {
              // Network error: fall back to local user if available
              if (userData) {
                try {
                  const parsedUser = JSON.parse(userData);
                  if (!cancelled) {
                    setUser(parsedUser);
                    setIsAuthenticated(true);
                  }
                } catch {}
              }
            }
          } else if (userData) {
            // No API base configured: trust local user
            try {
              const parsedUser = JSON.parse(userData);
              if (!cancelled) {
                setUser(parsedUser);
                setIsAuthenticated(true);
              }
            } catch {}
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    // Listen for unauthorized events from API layer and cross-tab storage changes
    const onUnauthorized = () => {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      if (!cancelled) {
        setUser(null);
        setIsAuthenticated(false);
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'adminToken' || e.key === 'adminUser') {
        const t = localStorage.getItem('adminToken');
        const u = localStorage.getItem('adminUser');
        if (!t || !u) {
          setUser(null);
          setIsAuthenticated(false);
        } else {
          try {
            const parsed = JSON.parse(u);
            setUser(parsed);
            setIsAuthenticated(true);
          } catch {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      }
    };
    try { window.addEventListener('auth:unauthorized', onUnauthorized as any); } catch {}
    try { window.addEventListener('storage', onStorage); } catch {}

    return () => {
      cancelled = true;
      try { window.removeEventListener('auth:unauthorized', onUnauthorized as any); } catch {}
      try { window.removeEventListener('storage', onStorage); } catch {}
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const user: User = {
          id: data.user.id || '1',
          email: data.user.email,
          name: data.user.fullName || 'Admin User',
          role: data.user.role || 'user',
          createdAt: data.user.createdAt || '2024-01-01T00:00:00Z',
          lastLogin: new Date().toISOString(),
          status: 'active',
          avatar: data.user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        };
        
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
