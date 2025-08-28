import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import { generateAvatar } from '../utils/avatar';

interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  googleLogin: (googleToken: string, email: string, fullName: string, avatar?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On app start: hydrate from localStorage and then refresh from backend
    const init = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        let localUser: User | null = null;
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            const ensured = parsed?.avatar ? parsed : { ...parsed, avatar: generateAvatar(parsed?.fullName) };
            localUser = ensured;
            setUser(ensured);
            try { localStorage.setItem('user', JSON.stringify(ensured)); } catch {}
          } catch (e) {
            console.error('Error parsing user data:', e);
            localStorage.removeItem('user');
          }
        }

        if (!token) {
          setIsLoading(false);
          return;
        }

        try {
          const res = await authAPI.getProfile();
          const backendUser = res?.user;
          if (backendUser) {
            // Merge backend truth with local avatar
            const merged = {
              ...(localUser || {}),
              ...backendUser,
            } as User;
            const ensured = merged?.avatar ? merged : { ...merged, avatar: generateAvatar(merged?.fullName) };
            setUser(ensured);
            try { localStorage.setItem('user', JSON.stringify(ensured)); } catch {}
          }
        } catch (_) {
          // Token invalid -> clear auth
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      } catch (_) {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(email, password);

      const ensuredUser = response?.user?.avatar
        ? response.user
        : { ...response.user, avatar: generateAvatar(response?.user?.fullName) };

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(ensuredUser));
      setUser(ensuredUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (fullName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.signup(fullName, email, password);

      const ensuredUser = response?.user?.avatar
        ? response.user
        : { ...response.user, avatar: generateAvatar(response?.user?.fullName) };

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(ensuredUser));
      setUser(ensuredUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (googleToken: string, email: string, fullName: string, avatar?: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.googleAuth(googleToken, email, fullName, avatar);

      const ensuredUser = response?.user?.avatar
        ? response.user
        : { ...response.user, avatar: generateAvatar(response?.user?.fullName) };

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(ensuredUser));
      setUser(ensuredUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await authAPI.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      await authAPI.resetPassword(token, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => {
      const next = prev ? { ...prev, ...updates } as User : (updates as User);
      try { localStorage.setItem('user', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      googleLogin, 
      forgotPassword, 
      resetPassword, 
      logout, 
      isLoading,
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
