import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { UserPlus, User, Lock, Building, Shield, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/AppHeader';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';

export default function AddUserScreen() {
  const { colors } = useTheme();
  const { addWorker, addSafetyOfficer } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams<{ initialRole?: string }>();

  const [selectedRole, setSelectedRole] = useState<'worker' | 'safetyOfficer'>(
    params.initialRole === 'safetyOfficer' ? 'safetyOfficer' : 'worker'
  );

  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    setErrorMessage('');
    if (!name.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!employeeId.trim()) {
      setErrorMessage('Employee ID / User ID is required.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Password is required.');
      return;
    }
    if (!department.trim()) {
      setErrorMessage('Department is required.');
      return;
    }

    try {
      if (selectedRole === 'worker') {
        await addWorker(name.trim(), employeeId.trim(), department.trim(), password.trim());
      } else {
        await addSafetyOfficer(name.trim(), employeeId.trim(), department.trim(), password.trim());
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create user. Please check if ID is already taken.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader
        title={selectedRole === 'worker' ? 'Add New Worker' : 'Add Safety Officer'}
        subtitle="Admin User Account Creation"
        showBack
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Role Segment Selector */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.secondaryBg, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              selectedRole === 'worker' && { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setSelectedRole('worker')}
          >
            <User size={16} color={selectedRole === 'worker' ? colors.primaryOrange : colors.secondaryText} />
            <Text
              style={[
                styles.segmentText,
                { color: selectedRole === 'worker' ? colors.primaryText : colors.secondaryText },
              ]}
            >
              Worker
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              selectedRole === 'safetyOfficer' && { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setSelectedRole('safetyOfficer')}
          >
            <Shield size={16} color={selectedRole === 'safetyOfficer' ? colors.primaryOrange : colors.secondaryText} />
            <Text
              style={[
                styles.segmentText,
                { color: selectedRole === 'safetyOfficer' ? colors.primaryText : colors.secondaryText },
              ]}
            >
              Safety Officer
            </Text>
          </TouchableOpacity>
        </View>

        {isSuccess ? (
          <View style={[styles.successCard, { backgroundColor: colors.softSuccess }]}>
            <CheckCircle2 size={32} color={colors.successText} />
            <Text style={[styles.successTitle, { color: colors.successText }]}>User Account Created!</Text>
            <Text style={[styles.successSub, { color: colors.successText }]}>
              {selectedRole === 'worker' ? 'Worker' : 'Safety Officer'} {name} was successfully registered.
            </Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.primaryText }]}>Account Details</Text>

            {errorMessage ? (
              <View style={[styles.errorBox, { backgroundColor: colors.softDanger }]}>
                <Text style={[styles.errorText, { color: colors.dangerText }]}>{errorMessage}</Text>
              </View>
            ) : null}

            <InputField
              label="Full Name"
              placeholder="e.g. John Doe"
              value={name}
              onChangeText={setName}
              icon={<User size={18} color={colors.secondaryText} />}
            />

            <InputField
              label={selectedRole === 'worker' ? 'Worker ID / Employee ID' : 'Safety Officer ID'}
              placeholder={selectedRole === 'worker' ? 'e.g. WORKER007' : 'e.g. OFFICER003'}
              value={employeeId}
              onChangeText={setEmployeeId}
              icon={<UserPlus size={18} color={colors.secondaryText} />}
            />

            <InputField
              label="Initial Password"
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon={<Lock size={18} color={colors.secondaryText} />}
            />

            <InputField
              label="Department"
              placeholder="e.g. Chemical Storage Wing"
              value={department}
              onChangeText={setDepartment}
              icon={<Building size={18} color={colors.secondaryText} />}
            />

            <PrimaryButton
              title={selectedRole === 'worker' ? 'Add Worker' : 'Add Safety Officer'}
              onPress={handleSubmit}
              icon={<UserPlus size={18} color="#FFFFFF" />}
              style={{ marginTop: 10 }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  segmentContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  successCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  successSub: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
