"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
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
      const savedToken = Cookies.get('auth_token');
      const savedUser = Cookies.get('user_data');

      if (savedToken && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(userData);
          
          // Verify token is still valid
          const isValid = await verifyToken(savedToken);
          if (!isValid) {
            logout();
          }
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          logout();
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token && data.user) {
        console.log('🔐 Login successful, setting token and user');
        setToken(data.token);
        setUser(data.user);
        
        // Save to cookies (expires in 7 days)
        console.log('🍪 Setting cookies with token:', data.token.substring(0, 20) + '...');
        Cookies.set('auth_token', data.token, { 
          expires: 7, 
          sameSite: 'lax',
          path: '/'
        });
        Cookies.set('user_data', JSON.stringify(data.user), { 
          expires: 7, 
          sameSite: 'lax',
          path: '/'
        });
        
        // Verify the cookie was set
        const savedToken = Cookies.get('auth_token');
        console.log('🔍 Verification - Cookie saved:', !!savedToken);
        
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (response.ok && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        
        // Save to cookies
        Cookies.set('auth_token', data.token, { 
          expires: 7, 
          sameSite: 'lax',
          path: '/'
        });
        Cookies.set('user_data', JSON.stringify(data.user), { 
          expires: 7, 
          sameSite: 'lax',
          path: '/'
        });
        
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Call logout API to invalidate session in database
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout API error:', error);
        // Continue with local logout even if API fails
      }
    }

    setUser(null);
    setToken(null);
    Cookies.remove('auth_token');
    Cookies.remove('user_data');
  };

  const refreshToken = async (): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.token) {
        setToken(data.token);
        Cookies.set('auth_token', data.token, { expires: 7, secure: true, sameSite: 'strict' });
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
