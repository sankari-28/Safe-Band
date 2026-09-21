import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { User as UserIcon, ShieldAlert, CheckCircle2, Clock, Calendar, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/AppHeader';
import { RiskBadge } from '../components/RiskBadge';
import { PrimaryButton } from '../components/PrimaryButton';
import { Pagination } from '../components/Pagination';

export default function WorkerDetailScreen() {
  const { colors } = useTheme();
  const { currentUser } = useAuth();
  const { users, exposureRecords, markAsConsulted } = useApp();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Find worker user
  const worker = users.find((u) => u.id === id || u.employeeId === id) || {
    id: id || 'w-102',
    name: 'Marcus Vance',
    employeeId: 'EMP1023',
    role: 'worker',
    department: 'Refinery Operation B',
    status: 'active',
    currentRiskLevel: 'high',
    latestH2sPpm: 48,
  };

  // Find exposure records for this worker
  const records = exposureRecords.filter(
    (r) => r.workerId === worker.employeeId || r.workerId === worker.id
  );

  const totalPages = Math.ceil(records.length / PAGE_SIZE) || 1;
  const paginatedRecords = records.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const latestRec = records[0];
  const isHighRisk = worker.currentRiskLevel === 'high' || latestRec?.riskLevel === 'high';
  const isConsulted = latestRec?.consulted;

  const isSafetyOfficer = currentUser?.role === 'safetyOfficer';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader title="Worker Exposure Profile" subtitle={`Worker ID: ${worker.employeeId}`} showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Worker Info Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.workerHeaderRow}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.lightOrange }]}>
              <UserIcon size={28} color={colors.primaryOrange} />
            </View>

            <View style={styles.workerTextCol}>
              <Text style={[styles.workerName, { color: colors.primaryText }]}>{worker.name}</Text>
              <Text style={[styles.workerSub, { color: colors.secondaryText }]}>
                ID: {worker.employeeId} • {worker.department}
              </Text>
            </View>

            {worker.currentRiskLevel && <RiskBadge risk={worker.currentRiskLevel} />}
          </View>
        </View>

        {/* Consultation Status Banner (for High Risk Workers) */}
        {isHighRisk && (
          <View
            style={[
              styles.consultCard,
              {
                backgroundColor: isConsulted ? colors.softSuccess : colors.softDanger,
                borderColor: isConsulted ? colors.successText : colors.dangerText,
              },
            ]}
          >
            <View style={styles.consultHeader}>
              {isConsulted ? (
                <CheckCircle2 size={22} color={colors.successText} />
              ) : (
                <ShieldAlert size={22} color={colors.dangerText} />
              )}
              <View style={styles.consultTitleCol}>
                <Text
                  style={[
                    styles.consultTitle,
                    { color: isConsulted ? colors.successText : colors.dangerText },
                  ]}
                >
                  {isConsulted
                    ? '✓ Consultation Completed'
                    : isAdmin
                    ? 'Suggested to Consult Safety Officer'
                    : isSafetyOfficer
                    ? 'Consultation Required'
                    : 'Safety Officer Consultation Recommended'}
                </Text>
                <Text
                  style={[
                    styles.consultSub,
                    { color: isConsulted ? colors.successText : colors.dangerText },
                  ]}
                >
                  {isConsulted
                    ? `Safety consultation completed on ${latestRec?.consultedAt || '20 Sep 2026'}.`
                    : isAdmin
                    ? 'Worker recorded high-risk H₂S levels and is suggested to consult the Safety Officer for follow-up evaluation. (Admin View-Only)'
                    : isSafetyOfficer
                    ? 'High risk exposure detected. Follow-up safety consultation needed.'
                    : 'High risk exposure detected. Please report to the Safety Officer for a health consultation.'}
                </Text>
              </View>
            </View>

            {/* Only Safety Officer can mark consultation as complete */}
            {isSafetyOfficer && !isConsulted && latestRec && (
              <PrimaryButton
                title="Mark as Consulted"
                onPress={() => markAsConsulted(latestRec.id)}
                icon={<CheckCircle2 size={18} color="#FFFFFF" />}
                style={{ marginTop: 12 }}
              />
            )}
          </View>
        )}

        {/* Current Exposure Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Current Exposure</Text>

          <View style={styles.currentHero}>
            <Text style={[styles.heroPpm, { color: colors.primaryOrange }]}>
              {worker.latestH2sPpm || latestRec?.h2sLevelPpm || 0} <Text style={styles.heroUnit}>ppm</Text>
            </Text>
            <Text style={[styles.heroSub, { color: colors.secondaryText }]}>Latest H₂S Concentration</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={[styles.gridLabel, { color: colors.secondaryText }]}>Duration</Text>
              <Text style={[styles.gridValue, { color: colors.primaryText }]}>
                {latestRec?.exposureDurationMinutes || 15} min
              </Text>
            </View>

            <View style={styles.gridCol}>
              <Text style={[styles.gridLabel, { color: colors.secondaryText }]}>Date & Time</Text>
              <Text style={[styles.gridValue, { color: colors.primaryText }]}>
                {latestRec?.date || 'Today'} {latestRec?.timestamp || ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Exposure History Table */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText, marginBottom: 12 }]}>
            Exposure History
          </Text>

          {records.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              No historical exposure scans for this worker.
            </Text>
          ) : (
            <View style={styles.table}>
              <View style={[styles.tableHeader, { backgroundColor: colors.secondaryBg }]}>
                <Text style={[styles.th, { color: colors.secondaryText, flex: 1 }]}>Date</Text>
                <Text style={[styles.th, { color: colors.secondaryText, flex: 1, textAlign: 'center' }]}>PPM</Text>
                <Text style={[styles.th, { color: colors.secondaryText, flex: 1, textAlign: 'center' }]}>Duration</Text>
                <Text style={[styles.th, { color: colors.secondaryText, flex: 1, textAlign: 'right' }]}>Risk</Text>
              </View>

              {paginatedRecords.map((rec) => (
                <View
                  key={rec.id}
                  style={[styles.tableRow, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.td, { color: colors.primaryText, flex: 1 }]}>{rec.date}</Text>
                  <Text style={[styles.td, { color: colors.primaryOrange, fontWeight: '800', flex: 1, textAlign: 'center' }]}>
                    {rec.h2sLevelPpm} ppm
                  </Text>
                  <Text style={[styles.td, { color: colors.secondaryText, flex: 1, textAlign: 'center' }]}>
                    {rec.exposureDurationMinutes} min
                  </Text>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <RiskBadge risk={rec.riskLevel} size="small" />
                  </View>
                </View>
              ))}
            </View>
          )}

          {records.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              totalItems={records.length}
              pageSize={PAGE_SIZE}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginTop: 14,
  },
  workerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerTextCol: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: '800',
  },
  workerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  consultCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginTop: 14,
  },
  consultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  consultTitleCol: {
    flex: 1,
  },
  consultTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  consultSub: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  currentHero: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  heroPpm: {
    fontSize: 48,
    fontWeight: '900',
  },
  heroUnit: {
    fontSize: 22,
    fontWeight: '700',
  },
  heroSub: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 12,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  table: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  td: {
    fontSize: 13,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
});
