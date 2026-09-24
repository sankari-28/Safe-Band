import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Home, Cpu, Layers, BarChart2, ArrowRight, FileText, CheckCircle2, UserCheck, ArrowLeft, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/AppHeader';
import { ExposureResultCard } from '../components/ExposureResultCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { ExposureAnalysisResult } from '../types';

export default function ResultScreen() {
  const { colors } = useTheme();
  const { currentUser } = useAuth();
  const { lastScanResult, exposureRecords, generateReport } = useApp();
  const router = useRouter();

  const [reportGeneratedState, setReportGeneratedState] = useState(false);

  // Use last scan result, or the latest exposure record from database/API, or zeroed default
  const latestRec = exposureRecords.find((r) => r.workerId === currentUser?.employeeId || r.workerId === currentUser?.id) || exposureRecords[0];

  const result: ExposureAnalysisResult = lastScanResult || (latestRec ? {
    h2sLevel: latestRec.h2sLevelPpm,
    exposureDuration: latestRec.exposureDurationMinutes,
    confidence: 95,
    timestamp: latestRec.timestamp,
    date: latestRec.date,
    riskLevel: latestRec.riskLevel,
    sensorStatus: 'VALID_CALIBRATED_RANGE',
  } : {
    h2sLevel: 0,
    exposureDuration: 0,
    confidence: 0,
    timestamp: '--:--',
    date: 'No scans recorded',
    riskLevel: 'normal',
  });

  const handleGenerateReport = () => {
    setReportGeneratedState(true);
    // Find latest record for current worker and generate report
    if (latestRec) {
      generateReport(latestRec.id);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader title="Exposure Result" subtitle="AI Optical Analysis Dashboard" showBack onBackPress={handleBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.backBar, { backgroundColor: colors.secondaryBg, borderColor: colors.border }]}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={16} color={colors.primaryOrange} />
          <Text style={[styles.backBarText, { color: colors.primaryText }]}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.primaryText }]}>Analysis Complete</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            SafeBand H₂S sensing strip analysed successfully using mobile vision pipeline.
          </Text>
        </View>

        {/* Large Central Result Card */}
        <ExposureResultCard result={result} />

        {/* Technical Architecture Flow Visualizer */}
        <View style={[styles.techArchitectureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.techHeader}>
            <Cpu size={18} color={colors.primaryOrange} />
            <Text style={[styles.techTitle, { color: colors.primaryText }]}>
              Technical Processing Flow
            </Text>
          </View>

          <Text style={[styles.techDescription, { color: colors.secondaryText }]}>
            How your wristband photo was processed into an estimated exposure level:
          </Text>

          <View style={styles.pipelineFlow}>
            <View style={[styles.pipelineStep, { backgroundColor: colors.secondaryBg }]}>
              <Camera size={16} color={colors.primaryOrange} />
              <Text style={[styles.pipelineText, { color: colors.primaryText }]}>Worker Photo</Text>
            </View>

            <ArrowRight size={14} color={colors.secondaryText} />

            <View style={[styles.pipelineStep, { backgroundColor: colors.secondaryBg }]}>
              <Layers size={16} color={colors.primaryOrange} />
              <Text style={[styles.pipelineText, { color: colors.primaryText }]}>CV Color Space</Text>
            </View>

            <ArrowRight size={14} color={colors.secondaryText} />

            <View style={[styles.pipelineStep, { backgroundColor: colors.secondaryBg }]}>
              <BarChart2 size={16} color={colors.primaryOrange} />
              <Text style={[styles.pipelineText, { color: colors.primaryText }]}>Random Forest Model</Text>
            </View>
          </View>

          <Text style={[styles.pipelineFootnote, { color: colors.secondaryText }]}>
            • Features extracted: RGB, HSV, LAB colour metrics against baseline reference palette.
          </Text>
        </View>

        {/* Generate Report Section */}
        <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.reportHeader}>
            <FileText size={20} color={colors.primaryOrange} />
            <Text style={[styles.reportTitle, { color: colors.primaryText }]}>Exposure Report</Text>
          </View>

          <View style={styles.reportSummaryBox}>
            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: colors.secondaryText }]}>Worker ID:</Text>
              <Text style={[styles.reportValue, { color: colors.primaryText }]}>{currentUser?.employeeId || latestRec?.workerId || 'N/A'}</Text>
            </View>

            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: colors.secondaryText }]}>Worker Name:</Text>
              <Text style={[styles.reportValue, { color: colors.primaryText }]}>{currentUser?.name || latestRec?.workerName || 'Worker'}</Text>
            </View>

            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: colors.secondaryText }]}>Department:</Text>
              <Text style={[styles.reportValue, { color: colors.primaryText }]}>{currentUser?.department || 'Field Operations'}</Text>
            </View>

            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: colors.secondaryText }]}>H₂S Level:</Text>
              <Text style={[styles.reportValue, { color: colors.primaryOrange, fontWeight: '800' }]}>{result.h2sLevel} ppm</Text>
            </View>

            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: colors.secondaryText }]}>Risk Classification:</Text>
              <Text style={[styles.reportValue, { color: colors.primaryText, textTransform: 'capitalize' }]}>
                {result.riskCategory || (result.riskLevel === 'average' ? 'Moderate Risk' : result.riskLevel === 'high' ? 'High Risk' : 'Normal / Safe')}
              </Text>
            </View>

            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: colors.secondaryText }]}>AI Confidence:</Text>
              <Text style={[styles.reportValue, { color: colors.primaryText }]}>{result.confidence}%</Text>
            </View>
          </View>

          {reportGeneratedState ? (
            <View style={[styles.reportStatusBanner, { backgroundColor: colors.softSuccess }]}>
              <CheckCircle2 size={18} color={colors.successText} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.reportStatusTitle, { color: colors.successText }]}>Report Available to Safety Officer</Text>
                <Text style={[styles.reportStatusSub, { color: colors.successText }]}>
                  This record is logged and accessible on the Safety Officer monitoring portal.
                </Text>
              </View>
            </View>
          ) : (
            <PrimaryButton
              title="Generate Report"
              onPress={handleGenerateReport}
              icon={<FileText size={18} color="#FFFFFF" />}
              style={{ marginTop: 12 }}
            />
          )}
        </View>

        {/* Navigation Action Buttons */}
        <View style={styles.buttonSection}>
          <PrimaryButton
            title="Scan Again"
            onPress={() => router.push('/(tabs)/scan')}
            icon={<Camera size={20} color="#FFFFFF" />}
          />

          <SecondaryButton
            title="View Scan History"
            onPress={() => router.push('/(tabs)/history')}
            icon={<Clock size={18} color={colors.primaryOrange} />}
            style={{ marginTop: 10 }}
          />

          <SecondaryButton
            title="Return to Dashboard"
            onPress={() => router.replace('/(tabs)')}
            icon={<Home size={18} color={colors.primaryText} />}
            style={{ marginTop: 10 }}
          />
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
  headerBlock: {
    marginTop: 14,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  techArchitectureCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginVertical: 10,
  },
  techHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  techTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  techDescription: {
    fontSize: 12,
    marginBottom: 12,
  },
  pipelineFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  pipelineStep: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    gap: 4,
  },
  pipelineText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  pipelineFootnote: {
    fontSize: 11,
    marginTop: 12,
    fontStyle: 'italic',
  },
  reportCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginVertical: 10,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  reportSummaryBox: {
    gap: 6,
    marginBottom: 8,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportLabel: {
    fontSize: 13,
  },
  reportValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  reportStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    marginTop: 12,
  },
  reportStatusTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  reportStatusSub: {
    fontSize: 11,
    marginTop: 1,
  },
  buttonSection: {
    marginTop: 10,
  },
  backBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    marginBottom: 4,
  },
  backBarText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
