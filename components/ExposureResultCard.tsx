import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldAlert, Clock, CheckCircle, Cpu, Calendar } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { ExposureAnalysisResult } from '../types';

interface ExposureResultCardProps {
  result: ExposureAnalysisResult;
}

export const ExposureResultCard: React.FC<ExposureResultCardProps> = ({ result }) => {
  const { colors } = useTheme();

  const getRiskTheme = () => {
    if (result.sensorStatus?.includes('SATURAT')) {
      return { label: 'Physical Saturation', bg: '#2B1115', text: '#FF4757' };
    }
    // High Priority: Numeric PPM safety threshold
    if (typeof result.h2sLevel === 'number' && !isNaN(result.h2sLevel) && result.h2sLevel > 0) {
      if (result.h2sLevel > 9.0) {
        return { label: 'High Risk', bg: colors.softDanger, text: colors.dangerText };
      }
      if (result.h2sLevel > 5.0) {
        return { label: 'Moderate Exposure', bg: colors.softWarning, text: colors.warningText };
      }
    }
    if (result.riskCategory) {
      const cat = result.riskCategory.toLowerCase();
      if (cat.includes('danger') || cat.includes('high')) {
        return { label: result.riskCategory, bg: colors.softDanger, text: colors.dangerText };
      }
      if (cat.includes('moderate')) {
        return { label: result.riskCategory, bg: colors.softWarning, text: colors.warningText };
      }
      if (cat.includes('low')) {
        return { label: result.riskCategory, bg: colors.isDark ? '#3D2F15' : '#FEF3C7', text: '#D97706' };
      }
      if (cat.includes('normal') || cat.includes('safe')) {
        return { label: result.riskCategory, bg: colors.softSuccess, text: colors.successText };
      }
    }
    switch (result.riskLevel) {
      case 'high':
        return { label: 'High Risk', bg: colors.softDanger, text: colors.dangerText };
      case 'average':
        return { label: 'Moderate Exposure', bg: colors.softWarning, text: colors.warningText };
      case 'normal':
      default:
        return { label: 'Normal / Safe', bg: colors.softSuccess, text: colors.successText };
    }
  };

  const statusTheme = getRiskTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.topBadgeRow}>
        <View style={[styles.conditionBadge, { backgroundColor: statusTheme.bg }]}>
          <ShieldAlert size={16} color={statusTheme.text} />
          <Text style={[styles.conditionBadgeText, { color: statusTheme.text }]}>
            {statusTheme.label}
          </Text>
        </View>

        <View style={styles.dateTimeBadge}>
          <Calendar size={13} color={colors.secondaryText} />
          <Text style={[styles.dateTimeText, { color: colors.secondaryText }]}>
            {result.date} at {result.timestamp}
          </Text>
        </View>
      </View>

      {/* Main Big PPM metric */}
      <View style={styles.metricHeroContainer}>
        <Text style={[styles.ppmNumber, { color: colors.primaryOrange }]}>
          {result.h2sLevel} <Text style={styles.ppmUnit}>ppm</Text>
        </Text>
        <Text style={[styles.ppmLabel, { color: colors.secondaryText }]}>Estimated H₂S Concentration</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Grid details */}
      <View style={styles.detailsGrid}>
        <View style={styles.gridItem}>
          <View style={styles.gridHeader}>
            <Clock size={15} color={colors.primaryOrange} />
            <Text style={[styles.gridLabel, { color: colors.secondaryText }]}>Exposure Duration</Text>
          </View>
          <Text style={[styles.gridValue, { color: colors.primaryText }]}>
            {result.exposureDuration} minutes
          </Text>
        </View>

        <View style={styles.gridItem}>
          <View style={styles.gridHeader}>
            <CheckCircle size={15} color={colors.successText} />
            <Text style={[styles.gridLabel, { color: colors.secondaryText }]}>Optical Analysis</Text>
          </View>
          <Text style={[styles.gridValue, { color: colors.primaryText }]}>
            {result.isMock ? 'Simulated' : 'Calibrated OpenCV ROI'}
          </Text>
        </View>
      </View>

      <View style={[styles.detailsGrid, { marginTop: 14 }]}>
        <View style={styles.gridItem}>
          <View style={styles.gridHeader}>
            <Cpu size={15} color={colors.primaryOrange} />
            <Text style={[styles.gridLabel, { color: colors.secondaryText }]}>AI Confidence</Text>
          </View>
          <Text style={[styles.gridValue, { color: colors.primaryText }]}>{result.confidence}%</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={[styles.gridLabel, { color: colors.secondaryText, marginTop: 2 }]}>Model Pipeline</Text>
          <Text style={[styles.gridValue, { color: colors.primaryText }]}>
            {result.isMock ? 'Mock Fallback' : 'OpenCV + Random Forest'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    marginVertical: 12,
    elevation: 3,
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  conditionBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricHeroContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  ppmNumber: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1,
  },
  ppmUnit: {
    fontSize: 24,
    fontWeight: '700',
  },
  ppmLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridItem: {
    flex: 1,
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '700',
  },
});
