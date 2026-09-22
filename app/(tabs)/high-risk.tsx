import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../../components/AppHeader';
import { RiskBadge } from '../../components/RiskBadge';
import { Pagination } from '../../components/Pagination';

export default function HighRiskScreen() {
  const { colors } = useTheme();
  const { users, exposureRecords } = useApp();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const highRiskWorkers = users.filter((u) => u.role === 'worker' && u.currentRiskLevel === 'high');

  const totalPages = Math.ceil(highRiskWorkers.length / PAGE_SIZE) || 1;
  const paginatedHighRiskWorkers = highRiskWorkers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader title="High-Risk Workers" subtitle="Priority Safety Follow-up Portal" />

      <View style={styles.content}>
        <FlatList
          ref={flatListRef}
          data={paginatedHighRiskWorkers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={[styles.infoCard, { backgroundColor: colors.softDanger, borderColor: colors.dangerText }]}>
              <ShieldAlert size={22} color={colors.dangerText} />
              <View style={styles.infoTextCol}>
                <Text style={[styles.infoTitle, { color: colors.dangerText }]}>High Risk Exposure Flag</Text>
                <Text style={[styles.infoSub, { color: colors.dangerText }]}>
                  Workers listed here have recorded exposure levels exceeding the configured high-risk threshold.
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const latestRec = exposureRecords.find((r) => r.workerId === item.employeeId || r.workerId === item.id);
            const isConsulted = latestRec?.consulted;

            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.topRow}>
                  <View>
                    <Text style={[styles.empId, { color: colors.primaryText }]}>{item.employeeId}</Text>
                    <Text style={[styles.name, { color: colors.secondaryText }]}>{item.name}</Text>
                    <Text style={[styles.dept, { color: colors.secondaryText }]}>{item.department}</Text>
                  </View>
                  <RiskBadge risk="high" />
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Latest Level</Text>
                    <Text style={[styles.metricPpm, { color: colors.dangerText }]}>
                      {item.latestH2sPpm ?? latestRec?.h2sLevelPpm ?? 0} ppm
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Duration</Text>
                    <Text style={[styles.metricVal, { color: colors.primaryText }]}>
                      {latestRec?.exposureDurationMinutes ?? 0} min
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Status</Text>
                    <Text
                      style={[
                        styles.metricVal,
                        { color: isConsulted ? colors.successText : colors.dangerText, fontWeight: '700' },
                      ]}
                    >
                      {isConsulted ? '✓ Consulted' : 'Pending'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.viewBtn, { backgroundColor: colors.lightOrange }]}
                  onPress={() => router.push({ pathname: '/worker-detail', params: { id: item.id } })}
                >
                  <Text style={[styles.viewBtnText, { color: colors.primaryOrange }]}>View Worker Profile & Consultation</Text>
                  <ArrowRight size={16} color={colors.primaryOrange} />
                </TouchableOpacity>
              </View>
            );
          }}
          ListFooterComponent={
            highRiskWorkers.length > 0 ? (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={highRiskWorkers.length}
                pageSize={PAGE_SIZE}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <CheckCircle2 size={36} color={colors.successText} />
              <Text style={[styles.emptyTitle, { color: colors.primaryText }]}>No High Risk Workers</Text>
              <Text style={[styles.emptySub, { color: colors.secondaryText }]}>
                All factory workers are currently operating within safe exposure limits.
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
  },
  listContainer: {
    paddingTop: 12,
    paddingBottom: 30,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoTextCol: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  infoSub: {
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  empId: {
    fontSize: 18,
    fontWeight: '800',
  },
  name: {
    fontSize: 14,
    marginTop: 2,
  },
  dept: {
    fontSize: 12,
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  metricItem: {},
  metricLabel: {
    fontSize: 11,
  },
  metricPpm: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewBtnText: {
    fontSize: 13,
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
