import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, Clock, Activity } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { ExposureRecord } from '../types';
import { RiskBadge } from './RiskBadge';

interface HistoryCardProps {
  item: ExposureRecord;
  onPress?: () => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({ item, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconBg, { backgroundColor: colors.lightOrange }]}>
          <Activity size={20} color={colors.primaryOrange} />
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.timeRow}>
            <Clock size={12} color={colors.secondaryText} />
            <Text style={[styles.timeText, { color: colors.secondaryText }]}>
              {item.date} • {item.timestamp}
            </Text>
          </View>

          <Text style={[styles.ppmText, { color: colors.primaryText }]}>
            H₂S: <Text style={{ color: colors.primaryOrange, fontWeight: '800' }}>{item.h2sLevelPpm} ppm</Text>
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <RiskBadge risk={item.riskLevel} size="small" />
        <ChevronRight size={18} color={colors.secondaryText} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ppmText: {
    fontSize: 16,
    fontWeight: '700',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
