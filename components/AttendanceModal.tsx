import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Clock, ShieldCheck, CheckCircle2, ChevronRight, AlertTriangle, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

interface AttendanceModalProps {
  visible: boolean;
  onClose: () => void;
}

const SHIFTS = [
  { id: 'A', name: 'Shift A: 06:00–14:00', label: 'Morning Shift', time: '06:00 AM - 02:00 PM' },
  { id: 'B', name: 'Shift B: 14:00–22:00', label: 'Afternoon Shift', time: '02:00 PM - 10:00 PM' },
  { id: 'C', name: 'Shift C: 22:00–06:00', label: 'Night Shift', time: '10:00 PM - 06:00 AM' },
];

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { currentUser } = useAuth();
  const { checkInAttendance } = useApp();

  const [selectedShift, setSelectedShift] = useState<string>(SHIFTS[0].name);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleConfirmCheckIn = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await checkInAttendance(selectedShift, currentUser?.department || 'Operations');
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('already checked in')) {
        onClose();
        return;
      }
      setErrorMessage(msg || 'Check-in failed. Please try again.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Top-Right Dismiss Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityLabel="Close"
          >
            <X size={20} color={colors.secondaryText} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: colors.lightOrange }]}>
              <Clock size={28} color={colors.primaryOrange} />
            </View>
            <Text style={[styles.title, { color: colors.primaryText }]}>Daily Shift Check-In</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
              Welcome, <Text style={{ fontWeight: '700', color: colors.primaryText }}>{currentUser?.name}</Text>. Please declare your assigned shift to synchronize with Plant EHS Safety Officers.
            </Text>
          </View>

          {errorMessage ? (
            <View style={[styles.errorBox, { backgroundColor: colors.softDanger }]}>
              <AlertTriangle size={16} color={colors.dangerText} />
              <Text style={[styles.errorText, { color: colors.dangerText }]}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Shift Choices */}
          <View style={styles.shiftsList}>
            {SHIFTS.map((shift) => {
              const isSelected = selectedShift === shift.name;
              return (
                <TouchableOpacity
                  key={shift.id}
                  style={[
                    styles.shiftItem,
                    {
                      backgroundColor: isSelected ? (colors.isDark ? '#3D2614' : '#FFF3EB') : colors.secondaryBg,
                      borderColor: isSelected ? colors.primaryOrange : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedShift(shift.name)}
                  activeOpacity={0.8}
                >
                  <View style={styles.shiftLeft}>
                    <View
                      style={[
                        styles.shiftBadge,
                        {
                          backgroundColor: isSelected ? colors.primaryOrange : (colors.isDark ? '#2C2D30' : '#E5E7EB'),
                        },
                      ]}
                    >
                      <Text style={[styles.shiftBadgeText, { color: isSelected ? '#FFFFFF' : colors.primaryText }]}>
                        {shift.id}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.shiftLabel, { color: colors.primaryText }]}>{shift.label}</Text>
                      <Text style={[styles.shiftTime, { color: colors.secondaryText }]}>{shift.time}</Text>
                    </View>
                  </View>

                  {isSelected ? (
                    <CheckCircle2 size={22} color={colors.primaryOrange} />
                  ) : (
                    <ChevronRight size={18} color={colors.secondaryText} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* EHS Safety Notice */}
          <View style={[styles.safetyNotice, { backgroundColor: colors.secondaryBg }]}>
            <ShieldCheck size={16} color={colors.successText} />
            <Text style={[styles.safetyText, { color: colors.secondaryText }]}>
              Badge optical telemetry is synchronized with Safety Officer on duty during your selected shift.
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: colors.primaryOrange }]}
            onPress={handleConfirmCheckIn}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.confirmBtnText}>Check In & Enter Shift</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  shiftsList: {
    gap: 10,
    marginBottom: 16,
  },
  shiftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  shiftLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shiftBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftBadgeText: {
    fontSize: 16,
    fontWeight: '900',
  },
  shiftLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  shiftTime: {
    fontSize: 12,
    marginTop: 2,
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 18,
  },
  safetyText: {
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
