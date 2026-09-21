import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User as UserIcon, Sun, Moon, Monitor, BookOpen, Sliders, LogOut, Users, ChevronRight, CheckCircle2, AlertCircle, Phone, Mail, Building, Shield } from 'lucide-react-native';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AppHeader } from '../../components/AppHeader';
import { ConfirmModal } from '../../components/ConfirmModal';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';

export default function ProfileScreen() {
  const { colors, themeMode, setThemeMode } = useTheme();
  const { currentUser, logout, role, updateProfile } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98765 43210');
  const [email, setEmail] = useState(currentUser?.email || `${role || 'user'}@h2sguard.com`);
  const [department, setDepartment] = useState(currentUser?.department || 'Production & Chemical Safety');

  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '+91 98765 43210');
      setEmail(currentUser.email || `${currentUser.role || 'user'}@h2sguard.com`);
      setDepartment(currentUser.department || 'Production & Chemical Safety');
    }
  }, [currentUser]);

  const handleSaveChanges = () => {
    setValidationError('');
    setSuccessMessage('');

    if (!name.trim()) {
      setValidationError('Full Name cannot be empty.');
      return;
    }

    const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
    if (!phone.trim() || !phoneRegex.test(phone.trim())) {
      setValidationError('Please enter a valid Phone Number.');
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setValidationError('Please enter a valid Email address.');
      return;
    }

    if (!department.trim()) {
      setValidationError('Department cannot be empty.');
      return;
    }

    // Save changes to frontend mock state for current user
    updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      department: department.trim(),
    });

    setSuccessMessage('✓ Profile updated successfully');
    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    router.replace('/login');
  };

  const getRoleBadgeLabel = () => {
    switch (role) {
      case 'safetyOfficer':
        return { label: 'SAFETY OFFICER', idLabel: 'Officer ID', bg: colors.softWarning, text: colors.warningText };
      case 'admin':
        return { label: 'ADMINISTRATOR', idLabel: 'Admin ID', bg: colors.softDanger, text: colors.dangerText };
      case 'worker':
      default:
        return { label: 'FACTORY WORKER', idLabel: 'Worker ID', bg: colors.softSuccess, text: colors.successText };
    }
  };

  const badge = getRoleBadgeLabel();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader title="Profile & Settings" subtitle="Account Management" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Profile Summary Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.lightOrange }]}>
            <UserIcon size={36} color={colors.primaryOrange} />
          </View>

          <Text style={[styles.userName, { color: colors.primaryText }]}>{currentUser?.name || name}</Text>
          <Text style={[styles.userSub, { color: colors.secondaryText }]}>
            ID: {currentUser?.employeeId || 'EMP001'} • {currentUser?.department || department}
          </Text>

          <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.roleBadgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Editable Personal Information Form */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Personal Information</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.secondaryText }]}>
            Edit and update your profile details
          </Text>

          {validationError ? (
            <View style={[styles.alertBox, { backgroundColor: colors.softDanger, borderColor: colors.dangerText }]}>
              <AlertCircle size={16} color={colors.dangerText} />
              <Text style={[styles.alertText, { color: colors.dangerText }]}>{validationError}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={[styles.alertBox, { backgroundColor: colors.softSuccess, borderColor: colors.successText }]}>
              <CheckCircle2 size={16} color={colors.successText} />
              <Text style={[styles.alertText, { color: colors.successText }]}>{successMessage}</Text>
            </View>
          ) : null}

          <InputField
            label="Full Name"
            placeholder="Enter full name"
            value={name}
            onChangeText={setName}
            icon={<UserIcon size={18} color={colors.secondaryText} />}
          />

          <InputField
            label="Phone Number"
            placeholder="Enter phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            icon={<Phone size={18} color={colors.secondaryText} />}
          />

          <InputField
            label="Email"
            placeholder="Enter email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Mail size={18} color={colors.secondaryText} />}
          />

          <InputField
            label="Department"
            placeholder="Enter department"
            value={department}
            onChangeText={setDepartment}
            icon={<Building size={18} color={colors.secondaryText} />}
          />

          <InputField
            label={`${badge.idLabel} (Read Only)`}
            value={currentUser?.employeeId || 'EMP001'}
            editable={false}
            icon={<Shield size={18} color={colors.secondaryText} />}
          />

          <PrimaryButton
            title="Save Changes"
            onPress={handleSaveChanges}
            style={{ marginTop: 10 }}
          />
        </View>

        {/* Theme Settings Card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>App Theme</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.secondaryText }]}>
            Select your preferred visual theme mode
          </Text>

          <View style={styles.themeRow}>
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => {
              const isSelected = themeMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeBtn,
                    {
                      backgroundColor: isSelected ? colors.primaryOrange : colors.secondaryBg,
                      borderColor: isSelected ? colors.primaryOrange : colors.border,
                    },
                  ]}
                  onPress={() => setThemeMode(mode)}
                >
                  {mode === 'light' && <Sun size={16} color={isSelected ? '#FFFFFF' : colors.primaryText} />}
                  {mode === 'dark' && <Moon size={16} color={isSelected ? '#FFFFFF' : colors.primaryText} />}
                  {mode === 'system' && <Monitor size={16} color={isSelected ? '#FFFFFF' : colors.primaryText} />}
                  <Text style={[styles.themeBtnText, { color: isSelected ? '#FFFFFF' : colors.primaryText }]}>
                    {mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Links & Role Settings Card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Settings & Resources</Text>

          {/* SafeBand Guidance (For Worker & Safety Officer) */}
          <TouchableOpacity
            style={[styles.menuItem, role === 'worker' ? styles.menuItemNoBorder : { borderBottomColor: colors.border }]}
            onPress={() => router.push('/guidance')}
          >
            <View style={styles.menuLeft}>
              <BookOpen size={18} color={colors.primaryOrange} />
              <Text style={[styles.menuText, { color: colors.primaryText }]}>SafeBand Guidance</Text>
            </View>
            <ChevronRight size={16} color={colors.secondaryText} />
          </TouchableOpacity>

          {/* Safety Officer Exposure Level Settings */}
          {role === 'safetyOfficer' && (
            <TouchableOpacity
              style={styles.menuItemNoBorder}
              onPress={() => router.push('/exposure-settings')}
            >
              <View style={styles.menuLeft}>
                <Sliders size={18} color={colors.primaryOrange} />
                <Text style={[styles.menuText, { color: colors.primaryText }]}>Exposure Level Settings</Text>
              </View>
              <ChevronRight size={16} color={colors.secondaryText} />
            </TouchableOpacity>
          )}

          {/* Admin User Management */}
          {role === 'admin' && (
            <TouchableOpacity
              style={styles.menuItemNoBorder}
              onPress={() => router.push('/(tabs)/users')}
            >
              <View style={styles.menuLeft}>
                <Users size={18} color={colors.primaryOrange} />
                <Text style={[styles.menuText, { color: colors.primaryText }]}>User Management</Text>
              </View>
              <ChevronRight size={16} color={colors.secondaryText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.softDanger, borderColor: colors.dangerText }]}
          onPress={() => setShowLogoutModal(true)}
        >
          <LogOut size={18} color={colors.dangerText} />
          <Text style={[styles.logoutText, { color: colors.dangerText }]}>Logout Account</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmModal
        visible={showLogoutModal}
        title="Confirm Logout"
        message="Are you sure you want to sign out from your active session in H₂S Guard?"
        confirmText="Log Out"
        cancelText="Cancel"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  profileCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
  },
  userSub: {
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  themeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuItemNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
