import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole, AuthContextType } from '../types/auth';
import { authService } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mediassist_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('mediassist_token');
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const role: UserRole | null = user ? user.role : null;
  const isAuthenticated = !!token && !!user;

  // Initial session restoration
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('mediassist_token');
      if (storedToken) {
        try {
          const currentUser = await authService.getMe();
          setUser(currentUser);
          localStorage.setItem('mediassist_user', JSON.stringify(currentUser));
        } catch (err: any) {
          console.warn('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const clearError = () => setError(null);

  const login = async (email: string, password: string): Promise<UserRole> => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, password);
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('mediassist_token', data.access_token);
      localStorage.setItem('mediassist_user', JSON.stringify(data.user));
      setLoading(false);
      return data.user.role;
    } catch (err: any) {
      setLoading(false);
      const message = err.response?.data?.message || err.message || 'Authentication failed. Please try again.';
      setError(message);
      throw new Error(message);
    }
  };

  const demoLogin = async (email: string, password: string = 'Password123!'): Promise<UserRole> => {
    return login(email, password);
  };

  const register = async (name: string, email: string, password: string, phone?: string): Promise<UserRole> => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.register(name, email, password, phone);
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('mediassist_token', data.access_token);
      localStorage.setItem('mediassist_user', JSON.stringify(data.user));
      setLoading(false);
      return data.user.role;
    } catch (err: any) {
      setLoading(false);
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Registration failed.';
      setError(message);
      throw new Error(message);
    }
  };

  const loginWithGoogle = async (devEmail?: string): Promise<UserRole> => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.loginWithGoogle({
        dev_email: devEmail || 'patient@example.com',
      });
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('mediassist_token', data.access_token);
      localStorage.setItem('mediassist_user', JSON.stringify(data.user));
      setLoading(false);
      return data.user.role;
    } catch (err: any) {
      setLoading(false);
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Google authentication failed. Please try again.';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);
    localStorage.removeItem('mediassist_token');
    localStorage.removeItem('mediassist_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated,
        loading,
        error,
        clearError,
        login,
        loginWithGoogle,
        register,
        logout,
        demoLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
