import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Shield, User, Lock, AlertCircle, KeyRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const router = useRouter();

  const [employeeId, setEmployeeId] = useState('W001');
  const [password, setPassword] = useState('password123');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMessage('');
    if (!employeeId.trim()) {
      setErrorMessage('Employee ID / User ID cannot be empty');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Password cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(employeeId, password);
      setIsLoading(false);
      if (res.success) {
        router.replace('/(tabs)');
      } else {
        setErrorMessage(res.error || 'Authentication failed');
      }
    } catch (e: any) {
      setIsLoading(false);
      setErrorMessage(e.message || 'Authentication failed');
    }
  };

  const fillMock = (id: string, pass: string) => {
    setEmployeeId(id);
    setPassword(pass);
    setErrorMessage('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerSection}>
            <View style={[styles.brandBadge, { backgroundColor: colors.lightOrange }]}>
              <Shield size={38} color={colors.primaryOrange} />
            </View>
            <Text style={[styles.brandTitle, { color: colors.primaryText }]}>H₂S Guard</Text>
            <Text style={[styles.brandSubtitle, { color: colors.secondaryText }]}>
              AI Wristband H₂S Exposure Monitoring
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.primaryText }]}>System Authentication</Text>
            <Text style={[styles.cardSubtitle, { color: colors.secondaryText }]}>
              Sign in with your Employee ID and password to access your role-based dashboard.
            </Text>

            {errorMessage ? (
              <View style={[styles.errorBox, { backgroundColor: colors.softDanger }]}>
                <AlertCircle size={16} color={colors.dangerText} />
                <Text style={[styles.errorText, { color: colors.dangerText }]}>{errorMessage}</Text>
              </View>
            ) : null}

            <InputField
              label="Employee ID / User ID"
              placeholder="e.g. WORKER001"
              value={employeeId}
              onChangeText={setEmployeeId}
              icon={<User size={18} color={colors.secondaryText} />}
            />

            <InputField
              label="Password"
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon={<Lock size={18} color={colors.secondaryText} />}
            />

            <View style={styles.forgotRow}>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.forgotText, { color: colors.primaryOrange }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            <PrimaryButton
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              style={{ marginTop: 6 }}
            />

            {/* Quick Fill Demo Profiles */}
            <View style={[styles.mockBox, { backgroundColor: colors.secondaryBg, borderColor: colors.border }]}>
              <View style={styles.mockHeader}>
                <KeyRound size={15} color={colors.primaryOrange} />
                <Text style={[styles.mockTitle, { color: colors.primaryText }]}>Quick Fill Profiles</Text>
              </View>
              <View style={styles.mockPillRow}>
                <TouchableOpacity
                  style={[styles.mockPill, { borderColor: colors.primaryOrange, backgroundColor: colors.card }]}
                  onPress={() => fillMock('siddharth', 'password123')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.mockRole, { color: colors.primaryOrange }]}>Siddharth</Text>
                  <Text style={[styles.mockId, { color: colors.secondaryText }]}>Admin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mockPill, { borderColor: colors.border, backgroundColor: colors.card }]}
                  onPress={() => fillMock('SID001', 'password123')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.mockRole, { color: colors.primaryText }]}>Siddharth</Text>
                  <Text style={[styles.mockId, { color: colors.secondaryText }]}>Worker</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mockPill, { borderColor: colors.border, backgroundColor: colors.card }]}
                  onPress={() => fillMock('S001', 'password123')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.mockRole, { color: colors.primaryText }]}>Sarah</Text>
                  <Text style={[styles.mockId, { color: colors.secondaryText }]}>Safety Off.</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mockPill, { borderColor: colors.border, backgroundColor: colors.card }]}
                  onPress={() => fillMock('W001', 'password123')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.mockRole, { color: colors.primaryText }]}>John</Text>
                  <Text style={[styles.mockId, { color: colors.secondaryText }]}>Worker</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: 'center',
    minHeight: '100%',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 14,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mockBox: {
    marginTop: 20,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  mockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  mockTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  mockPillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mockPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  mockRole: {
    fontSize: 12,
    fontWeight: '800',
  },
  mockId: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
});
