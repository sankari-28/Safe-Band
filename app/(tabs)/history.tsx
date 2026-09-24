import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Clock, Filter, FileText, CheckCircle2, User, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../../components/AppHeader';
import { RiskBadge } from '../../components/RiskBadge';
import { Pagination } from '../../components/Pagination';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { currentUser } = useAuth();
  const { exposureRecords, refreshData } = useApp();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [riskFilter, setRiskFilter] = useState<'all' | 'normal' | 'average' | 'high'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const PAGE_SIZE = 10;

  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'safetyOfficer';

  // For Admin / Safety Officer: show all records across company
  // For Worker: show worker's own records strictly
  const myRecords = isStaff
    ? exposureRecords
    : exposureRecords.filter(
        (r) =>
          Boolean(currentUser?.employeeId && r.workerId === currentUser.employeeId) ||
          Boolean(currentUser?.id && r.workerId === currentUser.id)
      );

  const filtered = myRecords.filter((r) => {
    if (riskFilter === 'all') return true;
    return r.riskLevel === riskFilter;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginatedRecords = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFilterChange = (filter: 'all' | 'normal' | 'average' | 'high') => {
    setRiskFilter(filter);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader
        title="Exposure History"
        subtitle={isStaff ? `Overall System Log • ${myRecords.length} Scans` : 'Your Personal H₂S Exposure Log'}
      />

      <View style={styles.content}>
        {/* Filter Segment Pills */}
        <View style={styles.filterRow}>
          {(['all', 'normal', 'average', 'high'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                {
                  backgroundColor: riskFilter === filter ? colors.primaryOrange : colors.card,
                  borderColor: riskFilter === filter ? colors.primaryOrange : colors.border,
                },
              ]}
              onPress={() => handleFilterChange(filter)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: riskFilter === filter ? '#FFFFFF' : colors.primaryText },
                ]}
              >
                {filter.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* History List */}
        <FlatList
          ref={flatListRef}
          data={paginatedRecords}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primaryOrange}
              colors={[colors.primaryOrange]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/result')}
              activeOpacity={0.8}
            >
              <View style={styles.topRow}>
                <View>
                  <Text style={[styles.dateText, { color: colors.primaryText }]}>{item.date}</Text>
                  <Text style={[styles.timeText, { color: colors.secondaryText }]}>{item.timestamp}</Text>
                </View>
                <RiskBadge risk={item.riskLevel} />
              </View>

              {/* Worker Information Badge */}
              <View style={[styles.workerRow, { backgroundColor: colors.secondaryBg, borderColor: colors.border }]}>
                <User size={13} color={colors.primaryOrange} />
                <Text style={[styles.workerText, { color: colors.secondaryText }]}>
                  Worker: <Text style={{ color: colors.primaryText, fontWeight: '700' }}>{item.workerId}</Text>
                  {item.workerName && item.workerName !== item.workerId ? ` • ${item.workerName}` : ''}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.metricsGrid}>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>H₂S Level</Text>
                  <Text style={[styles.metricValuePpm, { color: colors.primaryOrange }]}>
                    {item.h2sLevelPpm} ppm
                  </Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Duration</Text>
                  <Text style={[styles.metricValue, { color: colors.primaryText }]}>
                    {item.exposureDurationMinutes} min
                  </Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Report</Text>
                  <View style={styles.reportTagRow}>
                    <FileText size={12} color={item.reportGenerated ? colors.successText : colors.secondaryText} />
                    <Text
                      style={[
                        styles.reportTagText,
                        { color: item.reportGenerated ? colors.successText : colors.secondaryText },
                      ]}
                    >
                      {item.reportGenerated ? 'Available' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            filtered.length > 0 ? (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Clock size={36} color={colors.secondaryText} />
              <Text style={[styles.emptyTitle, { color: colors.primaryText }]}>No Records Found</Text>
              <Text style={[styles.emptySub, { color: colors.secondaryText }]}>
                No exposure scans match the selected filter.
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  listContainer: {
    paddingBottom: 30,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '800',
  },
  timeText: {
    fontSize: 12,
    marginTop: 2,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  workerText: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
  },
  metricValuePpm: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  reportTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  reportTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
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
