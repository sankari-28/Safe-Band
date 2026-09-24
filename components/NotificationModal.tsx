import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Pressable } from 'react-native';
import { Bell, X, CheckCheck, ShieldAlert, Clock, FileText, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { NotificationItem } from '../types';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderIcon = (type?: string, read?: boolean) => {
    switch (type) {
      case 'exposure':
        return <ShieldAlert size={20} color={read ? colors.secondaryText : colors.dangerText} />;
      case 'attendance':
        return <Clock size={20} color={read ? colors.secondaryText : colors.primaryOrange} />;
      case 'consultation':
        return <CheckCircle2 size={20} color={read ? colors.secondaryText : colors.successText} />;
      case 'report':
        return <FileText size={20} color={read ? colors.secondaryText : colors.primaryOrange} />;
      default:
        return <Bell size={20} color={read ? colors.secondaryText : colors.primaryOrange} />;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.bellBadge, { backgroundColor: colors.lightOrange }]}>
                <Bell size={18} color={colors.primaryOrange} />
              </View>
              <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Safety Alerts</Text>
              {unreadCount > 0 ? (
                <View style={[styles.countBadge, { backgroundColor: colors.dangerText }]}>
                  <Text style={styles.countText}>{unreadCount}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={[styles.readAllBtn, { backgroundColor: colors.secondaryBg, borderColor: colors.border }]}
                  onPress={markAllNotificationsRead}
                  activeOpacity={0.7}
                >
                  <CheckCheck size={14} color={colors.primaryOrange} />
                  <Text style={[styles.readAllText, { color: colors.primaryOrange }]}>Mark All Read</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: colors.secondaryBg }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X size={18} color={colors.primaryText} />
              </TouchableOpacity>
            </View>
          </View>

          {/* List of Notifications */}
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <CheckCircle2 size={40} color={colors.successText} />
                <Text style={[styles.emptyTitle, { color: colors.primaryText }]}>All Caught Up</Text>
                <Text style={[styles.emptySub, { color: colors.secondaryText }]}>
                  No unread alerts or notifications at this time.
                </Text>
              </View>
            }
            renderItem={({ item }: { item: NotificationItem }) => (
              <TouchableOpacity
                style={[
                  styles.notificationItem,
                  {
                    backgroundColor: item.read
                      ? colors.secondaryBg
                      : colors.isDark
                      ? '#2A201A'
                      : '#FFF9F5',
                    borderColor: item.read ? colors.border : colors.primaryOrange,
                  },
                ]}
                onPress={() => markNotificationRead(item.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.itemIconCircle,
                    {
                      backgroundColor: item.read
                        ? (colors.isDark ? '#333' : '#E5E7EB')
                        : colors.lightOrange,
                    },
                  ]}
                >
                  {renderIcon(item.type, item.read)}
                </View>

                <View style={styles.itemContent}>
                  <View style={styles.itemTopRow}>
                    <Text
                      style={[
                        styles.itemTitle,
                        {
                          color: colors.primaryText,
                          fontWeight: item.read ? '600' : '800',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={[styles.itemTime, { color: colors.secondaryText }]}>
                      {item.timestamp}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.itemMessage,
                      {
                        color: item.read ? colors.secondaryText : colors.primaryText,
                      },
                    ]}
                  >
                    {item.message}
                  </Text>
                </View>

                {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primaryOrange }]} />}
              </TouchableOpacity>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 65,
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    borderRadius: 22,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  readAllText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 14,
    gap: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  itemIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 13,
    flex: 1,
  },
  itemTime: {
    fontSize: 11,
    marginLeft: 6,
  },
  itemMessage: {
    fontSize: 12,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
  },
});
