import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, setAuthToken } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  login: (id: string, pass: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  updateProfile: (updatedData: { name?: string; phone?: string; email?: string; department?: string }) => Promise<void>;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: async () => ({ success: false }),
  logout: () => {},
  updateProfile: async () => {},
  role: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Restore session from localStorage on initial boot or auto-authenticate
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const savedUser = window.localStorage.getItem('h2s_current_user');
          if (savedUser) {
            const userObj: User = JSON.parse(savedUser);
            setCurrentUser(userObj);
            return;
          }
        }
        // If no user is saved in storage, automatically authenticate as Siddharth (Worker)
        const loginRes = await login('SID001', 'password123');
        if (!loginRes.success) {
          await login('siddharth', 'password123');
        }
      } catch (e) {
        console.warn('Failed to restore session from storage:', e);
      }
    };
    initAuth();
  }, []);

  const login = async (employeeId: string, pass: string) => {
    try {
      const authData = await api.login(employeeId, pass);
      const profile = await api.getMyProfile();
      setCurrentUser(profile);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('h2s_current_user', JSON.stringify(profile));
      }
      return { success: true, user: profile };
    } catch (err: any) {
      console.error('Login error:', err);
      return {
        success: false,
        error: err.message || 'Invalid User ID or password. Please try again.',
      };
    }
  };

  const logout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('h2s_auth_token');
      window.localStorage.removeItem('h2s_current_user');
    }
  };

  const updateProfile = async (updatedData: { name?: string; phone?: string; email?: string; department?: string }) => {
    if (!currentUser) return;
    try {
      const updatedUser = await api.updateMyProfile({
        fullName: updatedData.name,
        phoneNumber: updatedData.phone,
        email: updatedData.email,
        department: updatedData.department,
      });
      setCurrentUser(updatedUser);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('h2s_current_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Failed to update profile via API:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        updateProfile,
        role: currentUser ? currentUser.role : null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

