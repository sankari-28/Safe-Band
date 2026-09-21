import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  risk: RiskLevel;
  size?: 'small' | 'medium';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, size = 'medium' }) => {
  const { colors } = useTheme();

  const getStyle = () => {
    switch (risk) {
      case 'high':
        return { bg: colors.softDanger, text: colors.dangerText, label: 'HIGH' };
      case 'average':
        return { bg: colors.softWarning, text: colors.warningText, label: 'AVERAGE' };
      case 'normal':
      default:
        return { bg: colors.softSuccess, text: colors.successText, label: 'NORMAL' };
    }
  };

  const badgeTheme = getStyle();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: badgeTheme.bg },
        isSmall ? styles.badgeSmall : styles.badgeMedium,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: badgeTheme.text },
          isSmall ? styles.textSmall : styles.textMedium,
        ]}
      >
        {badgeTheme.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  badgeMedium: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textMedium: {
    fontSize: 12,
  },
  textSmall: {
    fontSize: 10,
  },
});
