import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Shield, Sun, Moon, ArrowLeft, LogOut } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { ConfirmModal } from './ConfirmModal';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showThemeToggle?: boolean;
  showLogout?: boolean;
  onBackPress?: () => void;
  onLogoutPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  showThemeToggle = true,
  showLogout = true,
  onBackPress,
  onLogoutPress,
}) => {
  const { colors, isDark, themeMode, setThemeMode } = useTheme();
  const { logout, currentUser } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const handleLogoutClick = () => {
    if (onLogoutPress) {
      onLogoutPress();
    } else {
      setShowLogoutModal(true);
    }
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    router.replace('/login');
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.secondaryBg }]}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={colors.primaryText} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.brandIcon, { backgroundColor: colors.lightOrange }]}>
              <Shield size={22} color={colors.primaryOrange} />
            </View>
          )}

          <View style={styles.textContainer}>
            <Text style={[styles.titleText, { color: colors.primaryText }]}>
              {title || 'H₂S Guard'}
            </Text>
            <Text style={[styles.subtitleText, { color: colors.secondaryText }]} numberOfLines={1}>
              {subtitle || 'Smart H₂S Exposure Monitoring'}
            </Text>
          </View>
        </View>

        <View style={styles.rightActions}>
          {showThemeToggle && (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.secondaryBg, borderColor: colors.border }]}
              onPress={toggleTheme}
              activeOpacity={0.7}
              accessibilityLabel="Toggle Theme"
            >
              {isDark ? (
                <Sun size={18} color={colors.primaryOrange} />
              ) : (
                <Moon size={18} color={colors.primaryText} />
              )}
            </TouchableOpacity>
          )}

          {showLogout && currentUser && (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.softDanger, borderColor: colors.border }]}
              onPress={handleLogoutClick}
              activeOpacity={0.7}
              accessibilityLabel="Quick Logout"
            >
              <LogOut size={17} color={colors.dangerText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ConfirmModal
        visible={showLogoutModal}
        title="Confirm Logout"
        message="Are you sure you want to sign out from your active session in H₂S Guard?"
        confirmText="Log Out"
        cancelText="Cancel"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
