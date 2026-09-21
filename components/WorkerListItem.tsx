import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User } from '../types';
import { useTheme } from '../context/ThemeContext';
import { RiskBadge } from './RiskBadge';
import { ChevronRight, User as UserIcon } from 'lucide-react-native';

interface WorkerListItemProps {
  user: User;
  onPress: () => void;
  showActions?: boolean;
  onDeactivate?: () => void;
  onDelete?: () => void;
}

export const WorkerListItem: React.FC<WorkerListItemProps> = ({
  user,
  onPress,
  showActions = false,
  onDeactivate,
  onDelete,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.contentRow}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.lightOrange }]}>
          <UserIcon size={20} color={colors.primaryOrange} />
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.nameText, { color: colors.primaryText }]}>{user.name}</Text>
            {user.status === 'deactivated' && (
              <View style={[styles.inactiveBadge, { backgroundColor: colors.softDanger }]}>
                <Text style={[styles.inactiveText, { color: colors.dangerText }]}>Deactivated</Text>
              </View>
            )}
          </View>
          <Text style={[styles.subText, { color: colors.secondaryText }]}>
            ID: {user.employeeId} • {user.department}
          </Text>

          {user.latestH2sPpm !== undefined && (
            <View style={styles.ppmRow}>
              <Text style={[styles.ppmText, { color: colors.secondaryText }]}>
                Latest: <Text style={{ color: colors.primaryOrange, fontWeight: '700' }}>{user.latestH2sPpm} ppm</Text>
              </Text>
            </View>
          )}
        </View>

        <View style={styles.rightContainer}>
          {user.currentRiskLevel && <RiskBadge risk={user.currentRiskLevel} size="small" />}
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: colors.lightOrange }]}
            onPress={onPress}
          >
            <Text style={[styles.viewButtonText, { color: colors.primaryOrange }]}>View</Text>
            <ChevronRight size={14} color={colors.primaryOrange} />
          </TouchableOpacity>
        </View>
      </View>

      {showActions && (
        <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
          {onDeactivate && user.status === 'active' && (
            <TouchableOpacity style={styles.actionBtn} onPress={onDeactivate}>
              <Text style={[styles.actionBtnText, { color: colors.warningText }]}>Deactivate</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
              <Text style={[styles.actionBtnText, { color: colors.dangerText }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
  },
  ppmRow: {
    marginTop: 4,
  },
  ppmText: {
    fontSize: 12,
  },
  rightContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 2,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inactiveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
