import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../../components/AppHeader';
import { WorkerListItem } from '../../components/WorkerListItem';
import { Pagination } from '../../components/Pagination';

export default function WorkersScreen() {
  const { colors } = useTheme();
  const { users } = useApp();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const workersList = users.filter((u) => u.role === 'worker');

  const filteredWorkers = workersList.filter((w) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      w.name.toLowerCase().includes(query) ||
      w.employeeId.toLowerCase().includes(query) ||
      w.department.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredWorkers.length / PAGE_SIZE) || 1;
  const paginatedWorkers = filteredWorkers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader title="Workers Directory" subtitle="Safety Officer Monitoring Portal" />

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.secondaryText} />
          <TextInput
            style={[styles.searchInput, { color: colors.primaryText }]}
            placeholder="Search worker name or ID..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
        </View>

        {/* Worker Count Summary */}
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryText, { color: colors.secondaryText }]}>
            Showing <Text style={{ color: colors.primaryText, fontWeight: '700' }}>{filteredWorkers.length}</Text> of {workersList.length} Workers
          </Text>
        </View>

        {/* Workers List */}
        <FlatList
          ref={flatListRef}
          data={paginatedWorkers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WorkerListItem
              user={item}
              onPress={() => router.push({ pathname: '/worker-detail', params: { id: item.id } })}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            filteredWorkers.length > 0 ? (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredWorkers.length}
                pageSize={PAGE_SIZE}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Users size={32} color={colors.secondaryText} />
              <Text style={[styles.emptyText, { color: colors.primaryText }]}>No matching workers found.</Text>
              <Text style={[styles.emptySub, { color: colors.secondaryText }]}>Try adjusting your search criteria.</Text>
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  summaryRow: {
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 12,
  },
  listContainer: {
    paddingBottom: 30,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    marginTop: 2,
  },
});
