import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../../components/AppHeader';
import { NotificationCard } from '../../components/NotificationCard';
import { Pagination } from '../../components/Pagination';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { currentUser } = useAuth();
  const { notifications, markNotificationRead } = useApp();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const role = currentUser?.role || 'worker';

  // Filter notifications relevant to active role
  const roleNotifications = notifications.filter((n) => {
    if (role === 'worker') {
      return (
        n.role === 'worker' &&
        (n.workerId === currentUser?.employeeId || n.workerId === currentUser?.id || !n.workerId)
      );
    }
    if (role === 'safetyOfficer') {
      return n.role === 'safetyOfficer';
    }
    if (role === 'admin') {
      return n.role === 'admin';
    }
    return true;
  });

  const totalPages = Math.ceil(roleNotifications.length / PAGE_SIZE) || 1;
  const paginatedNotifications = roleNotifications.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const unreadCount = roleNotifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
      />

      <View style={styles.content}>
        <FlatList
          ref={flatListRef}
          data={paginatedNotifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={() => markNotificationRead(item.id)}
              onViewWorker={(workerId) => {
                markNotificationRead(item.id);
                router.push({ pathname: '/worker-detail', params: { id: workerId } });
              }}
            />
          )}
          ListFooterComponent={
            roleNotifications.length > 0 ? (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={roleNotifications.length}
                pageSize={PAGE_SIZE}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <CheckCircle2 size={36} color={colors.successText} />
              <Text style={[styles.emptyTitle, { color: colors.primaryText }]}>No New Notifications</Text>
              <Text style={[styles.emptySub, { color: colors.secondaryText }]}>
                You have no pending notifications at this time.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  listContainer: {
    paddingBottom: 30,
  },
  emptyBox: {
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
});
