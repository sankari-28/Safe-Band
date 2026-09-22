import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, ShieldAlert, Users, Clock, AlertTriangle, ArrowRight, Activity, FileText, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RiskBadge } from '../../components/RiskBadge';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { currentUser } = useAuth();
  const { exposureRecords, users } = useApp();
  const router = useRouter();

  const role = currentUser?.role || 'worker';

  // -------------------------------------------------------------
  // WORKER DASHBOARD COMPONENT
  // -------------------------------------------------------------
  const renderWorkerDashboard = () => {
    // Filter records for this worker with robust ID matching and fallback
    const userMatched = exposureRecords.filter(
      (r) =>
        r.workerId === currentUser?.employeeId ||
        r.workerId === currentUser?.id ||
        r.workerId === 'siddharth' ||
        r.workerId === 'SID001'
    );
    const workerRecords = userMatched.length > 0 ? userMatched : exposureRecords;

    const totalRecords = workerRecords.length;
    const highRiskCount = workerRecords.filter((r) => r.riskLevel === 'high').length;
    const avgPpm =
      totalRecords > 0
        ? Math.round(workerRecords.reduce((acc, r) => acc + r.h2sLevelPpm, 0) / totalRecords)
        : 0;
    const totalDuration = workerRecords.reduce((acc, r) => acc + r.exposureDurationMinutes, 0);

    const latest10 = workerRecords.slice(0, 10);

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Greeting Section */}
        <View style={styles.greetingHeader}>
          <Text style={[styles.greetingText, { color: colors.primaryText }]}>
            Good Morning, {currentUser?.name || 'Worker'} 👋
          </Text>
          <View style={[styles.infoBadge, { backgroundColor: colors.secondaryBg, borderColor: colors.border }]}>
            <Text style={[styles.infoBadgeText, { color: colors.secondaryText }]}>
              Worker ID: <Text style={{ color: colors.primaryOrange, fontWeight: '700' }}>{currentUser?.employeeId || 'WORKER001'}</Text>
            </Text>
            <Text style={[styles.infoBadgeDot, { color: colors.secondaryText }]}>•</Text>
            <Text style={[styles.infoBadgeText, { color: colors.secondaryText }]}>
              Dept: {currentUser?.department || 'Production'}
            </Text>
          </View>
        </View>

        {/* Scan Action Banner */}
        <View style={[styles.scanBannerCard, { backgroundColor: colors.lightOrange, borderColor: colors.primaryOrange }]}>
          <View style={styles.scanBannerTextCol}>
            <Text style={[styles.scanBannerTitle, { color: colors.primaryText }]}>
              Perform H₂S Strip Scan
            </Text>
            <Text style={[styles.scanBannerSubtitle, { color: colors.secondaryText }]}>
              Capture wristband strip photo for AI ppm estimation
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.scanActionButton, { backgroundColor: colors.primaryOrange }]}
            onPress={() => router.push('/(tabs)/scan')}
            activeOpacity={0.8}
          >
            <Camera size={20} color="#FFFFFF" />
            <Text style={styles.scanActionButtonText}>Scan Now</Text>
          </TouchableOpacity>
        </View>

        {/* Exposure Summary Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardSectionTitle, { color: colors.primaryText }]}>
            Exposure Summary
          </Text>
          
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryBox, { backgroundColor: colors.secondaryBg }]}>
              <Text style={[styles.summaryNumber, { color: colors.primaryText }]}>{totalRecords}</Text>
              <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>Total Records</Text>
            </View>

            <View style={[styles.summaryBox, { backgroundColor: colors.softDanger }]}>
              <Text style={[styles.summaryNumber, { color: colors.dangerText }]}>{highRiskCount}</Text>
              <Text style={[styles.summaryLabel, { color: colors.dangerText }]}>High Risk</Text>
            </View>

            <View style={[styles.summaryBox, { backgroundColor: colors.secondaryBg }]}>
              <Text style={[styles.summaryNumber, { color: colors.primaryOrange }]}>{avgPpm} ppm</Text>
              <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>Avg Exposure</Text>
            </View>

            <View style={[styles.summaryBox, { backgroundColor: colors.secondaryBg }]}>
              <Text style={[styles.summaryNumber, { color: colors.primaryText }]}>{totalDuration} min</Text>
              <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>Total Duration</Text>
            </View>
          </View>
        </View>

        {/* Recent Exposure History (Latest 10) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>
            Recent Exposure History
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
            <Text style={[styles.seeAllText, { color: colors.primaryOrange }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {latest10.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Clock size={32} color={colors.secondaryText} />
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No exposure scans recorded yet.</Text>
          </View>
        ) : (
          latest10.map((rec) => (
            <View
              key={rec.id}
              style={[styles.recordRowCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.recordLeft}>
                <View style={styles.dateRow}>
                  <Text style={[styles.recordDate, { color: colors.primaryText }]}>{rec.date}</Text>
                  <Text style={[styles.recordTime, { color: colors.secondaryText }]}>{rec.timestamp}</Text>
                </View>

                <View style={styles.recordDetailsRow}>
                  <Text style={[styles.recordPpm, { color: colors.primaryOrange }]}>
                    H₂S: <Text style={{ fontWeight: '800' }}>{rec.h2sLevelPpm} ppm</Text>
                  </Text>
                  <Text style={[styles.recordDot, { color: colors.secondaryText }]}>•</Text>
                  <Text style={[styles.recordDuration, { color: colors.secondaryText }]}>
                    Duration: {rec.exposureDurationMinutes} min
                  </Text>
                </View>
              </View>

              <View style={styles.recordRight}>
                <RiskBadge risk={rec.riskLevel} size="small" />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  // -------------------------------------------------------------
  // SAFETY OFFICER DASHBOARD COMPONENT
  // -------------------------------------------------------------
  const renderSafetyOfficerDashboard = () => {
    const workersList = users.filter((u) => u.role === 'worker');
    const totalWorkers = workersList.length;

    const highRiskRecords = exposureRecords.filter((r) => r.riskLevel === 'high');
    const pendingConsultations = highRiskRecords.filter((r) => !r.consulted).length;

    const normalCount = workersList.filter((w) => w.currentRiskLevel === 'normal' || !w.currentRiskLevel).length;
    const avgCount = workersList.filter((w) => w.currentRiskLevel === 'average').length;
    const highCount = workersList.filter((w) => w.currentRiskLevel === 'high').length;

    // High risk workers list
    const highRiskWorkers = workersList.filter((w) => w.currentRiskLevel === 'high');

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Greeting Section */}
        <View style={styles.greetingHeader}>
          <Text style={[styles.greetingText, { color: colors.primaryText }]}>
            Good Morning, Safety Officer 👋
          </Text>
          <Text style={[styles.greetingSub, { color: colors.secondaryText }]}>
            {currentUser?.name || 'Officer'} • EHS Operations & Compliance
          </Text>
        </View>

        {/* Summary Metrics Cards */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Users size={20} color={colors.primaryOrange} />
            <Text style={[styles.metricNumber, { color: colors.primaryText }]}>{totalWorkers}</Text>
            <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Total Workers</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.softSuccess, borderColor: colors.successText }]}>
            <CheckCircle2 size={20} color={colors.successText} />
            <Text style={[styles.metricNumber, { color: colors.successText }]}>{normalCount}</Text>
            <Text style={[styles.metricLabel, { color: colors.successText }]}>Normal</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.softWarning, borderColor: colors.warningText }]}>
            <AlertTriangle size={20} color={colors.warningText} />
            <Text style={[styles.metricNumber, { color: colors.warningText }]}>{avgCount}</Text>
            <Text style={[styles.metricLabel, { color: colors.warningText }]}>Average</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.softDanger, borderColor: colors.dangerText }]}>
            <ShieldAlert size={20} color={colors.dangerText} />
            <Text style={[styles.metricNumber, { color: colors.dangerText }]}>{highCount}</Text>
            <Text style={[styles.metricLabel, { color: colors.dangerText }]}>High Risk</Text>
          </View>
        </View>

        {/* Pending Consultation Alert Banner */}
        {pendingConsultations > 0 && (
          <View style={[styles.alertCard, { backgroundColor: colors.softDanger, borderColor: colors.dangerText }]}>
            <ShieldAlert size={22} color={colors.dangerText} />
            <View style={styles.alertTextContainer}>
              <Text style={[styles.alertTitle, { color: colors.dangerText }]}>
                {pendingConsultations} High Risk Consultation{pendingConsultations > 1 ? 's' : ''} Pending
              </Text>
              <Text style={[styles.alertSub, { color: colors.dangerText }]}>
                Immediate safety follow-up required for flagged workers.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.alertBtn, { backgroundColor: colors.dangerText }]}
              onPress={() => router.push('/(tabs)/high-risk')}
            >
              <Text style={styles.alertBtnText}>Review</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Prominent High-Risk Workers Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>High-Risk Workers</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/high-risk')}>
            <Text style={[styles.seeAllText, { color: colors.primaryOrange }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {highRiskWorkers.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <CheckCircle2 size={32} color={colors.successText} />
            <Text style={[styles.emptyText, { color: colors.primaryText }]}>No high-risk workers detected.</Text>
            <Text style={[styles.emptySubText, { color: colors.secondaryText }]}>All workers currently within safe thresholds.</Text>
          </View>
        ) : (
          highRiskWorkers.map((worker) => {
            const latestRec = exposureRecords.find((r) => r.workerId === worker.employeeId || r.workerId === worker.id);
            const isConsulted = latestRec?.consulted;

            return (
              <View
                key={worker.id}
                style={[styles.highRiskCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.hrCardLeft}>
                  <Text style={[styles.hrEmpId, { color: colors.primaryText }]}>{worker.employeeId}</Text>
                  <Text style={[styles.hrWorkerName, { color: colors.secondaryText }]}>{worker.name}</Text>
                  
                  <View style={styles.hrMetricsRow}>
                    <Text style={[styles.hrPpm, { color: colors.dangerText }]}>
                      H₂S: <Text style={{ fontWeight: '900' }}>{worker.latestH2sPpm || latestRec?.h2sLevelPpm || 40} ppm</Text>
                    </Text>
                    <Text style={[styles.hrDot, { color: colors.secondaryText }]}>•</Text>
                    <Text style={[styles.hrDuration, { color: colors.secondaryText }]}>
                      Duration: {latestRec?.exposureDurationMinutes || 20} min
                    </Text>
                  </View>

                  {isConsulted ? (
                    <View style={[styles.consultedTag, { backgroundColor: colors.softSuccess }]}>
                      <CheckCircle2 size={12} color={colors.successText} />
                      <Text style={[styles.consultedTagText, { color: colors.successText }]}>Consulted</Text>
                    </View>
                  ) : (
                    <View style={[styles.consultedTag, { backgroundColor: colors.softDanger }]}>
                      <AlertTriangle size={12} color={colors.dangerText} />
                      <Text style={[styles.consultedTagText, { color: colors.dangerText }]}>Consultation Pending</Text>
                    </View>
                  )}
                </View>

                <View style={styles.hrCardRight}>
                  <RiskBadge risk="high" size="small" />
                  <TouchableOpacity
                    style={[styles.viewButton, { backgroundColor: colors.lightOrange }]}
                    onPress={() => router.push({ pathname: '/worker-detail', params: { id: worker.id } })}
                  >
                    <Text style={[styles.viewButtonText, { color: colors.primaryOrange }]}>View</Text>
                    <ArrowRight size={14} color={colors.primaryOrange} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Quick Settings Action */}
        <TouchableOpacity
          style={[styles.settingsQuickCard, { backgroundColor: colors.secondaryBg, borderColor: colors.border }]}
          onPress={() => router.push('/exposure-settings')}
        >
          <View style={styles.settingsQuickText}>
            <Text style={[styles.settingsQuickTitle, { color: colors.primaryText }]}>Exposure Level Settings</Text>
            <Text style={[styles.settingsQuickSub, { color: colors.secondaryText }]}>
              Configure Normal and High-Risk ppm thresholds
            </Text>
          </View>
          <ArrowRight size={18} color={colors.primaryOrange} />
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // -------------------------------------------------------------
  // ADMIN DASHBOARD COMPONENT
  // -------------------------------------------------------------
  const renderAdminDashboard = () => {
    const workersList = users.filter((u) => u.role === 'worker');
    const officersList = users.filter((u) => u.role === 'safetyOfficer');
    const totalRecords = exposureRecords.length;
    const highRiskWorkersCount = workersList.filter((w) => w.currentRiskLevel === 'high').length;

    const normalCount = exposureRecords.filter((r) => r.riskLevel === 'normal').length;
    const avgCount = exposureRecords.filter((r) => r.riskLevel === 'average').length;
    const highCount = exposureRecords.filter((r) => r.riskLevel === 'high').length;

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingHeader}>
          <Text style={[styles.greetingText, { color: colors.primaryText }]}>Admin Dashboard</Text>
          <Text style={[styles.greetingSub, { color: colors.secondaryText }]}>
            Overall System & User Management Center
          </Text>
        </View>

        {/* Summary Metric Cards */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Users size={20} color={colors.primaryOrange} />
            <Text style={[styles.metricNumber, { color: colors.primaryText }]}>{workersList.length}</Text>
            <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Total Workers</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Activity size={20} color={colors.primaryOrange} />
            <Text style={[styles.metricNumber, { color: colors.primaryText }]}>{officersList.length}</Text>
            <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Safety Officers</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FileText size={20} color={colors.primaryOrange} />
            <Text style={[styles.metricNumber, { color: colors.primaryText }]}>{totalRecords}</Text>
            <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Total Records</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.softDanger, borderColor: colors.dangerText }]}>
            <ShieldAlert size={20} color={colors.dangerText} />
            <Text style={[styles.metricNumber, { color: colors.dangerText }]}>{highRiskWorkersCount}</Text>
            <Text style={[styles.metricLabel, { color: colors.dangerText }]}>High Risk</Text>
          </View>
        </View>

        {/* Exposure Overview Breakdown Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardSectionTitle, { color: colors.primaryText }]}>
            System Exposure Overview
          </Text>

          <View style={styles.overviewBarsContainer}>
            <View style={styles.overviewBarRow}>
              <View style={styles.barLabelGroup}>
                <Text style={[styles.barLabel, { color: colors.primaryText }]}>Normal Exposure</Text>
                <Text style={[styles.barValue, { color: colors.successText }]}>{normalCount} records</Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.secondaryBg }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: colors.successText,
                      width: `${totalRecords > 0 ? (normalCount / totalRecords) * 100 : 0}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.overviewBarRow}>
              <View style={styles.barLabelGroup}>
                <Text style={[styles.barLabel, { color: colors.primaryText }]}>Average Exposure</Text>
                <Text style={[styles.barValue, { color: colors.warningText }]}>{avgCount} records</Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.secondaryBg }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: colors.warningText,
                      width: `${totalRecords > 0 ? (avgCount / totalRecords) * 100 : 0}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.overviewBarRow}>
              <View style={styles.barLabelGroup}>
                <Text style={[styles.barLabel, { color: colors.primaryText }]}>High Risk Exposure</Text>
                <Text style={[styles.barValue, { color: colors.dangerText }]}>{highCount} records</Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.secondaryBg }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: colors.dangerText,
                      width: `${totalRecords > 0 ? (highCount / totalRecords) * 100 : 0}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons for Admin */}
        <View style={styles.adminActionGrid}>
          <TouchableOpacity
            style={[styles.adminActionCard, { backgroundColor: colors.secondaryBg, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/scan')}
          >
            <Camera size={24} color={colors.primaryOrange} />
            <Text style={[styles.adminActionTitle, { color: colors.primaryText }]}>Scan Wristband</Text>
            <Text style={[styles.adminActionSub, { color: colors.secondaryText }]}>Test AI optical exposure analysis on wristband strip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.adminActionCard, { backgroundColor: colors.secondaryBg, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/users')}
          >
            <Users size={24} color={colors.primaryOrange} />
            <Text style={[styles.adminActionTitle, { color: colors.primaryText }]}>Manage Users</Text>
            <Text style={[styles.adminActionSub, { color: colors.secondaryText }]}>Add, deactivate, or delete workers & safety officers</Text>
          </TouchableOpacity>
        </View>

        {/* Recent System Exposure Scans */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>
            Recent Exposure Telemetry ({exposureRecords.length})
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
            <Text style={[styles.seeAllText, { color: colors.primaryOrange }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {exposureRecords.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Clock size={32} color={colors.secondaryText} />
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No exposure scans recorded yet.</Text>
          </View>
        ) : (
          exposureRecords.slice(0, 5).map((rec) => (
            <TouchableOpacity
              key={rec.id}
              style={[styles.recordRowCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/result')}
              activeOpacity={0.8}
            >
              <View style={styles.recordLeft}>
                <View style={styles.dateRow}>
                  <Text style={[styles.recordDate, { color: colors.primaryText }]}>{rec.date}</Text>
                  <Text style={[styles.recordTime, { color: colors.secondaryText }]}>{rec.timestamp}</Text>
                  <Text style={[styles.recordTime, { color: colors.primaryOrange, fontWeight: '700', marginLeft: 8 }]}>
                    Worker: {rec.workerId}
                  </Text>
                </View>

                <View style={styles.recordDetailsRow}>
                  <Text style={[styles.recordPpm, { color: colors.primaryOrange }]}>
                    H₂S: <Text style={{ fontWeight: '800' }}>{rec.h2sLevelPpm} ppm</Text>
                  </Text>
                  <Text style={[styles.recordDot, { color: colors.secondaryText }]}>•</Text>
                  <Text style={[styles.recordDuration, { color: colors.secondaryText }]}>
                    Duration: {rec.exposureDurationMinutes} min
                  </Text>
                </View>
              </View>

              <View style={styles.recordRight}>
                <RiskBadge risk={rec.riskLevel} size="small" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader
        title={role === 'worker' ? 'Worker Dashboard' : role === 'safetyOfficer' ? 'Safety Officer Dashboard' : 'Admin Dashboard'}
        subtitle={`Role: ${role.toUpperCase()}`}
      />

      {role === 'worker' && renderWorkerDashboard()}
      {role === 'safetyOfficer' && renderSafetyOfficerDashboard()}
      {role === 'admin' && renderAdminDashboard()}
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
  greetingHeader: {
    marginTop: 16,
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  greetingSub: {
    fontSize: 13,
    marginTop: 4,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  infoBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoBadgeDot: {
    fontSize: 12,
  },
  scanBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  scanBannerTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  scanBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  scanBannerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scanActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  scanActionButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryBox: {
    flex: 1,
    minWidth: '45%',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 22,
    fontWeight: '900',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubText: {
    fontSize: 12,
    marginTop: 2,
  },
  recordRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  recordLeft: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '700',
  },
  recordTime: {
    fontSize: 12,
  },
  recordDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  recordPpm: {
    fontSize: 13,
  },
  recordDot: {
    fontSize: 12,
  },
  recordDuration: {
    fontSize: 12,
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  alertSub: {
    fontSize: 12,
    marginTop: 2,
  },
  alertBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  alertBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  highRiskCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  hrCardLeft: {
    flex: 1,
  },
  hrEmpId: {
    fontSize: 16,
    fontWeight: '800',
  },
  hrWorkerName: {
    fontSize: 13,
    marginTop: 2,
  },
  hrMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  hrPpm: {
    fontSize: 13,
  },
  hrDot: {
    fontSize: 12,
  },
  hrDuration: {
    fontSize: 12,
  },
  consultedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  consultedTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  hrCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  settingsQuickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  settingsQuickText: {
    flex: 1,
  },
  settingsQuickTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  settingsQuickSub: {
    fontSize: 12,
    marginTop: 2,
  },
  overviewBarsContainer: {
    gap: 14,
  },
  overviewBarRow: {},
  barLabelGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  barValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  barTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  adminActionGrid: {
    gap: 12,
    marginTop: 4,
  },
  adminActionCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  adminActionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  adminActionSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
