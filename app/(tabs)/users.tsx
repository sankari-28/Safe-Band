import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, UserPlus, Shield, User as UserIcon, Trash2, Power } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../../components/AppHeader';
import { WorkerListItem } from '../../components/WorkerListItem';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Pagination } from '../../components/Pagination';

export default function UserManagementScreen() {
  const { colors } = useTheme();
  const { users, deactivateUser, deleteUser } = useApp();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [activeSegment, setActiveSegment] = useState<'workers' | 'safetyOfficers'>('workers');
  const [deleteTargetUser, setDeleteTargetUser] = useState<{ id: string; name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const workersList = users.filter((u) => u.role === 'worker');
  const safetyOfficersList = users.filter((u) => u.role === 'safetyOfficer');

  const currentList = activeSegment === 'workers' ? workersList : safetyOfficersList;
  const totalPages = Math.ceil(currentList.length / PAGE_SIZE) || 1;
  const paginatedList = currentList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSegmentChange = (seg: 'workers' | 'safetyOfficers') => {
    setActiveSegment(seg);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetUser) {
      deleteUser(deleteTargetUser.id);
      setDeleteTargetUser(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader title="User Management" subtitle="Admin Account Control Center" />

      <View style={styles.content}>
        {/* Segmented Control */}
        <View style={[styles.segmentBar, { backgroundColor: colors.secondaryBg, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeSegment === 'workers' && { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => handleSegmentChange('workers')}
          >
            <UserIcon size={16} color={activeSegment === 'workers' ? colors.primaryOrange : colors.secondaryText} />
            <Text style={[styles.segmentLabel, { color: activeSegment === 'workers' ? colors.primaryText : colors.secondaryText }]}>
              Workers ({workersList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeSegment === 'safetyOfficers' && { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => handleSegmentChange('safetyOfficers')}
          >
            <Shield size={16} color={activeSegment === 'safetyOfficers' ? colors.primaryOrange : colors.secondaryText} />
            <Text style={[styles.segmentLabel, { color: activeSegment === 'safetyOfficers' ? colors.primaryText : colors.secondaryText }]}>
              Safety Officers ({safetyOfficersList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add User Action Button */}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primaryOrange }]}
          onPress={() =>
            router.push({
              pathname: '/add-user',
              params: { initialRole: activeSegment === 'workers' ? 'worker' : 'safetyOfficer' },
            })
          }
        >
          <UserPlus size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>
            {activeSegment === 'workers' ? 'Add Worker' : 'Add Safety Officer'}
          </Text>
        </TouchableOpacity>

        {/* User List */}
        {activeSegment === 'workers' ? (
          <FlatList
            ref={flatListRef}
            data={paginatedList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <WorkerListItem
                user={item}
                showActions
                onPress={() => router.push({ pathname: '/worker-detail', params: { id: item.id } })}
                onDeactivate={() => deactivateUser(item.id)}
                onDelete={() => setDeleteTargetUser({ id: item.id, name: item.name })}
              />
            )}
            ListFooterComponent={
              workersList.length > 0 ? (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={workersList.length}
                  pageSize={PAGE_SIZE}
                />
              ) : null
            }
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={paginatedList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.soCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.soLeft}>
                  <View style={[styles.soAvatar, { backgroundColor: colors.lightOrange }]}>
                    <Shield size={20} color={colors.primaryOrange} />
                  </View>
                  <View>
                    <Text style={[styles.soName, { color: colors.primaryText }]}>{item.name}</Text>
                    <Text style={[styles.soSub, { color: colors.secondaryText }]}>
                      ID: {item.employeeId} • {item.department}
                    </Text>
                    <View style={styles.statusPill}>
                      <Text
                        style={[
                          styles.statusText,
                          { color: item.status === 'active' ? colors.successText : colors.dangerText },
                        ]}
                      >
                        Status: {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.soActionRow, { borderTopColor: colors.border }]}>
                  {item.status === 'active' && (
                    <TouchableOpacity style={styles.actionItem} onPress={() => deactivateUser(item.id)}>
                      <Power size={14} color={colors.warningText} />
                      <Text style={[styles.actionText, { color: colors.warningText }]}>Deactivate</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => setDeleteTargetUser({ id: item.id, name: item.name })}
                  >
                    <Trash2 size={14} color={colors.dangerText} />
                    <Text style={[styles.actionText, { color: colors.dangerText }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListFooterComponent={
              safetyOfficersList.length > 0 ? (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={safetyOfficersList.length}
                  pageSize={PAGE_SIZE}
                />
              ) : null
            }
          />
        )}
      </View>

      {/* Confirmation Dialog for Deleting User */}
      <ConfirmModal
        visible={!!deleteTargetUser}
        title="Delete User Account?"
        message={`Are you sure you want to delete ${deleteTargetUser?.name || 'this user'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetUser(null)}
      />
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
  segmentBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  segmentTab: {
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
  segmentLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  listContainer: {
    paddingBottom: 30,
  },
  soCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  soLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  soAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soName: {
    fontSize: 16,
    fontWeight: '800',
  },
  soSub: {
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  soActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
