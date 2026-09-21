import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NotificationItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { AlertCircle, CheckCircle2, Bell, FileText, ArrowRight } from 'lucide-react-native';

interface NotificationCardProps {
  notification: NotificationItem;
  onPress?: () => void;
  onViewWorker?: (workerId: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onViewWorker,
}) => {
  const { colors } = useTheme();

  const getIcon = () => {
    switch (notification.type) {
      case 'exposure':
        return <AlertCircle size={20} color={colors.dangerText} />;
      case 'consultation':
        return <CheckCircle2 size={20} color={colors.successText} />;
      case 'report':
        return <FileText size={20} color={colors.primaryOrange} />;
      default:
        return <Bell size={20} color={colors.primaryOrange} />;
    }
  };

  const isUnread = !notification.read;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isUnread ? colors.primaryOrange : colors.border,
          borderLeftWidth: isUnread ? 4 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  notification.type === 'exposure'
                    ? colors.softDanger
                    : notification.type === 'consultation'
                    ? colors.softSuccess
                    : colors.lightOrange,
              },
            ]}
          >
            {getIcon()}
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={[styles.title, { color: colors.primaryText }]}>{notification.title}</Text>
            <Text style={[styles.time, { color: colors.secondaryText }]}>{notification.timestamp}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.message, { color: colors.secondaryText }]}>{notification.message}</Text>

      {notification.workerId && onViewWorker && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.viewWorkerBtn, { backgroundColor: colors.lightOrange }]}
            onPress={() => onViewWorker(notification.workerId!)}
          >
            <Text style={[styles.viewWorkerText, { color: colors.primaryOrange }]}>View Details</Text>
            <ArrowRight size={14} color={colors.primaryOrange} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  time: {
    fontSize: 11,
    marginTop: 2,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 50,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  viewWorkerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  viewWorkerText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
