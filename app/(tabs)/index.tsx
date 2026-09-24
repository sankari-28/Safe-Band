import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, ShieldAlert, Users, Clock, AlertTriangle, ArrowRight, Activity, FileText, CheckCircle2, PhoneCall, LogOut, Flame } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RiskBadge } from '../../components/RiskBadge';
import { AttendanceModal } from '../../components/AttendanceModal';
import { appStorage } from '../../services/storage';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { currentUser } = useAuth();
  const { exposureRecords, users, attendance, allTodayAttendance, isAttendanceLoading, hasCheckedInToday } = useApp();
  const router = useRouter();

  const role = currentUser?.role || 'worker';

  const [evacuationConfirmed, setEvacuationConfirmed] = useState(false);
  const [consultationRequested, setConsultationRequested] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [hasPromptedToday, setHasPromptedToday] = useState(false);

  const todayIsoStr = new Date().toISOString().split('T')[0];
  const workerKey = currentUser?.employeeId || currentUser?.id || 'worker';
  const promptStorageKey = `attendance_prompted_${workerKey}_${todayIsoStr}`;

  // Automatically prompt worker to select their shift ONLY ONCE A DAY if not checked in
  React.useEffect(() => {
    // If worker is already checked in, NEVER show the modal
    if (attendance || hasCheckedInToday) {
      setShowAttendanceModal(false);
      return;
    }

    // Do not pop up while attendance is loading from backend
    if (isAttendanceLoading) {
      return;
    }

    // Check if worker was already prompted once today in local storage
    const alreadyPrompted = appStorage.getItemSync(promptStorageKey) === 'true';

    // Only prompt for workers who haven't checked in yet, and only ONCE per day
    if (role === 'worker' && attendance === null && !hasCheckedInToday && !hasPromptedToday && !alreadyPrompted) {
      setHasPromptedToday(true);
      appStorage.setItem(promptStorageKey, 'true');
      setShowAttendanceModal(true);
    }
  }, [role, attendance, hasCheckedInToday, isAttendanceLoading, hasPromptedToday, promptStorageKey]);

  const handleConfirmEvacuation = () => {
    setEvacuationConfirmed(true);
    Alert.alert(
      'Evacuation Acknowledged',
      'You have confirmed that you are leaving the hazardous factory area. Please proceed immediately to Assembly Point B and remain in clean air.',
      [{ text: 'Understood' }]
    );
  };

  const handleConsultSafetyOfficer = () => {
    setConsultationRequested(true);
    Alert.alert(
      'Safety Officer Notified',
      'The EHS Safety Officer has been alerted of your prolonged exposure. Please report to the Safety Office or call ext #104.',
      [{ text: 'OK' }]
    );
  };

  // -------------------------------------------------------------
  // WORKER DASHBOARD COMPONENT
  // -------------------------------------------------------------
  const renderWorkerDashboard = () => {
    // Strict worker data isolation: only show records belonging to this worker
    const workerRecords = exposureRecords.filter(
      (r) =>
        Boolean(currentUser?.employeeId && r.workerId === currentUser.employeeId) ||
        Boolean(currentUser?.id && r.workerId === currentUser.id)
    );

    const totalRecords = workerRecords.length;
    const highRiskCount = workerRecords.filter((r) => r.riskLevel === 'high').length;
    const avgPpm =
      totalRecords > 0
        ? Math.round(workerRecords.reduce((acc, r) => acc + r.h2sLevelPpm, 0) / totalRecords)
        : 0;
    const totalDuration = workerRecords.reduce((acc, r) => acc + r.exposureDurationMinutes, 0);

    // Today's Daily Record calculations
    const todayDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const todayRecords = workerRecords.filter((r) => r.date === todayDateStr);
    const todayCount = todayRecords.length;
    const todayTotalDuration = todayRecords.reduce((acc, r) => acc + r.exposureDurationMinutes, 0);
    const todayPeakPpm = todayRecords.length > 0 ? Math.max(...todayRecords.map((r) => r.h2sLevelPpm)) : 0;
    const todayHighRisk = todayRecords.some((r) => r.riskLevel === 'high' || r.h2sLevelPpm > 9.0);
    const todayModerate = todayRecords.some((r) => r.riskLevel === 'average' || r.h2sLevelPpm > 5.0);

    // Prolonged exposure trigger: >= 30 min today, peak > 9 ppm, or cumulative total >= 45 min
    const isOverExposed = todayTotalDuration >= 30 || totalDuration >= 45 || todayHighRisk || todayPeakPpm > 9.0;

    const latestExposure = workerRecords[0];
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

        {/* ACTIVE SHIFT ATTENDANCE CARD */}
        <View style={[styles.shiftCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.shiftCardLeft}>
            <View style={[styles.shiftCardBadge, { backgroundColor: attendance ? colors.softSuccess : colors.softDanger }]}>
              <Clock size={20} color={attendance ? colors.successText : colors.dangerText} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.shiftCardTitle, { color: colors.primaryText }]}>
                  {attendance ? attendance.shiftName : 'No Active Shift Declared'}
                </Text>
                {attendance && (
                  <View style={[styles.activePill, { backgroundColor: colors.softSuccess }]}>
                    <Text style={[styles.activePillText, { color: colors.successText }]}>ON DUTY</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.shiftCardSub, { color: colors.secondaryText }]}>
                {attendance
                  ? `Checked in at ${attendance.checkInTime} • Synchronized with Safety Officers`
                  : 'Daily shift check-in required before entering hazardous processing zones'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.shiftActionBtn,
              {
                backgroundColor: attendance ? colors.softSuccess : colors.primaryOrange,
                borderColor: attendance ? colors.successText : colors.primaryOrange,
              },
            ]}
            onPress={() => {
              if (!attendance) {
                setShowAttendanceModal(true);
              }
            }}
            disabled={Boolean(attendance)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.shiftActionBtnText,
                { color: attendance ? colors.successText : '#FFFFFF', fontWeight: '700' },
              ]}
            >
              {attendance ? '✓ Checked In' : 'Check In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* PROLONGED EXPOSURE & MANDATORY EVACUATION BANNER */}
        {isOverExposed && (
          <View style={[styles.evacuationAlertCard, { backgroundColor: colors.isDark ? '#381216' : '#FEF2F2', borderColor: '#EF4444' }]}>
            <View style={styles.evacuationHeaderRow}>
              <View style={styles.evacuationIconPulse}>
                <AlertTriangle size={24} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.evacuationTitle}>🚨 CRITICAL EXPOSURE ADVISORY</Text>
                <Text style={[styles.evacuationSubtitle, { color: colors.isDark ? '#FCA5A5' : '#991B1B' }]}>
                  PROLONGED GAS EXPOSURE DETECTED
                </Text>
              </View>
            </View>

            <Text style={[styles.evacuationMessage, { color: colors.isDark ? '#FEE2E2' : '#7F1D1D' }]}>
              You have accumulated <Text style={{ fontWeight: '800' }}>{todayTotalDuration || totalDuration} minutes</Text> of H₂S gas exposure today with a peak reading of <Text style={{ fontWeight: '800' }}>{todayPeakPpm || avgPpm} ppm</Text>. Safe occupational thresholds have been exceeded.
            </Text>

            <View style={[styles.evacuationDirectiveBox, { backgroundColor: colors.isDark ? '#451A1E' : '#FEE2E2' }]}>
              <Text style={[styles.evacuationDirectiveText, { color: colors.isDark ? '#FCA5A5' : '#B91C1C' }]}>
                ⚠️ <Text style={{ fontWeight: '800' }}>REQUIRED ACTION:</Text> Please <Text style={{ textDecorationLine: 'underline', fontWeight: '900' }}>LEAVE THE FACTORY FLOOR IMMEDIATELY</Text>, proceed to the designated fresh-air assembly zone, and consult the Safety Officer.
              </Text>
            </View>

            {/* Direct Dashboard Action Buttons */}
            <View style={styles.evacuationButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.evacuationActionBtn,
                  { backgroundColor: evacuationConfirmed ? '#10B981' : '#EF4444' }
                ]}
                onPress={handleConfirmEvacuation}
                activeOpacity={0.8}
              >
                {evacuationConfirmed ? (
                  <>
                    <CheckCircle2 size={16} color="#FFFFFF" />
                    <Text style={styles.evacuationBtnText}>Evacuation Confirmed</Text>
                  </>
                ) : (
                  <>
                    <LogOut size={16} color="#FFFFFF" />
                    <Text style={styles.evacuationBtnText}>I Have Left Factory</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.evacuationActionBtn,
                  { backgroundColor: consultationRequested ? '#3B82F6' : '#F59E0B' }
                ]}
                onPress={handleConsultSafetyOfficer}
                activeOpacity={0.8}
              >
                <PhoneCall size={16} color="#FFFFFF" />
                <Text style={styles.evacuationBtnText}>
                  {consultationRequested ? 'Officer Alerted' : 'Consult Safety Officer'}
                </Text>
              </TouchableOpacity>
            </View>

            {consultationRequested && (
              <View style={[styles.officerContactBox, { backgroundColor: colors.isDark ? '#1F2937' : '#EFF6FF' }]}>
                <Text style={[styles.officerContactText, { color: colors.isDark ? '#93C5FD' : '#1E40AF' }]}>
                  👤 Safety Officer on duty: <Text style={{ fontWeight: '700' }}>EHS Safety Desk</Text> • Ext: <Text style={{ fontWeight: '700' }}>#104</Text> • Direct: <Text style={{ fontWeight: '700' }}>+1 (800) 555-SAFE</Text>
                </Text>
              </View>
            )}
          </View>
        )}

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

        {/* LATEST H2S EXPOSURE STATUS CARD */}
        {latestExposure ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: latestExposure.riskLevel === 'high' ? colors.dangerText : colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Flame size={18} color={latestExposure.riskLevel === 'high' ? colors.dangerText : colors.primaryOrange} />
                <Text style={[styles.cardSectionTitle, { color: colors.primaryText, marginBottom: 0 }]}>
                  Latest H₂S Exposure Reading
                </Text>
              </View>
              <RiskBadge risk={latestExposure.riskLevel} size="small" />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginVertical: 8 }}>
              <Text style={{ fontSize: 32, fontWeight: '900', color: latestExposure.riskLevel === 'high' ? colors.dangerText : latestExposure.riskLevel === 'average' ? colors.warningText : colors.primaryOrange }}>
                {latestExposure.h2sLevelPpm} <Text style={{ fontSize: 18, fontWeight: '600', color: colors.secondaryText }}>ppm</Text>
              </Text>
              <Text style={{ fontSize: 13, color: colors.secondaryText }}>
                ({latestExposure.riskLevel === 'high' ? 'High Risk - Hazardous' : latestExposure.riskLevel === 'average' ? 'Moderate Risk - Watch Exposure' : 'Normal / Safe'})
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 }}>
              <Text style={{ fontSize: 12, color: colors.secondaryText }}>
                🕒 Logged: <Text style={{ fontWeight: '700', color: colors.primaryText }}>{latestExposure.timestamp}</Text> on {latestExposure.date}
              </Text>
              <Text style={{ fontSize: 12, color: colors.secondaryText }}>
                Duration: <Text style={{ fontWeight: '700', color: colors.primaryText }}>{latestExposure.exposureDurationMinutes} min</Text>
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.secondaryBg, alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} color={colors.secondaryText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primaryText }}>No Exposure Scans Recorded</Text>
                <Text style={{ fontSize: 12, color: colors.secondaryText, marginTop: 2 }}>Perform your shift baseline scan using the camera below.</Text>
              </View>
            </View>
          </View>
        )}

        {/* TODAY'S DAILY RECORD CARD */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Activity size={18} color={colors.primaryOrange} />
              <Text style={[styles.cardSectionTitle, { color: colors.primaryText, marginBottom: 0 }]}>
                Today's Daily Record
              </Text>
            </View>
            <View style={[styles.dailyStatusPill, {
              backgroundColor: todayHighRisk ? colors.softDanger : todayModerate ? colors.softWarning : colors.softSuccess
            }]}>
              <Text style={[styles.dailyStatusText, {
                color: todayHighRisk ? colors.dangerText : todayModerate ? colors.warningText : colors.successText
              }]}>
                {todayHighRisk ? 'High Alert' : todayModerate ? 'Moderate' : 'Safe / Normal'}
              </Text>
            </View>
          </View>

          <View style={styles.dailyMetricsRow}>
            <View style={[styles.dailyMetricCell, { backgroundColor: colors.secondaryBg }]}>
              <Text style={[styles.dailyMetricVal, { color: colors.primaryText }]}>{todayCount}</Text>
              <Text style={[styles.dailyMetricLbl, { color: colors.secondaryText }]}>Scans Today</Text>
            </View>
            <View style={[styles.dailyMetricCell, { backgroundColor: colors.secondaryBg }]}>
              <Text style={[styles.dailyMetricVal, { color: todayPeakPpm > 9.0 ? '#EF4444' : todayPeakPpm > 5.0 ? '#F59E0B' : colors.primaryOrange }]}>
                {todayPeakPpm} ppm
              </Text>
              <Text style={[styles.dailyMetricLbl, { color: colors.secondaryText }]}>Peak PPM</Text>
            </View>
            <View style={[styles.dailyMetricCell, { backgroundColor: colors.secondaryBg }]}>
              <Text style={[styles.dailyMetricVal, { color: colors.primaryText }]}>{todayTotalDuration} min</Text>
              <Text style={[styles.dailyMetricLbl, { color: colors.secondaryText }]}>Time Exposed</Text>
            </View>
          </View>

          {/* Today's Scans List */}
          {todayRecords.length === 0 ? (
            <View style={styles.todayEmptyNotice}>
              <Clock size={20} color={colors.secondaryText} />
              <Text style={[styles.todayEmptyText, { color: colors.secondaryText }]}>
                No scans recorded today yet. Tap "Scan Now" to record your shift baseline.
              </Text>
            </View>
          ) : (
            <View style={styles.todayRecordsList}>
              <Text style={[styles.todaySubheading, { color: colors.secondaryText }]}>Today's Logged Scans:</Text>
              {todayRecords.map((r) => (
                <View key={r.id} style={[styles.todayRecordItem, { borderColor: colors.border, backgroundColor: colors.secondaryBg }]}>
                  <View>
                    <Text style={[styles.todayRecordTime, { color: colors.primaryText }]}>🕒 {r.timestamp}</Text>
                    <Text style={[styles.todayRecordSub, { color: colors.secondaryText }]}>Duration: {r.exposureDurationMinutes} min</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={[styles.todayRecordPpm, { color: r.h2sLevelPpm > 9.0 ? '#EF4444' : r.h2sLevelPpm > 5.0 ? '#F59E0B' : '#10B981' }]}>
                      {r.h2sLevelPpm} ppm
                    </Text>
                    <RiskBadge risk={r.riskLevel} size="small" />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Overall Exposure Summary Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardSectionTitle, { color: colors.primaryText }]}>
            All-Time Summary
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
                      H₂S: <Text style={{ fontWeight: '900' }}>{worker.latestH2sPpm ?? latestRec?.h2sLevelPpm ?? 0} ppm</Text>
                    </Text>
                    <Text style={[styles.hrDot, { color: colors.secondaryText }]}>•</Text>
                    <Text style={[styles.hrDuration, { color: colors.secondaryText }]}>
                      Duration: {latestRec?.exposureDurationMinutes ?? 0} min
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
        {/* Today's Worker Attendance Roster */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>
            Today's Shift Attendance ({allTodayAttendance.length})
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/workers')}>
            <Text style={[styles.seeAllText, { color: colors.primaryOrange }]}>View Roster</Text>
          </TouchableOpacity>
        </View>

        {allTodayAttendance.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Clock size={32} color={colors.secondaryText} />
            <Text style={[styles.emptyText, { color: colors.primaryText }]}>No worker check-ins logged today yet.</Text>
            <Text style={[styles.emptySubText, { color: colors.secondaryText }]}>Workers checking in for Shift A, B, or C will appear here in real time.</Text>
          </View>
        ) : (
          allTodayAttendance.slice(0, 5).map((att) => (
            <View
              key={att.id}
              style={[styles.recordRowCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.recordLeft}>
                <View style={styles.dateRow}>
                  <Text style={[styles.recordDate, { color: colors.primaryText }]}>{att.workerName || att.workerId}</Text>
                  <Text style={[styles.recordTime, { color: colors.primaryOrange, fontWeight: '700', marginLeft: 6 }]}>
                    ID: {att.workerId}
                  </Text>
                </View>
                <View style={styles.recordDetailsRow}>
                  <Text style={[styles.recordPpm, { color: colors.primaryText, fontWeight: '700' }]}>
                    {att.shiftName}
                  </Text>
                  <Text style={[styles.recordDot, { color: colors.secondaryText }]}>•</Text>
                  <Text style={[styles.recordDuration, { color: colors.secondaryText }]}>
                    Dept: {att.department || 'Operations'}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                <View style={[styles.activePill, { backgroundColor: colors.softSuccess }]}>
                  <Text style={[styles.activePillText, { color: colors.successText }]}>IN: {att.checkInTime}</Text>
                </View>
              </View>
            </View>
          ))
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

      <AttendanceModal
        visible={showAttendanceModal}
        onClose={() => {
          setShowAttendanceModal(false);
          appStorage.setItem(promptStorageKey, 'true');
        }}
      />
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
  evacuationAlertCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  evacuationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  evacuationIconPulse: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  evacuationTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 0.2,
  },
  evacuationSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  evacuationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  evacuationDirectiveBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  evacuationDirectiveText: {
    fontSize: 13,
    lineHeight: 18,
  },
  evacuationButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  evacuationActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  evacuationBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  officerContactBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
  },
  officerContactText: {
    fontSize: 12,
    lineHeight: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dailyStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dailyStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dailyMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  dailyMetricCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  dailyMetricVal: {
    fontSize: 17,
    fontWeight: '800',
  },
  dailyMetricLbl: {
    fontSize: 11,
    marginTop: 3,
  },
  todayEmptyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  todayEmptyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  todayRecordsList: {
    gap: 8,
    marginTop: 4,
  },
  todaySubheading: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  todayRecordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  todayRecordTime: {
    fontSize: 13,
    fontWeight: '700',
  },
  todayRecordSub: {
    fontSize: 11,
    marginTop: 2,
  },
  todayRecordPpm: {
    fontSize: 14,
    fontWeight: '800',
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  shiftCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  shiftCardBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  activePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '900',
  },
  shiftCardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  shiftActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  shiftActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
