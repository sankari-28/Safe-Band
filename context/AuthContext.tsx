import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, setAuthToken } from '../services/api';
import { appStorage } from '../services/storage';

interface AuthContextType {
  currentUser: User | null;
  login: (id: string, pass: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  updateProfile: (updatedData: { name?: string; phone?: string; email?: string; department?: string }) => Promise<void>;
  role: UserRole | null;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: async () => ({ success: false }),
  logout: () => {},
  updateProfile: async () => {},
  role: null,
  isInitialized: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Restore authenticated session from persistent storage on initial boot
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedUserJson = await appStorage.getItem('h2s_current_user');
        const savedToken = await appStorage.getItem('h2s_auth_token');

        if (savedUserJson && savedToken) {
          const userObj: User = JSON.parse(savedUserJson);
          setCurrentUser(userObj);
          setAuthToken(savedToken);

          // Verify with backend silently in background to keep profile & token synchronized
          api.getMyProfile()
            .then((freshProfile) => {
              setCurrentUser(freshProfile);
              appStorage.setItem('h2s_current_user', JSON.stringify(freshProfile));
            })
            .catch((err) => {
              console.log('[Auth] Token validation check:', err.message);
            });
        }
      } catch (e) {
        console.warn('[Auth] Failed to restore session from storage:', e);
      } finally {
        setIsInitialized(true);
      }
    };
    initAuth();
  }, []);

  const login = async (employeeId: string, pass: string) => {
    try {
      const authData = await api.login(employeeId, pass);
      const profile = await api.getMyProfile();
      setCurrentUser(profile);
      await appStorage.setItem('h2s_current_user', JSON.stringify(profile));
      return { success: true, user: profile };
    } catch (err: any) {
      console.error('Login error:', err);
      return {
        success: false,
        error: err.message || 'Invalid User ID or password. Please try again.',
      };
    }
  };

  const logout = async () => {
    setAuthToken(null);
    setCurrentUser(null);
    await appStorage.removeItem('h2s_auth_token');
    await appStorage.removeItem('h2s_current_user');
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
      await appStorage.setItem('h2s_current_user', JSON.stringify(updatedUser));
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
        isInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
