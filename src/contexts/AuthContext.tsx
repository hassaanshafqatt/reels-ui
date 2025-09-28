'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { setAccessToken, getAccessToken } from '@/lib/clientAuth';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
  is_admin: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Initialize auth state from cookies
  useEffect(() => {
    const initializeAuth = async () => {
      // Try to refresh access token via HttpOnly refresh cookie
      try {
        const refreshResp = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'same-origin',
        });

        if (refreshResp.ok) {
          const data = await refreshResp.json();
          if (data && data.token) {
            setToken(data.token);
            setAccessToken(data.token);

            // Get user info
            try {
              const verifyResp = await fetch('/api/auth/verify', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${data.token}`,
                },
              });
              if (verifyResp.ok) {
                const verifyData = await verifyResp.json();
                if (verifyData.user) setUser(verifyData.user);
              }
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }

      setIsLoading(false);
    };

    initializeAuth();
    // logout is stable via useCallback and we intentionally run initialization once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token && data.user) {
        // Server sets HttpOnly refresh cookie; client stores access token in memory
        setToken(data.token);
        setAccessToken(data.token);
        setUser(data.user);

        return { success: true };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch {
      return { success: false, error: 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (response.ok && data.token && data.user) {
        // Server sets refresh cookie; client keeps access token in memory
        setToken(data.token);
        setAccessToken(data.token);
        setUser(data.user);

        return { success: true };
      } else {
        return { success: false, error: data.message || 'Registration failed' };
      }
    } catch {
      return { success: false, error: 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(async () => {
    // Call logout API to clear refresh cookie and server session
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch {
      // ignore
    }

    setUser(null);
    setToken(null);
    setAccessToken(null);
  }, [token]);

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'same-origin',
      });
      const data = await response.json();
      if (response.ok && data.token) {
        setToken(data.token);
        setAccessToken(data.token);
        return true;
      }
      logout();
      return false;
    } catch {
      logout();
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
