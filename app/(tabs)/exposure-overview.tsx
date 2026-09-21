import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Activity, ChevronRight, User as UserIcon } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../../components/AppHeader';
import { RiskBadge } from '../../components/RiskBadge';
import { Pagination } from '../../components/Pagination';

export default function ExposureOverviewScreen() {
  const { colors } = useTheme();
  const { users, exposureRecords } = useApp();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const workersList = users.filter((u) => u.role === 'worker');

  const totalPages = Math.ceil(workersList.length / PAGE_SIZE) || 1;
  const paginatedWorkers = workersList.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader title="Worker Exposure Overview" subtitle="Admin System Summary" />

      <View style={styles.content}>
        <View style={[styles.headerBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Activity size={22} color={colors.primaryOrange} />
          <View style={styles.headerTextCol}>
            <Text style={[styles.headerTitle, { color: colors.primaryText }]}>System Exposure Telemetry</Text>
            <Text style={[styles.headerSub, { color: colors.secondaryText }]}>
              Overall factory worker exposure levels derived from mobile AI strip analysis.
            </Text>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={paginatedWorkers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const latestRec = exposureRecords.find((r) => r.workerId === item.employeeId || r.workerId === item.id);
            const ppm = item.latestH2sPpm || latestRec?.h2sLevelPpm || 0;
            const risk = item.currentRiskLevel || latestRec?.riskLevel || 'normal';

            return (
              <TouchableOpacity
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: '/worker-detail', params: { id: item.id } })}
                activeOpacity={0.7}
              >
                <View style={styles.leftCol}>
                  <View style={[styles.avatar, { backgroundColor: colors.lightOrange }]}>
                    <UserIcon size={18} color={colors.primaryOrange} />
                  </View>
                  <View>
                    <Text style={[styles.empId, { color: colors.primaryText }]}>{item.employeeId}</Text>
                    <Text style={[styles.name, { color: colors.secondaryText }]}>{item.name}</Text>
                  </View>
                </View>

                <View style={styles.centerCol}>
                  <Text style={[styles.ppmVal, { color: colors.primaryOrange }]}>{ppm} ppm</Text>
                  <Text style={[styles.ppmSub, { color: colors.secondaryText }]}>Latest H₂S</Text>
                </View>

                <View style={styles.rightCol}>
                  <RiskBadge risk={risk} size="small" />
                  <ChevronRight size={16} color={colors.secondaryText} style={{ marginTop: 4 }} />
                </View>
              </TouchableOpacity>
            );
          }}
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
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  listContainer: {
    paddingBottom: 30,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empId: {
    fontSize: 15,
    fontWeight: '800',
  },
  name: {
    fontSize: 12,
  },
  centerCol: {
    alignItems: 'center',
    flex: 1,
  },
  ppmVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  ppmSub: {
    fontSize: 10,
  },
  rightCol: {
    alignItems: 'flex-end',
    flex: 1,
  },
});
