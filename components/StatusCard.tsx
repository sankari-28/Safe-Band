import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, AlertTriangle, Wifi, ShieldCheck, Battery } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface StatusCardProps {
  status: 'ready' | 'fault';
  lastCheckTime?: string;
  cartridgeStatus?: string;
  wristbandConnected?: boolean;
  batteryLevel?: number;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  status = 'ready',
  lastCheckTime = '08:30 AM Today',
  cartridgeStatus = 'Valid',
  wristbandConnected = true,
  batteryLevel = 88,
}) => {
  const { colors } = useTheme();

  const isReady = status === 'ready';

  const badgeBg = isReady ? colors.softSuccess : colors.softDanger;
  const badgeText = isReady ? colors.successText : colors.dangerText;
  const Icon = isReady ? CheckCircle2 : AlertTriangle;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.kicker, { color: colors.secondaryText }]}>SENSOR STATUS</Text>
          <Text style={[styles.mainStatus, { color: colors.primaryText }]}>
            {isReady ? 'SENSOR READY' : 'SENSOR FAULT'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
          <Icon size={16} color={badgeText} />
          <Text style={[styles.statusBadgeText, { color: badgeText }]}>
            {isReady ? 'Ready' : 'Attention'}
          </Text>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.secondaryText }]}>
        {isReady
          ? 'Your sensor is ready for use in the chemical work zone.'
          : 'Please replace or inspect the copper acetate strip cartridge.'}
      </Text>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <View style={styles.metricLabelRow}>
            <ShieldCheck size={14} color={colors.primaryOrange} />
            <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Cartridge</Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.primaryText }]}>{cartridgeStatus}</Text>
        </View>

        <View style={styles.metricItem}>
          <View style={styles.metricLabelRow}>
            <Wifi size={14} color={wristbandConnected ? colors.successText : colors.dangerText} />
            <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Wristband</Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.primaryText }]}>
            {wristbandConnected ? `Connected (${batteryLevel}%)` : 'Disconnected'}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Last Self-Check</Text>
          <Text style={[styles.metricValue, { color: colors.primaryText }]}>{lastCheckTime}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginVertical: 12,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitleContainer: {
    flex: 1,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  mainStatus: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricItem: {
    flex: 1,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});
