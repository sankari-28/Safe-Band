import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sliders, CheckCircle2, ShieldAlert, AlertTriangle, Save } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/AppHeader';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';

export default function ExposureSettingsScreen() {
  const { colors } = useTheme();
  const { thresholds, updateThresholds } = useApp();
  const router = useRouter();

  const [normalPpm, setNormalPpm] = useState(thresholds.normalThreshold.toString());
  const [highPpm, setHighPpm] = useState(thresholds.highThreshold.toString());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    const norm = parseFloat(normalPpm);
    const high = parseFloat(highPpm);

    if (isNaN(norm) || isNaN(high) || norm <= 0 || high <= norm) {
      Alert.alert('Invalid Thresholds', 'High-Risk threshold must be greater than Normal threshold.');
      return;
    }

    updateThresholds(norm, high);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const normVal = parseFloat(normalPpm) || 5;
  const highVal = parseFloat(highPpm) || 9;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader title="Exposure Level Settings" subtitle="EHS Threshold Configuration" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.primaryText }]}>Exposure Thresholds</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Configure H₂S concentration limits used for risk classification during optical AI analysis.
          </Text>
        </View>

        {savedSuccess && (
          <View style={[styles.successBanner, { backgroundColor: colors.softSuccess }]}>
            <CheckCircle2 size={18} color={colors.successText} />
            <Text style={[styles.successText, { color: colors.successText }]}>
              Threshold configuration updated successfully!
            </Text>
          </View>
        )}

        {/* Input Form Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Sliders size={20} color={colors.primaryOrange} />
            <Text style={[styles.cardTitle, { color: colors.primaryText }]}>Configuration Limits</Text>
          </View>

          <InputField
            label="Normal Threshold (ppm)"
            placeholder="e.g. 15"
            value={normalPpm}
            onChangeText={setNormalPpm}
            keyboardType="numeric"
          />

          <InputField
            label="High-Risk Threshold (ppm)"
            placeholder="e.g. 35"
            value={highPpm}
            onChangeText={setHighPpm}
            keyboardType="numeric"
          />

          <PrimaryButton
            title="Save Changes"
            onPress={handleSave}
            icon={<Save size={18} color="#FFFFFF" />}
            style={{ marginTop: 10 }}
          />
        </View>

        {/* Live Preview Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.primaryText, marginBottom: 4 }]}>
            Risk Classification Preview
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.secondaryText, marginBottom: 16 }]}>
            How future wristband scans will be categorized based on current thresholds:
          </Text>

          <View style={styles.previewList}>
            <View style={[styles.previewItem, { backgroundColor: colors.softSuccess }]}>
              <View style={styles.previewLeft}>
                <CheckCircle2 size={18} color={colors.successText} />
                <Text style={[styles.previewRange, { color: colors.primaryText }]}>≤ {normVal} ppm</Text>
              </View>
              <View style={[styles.previewBadge, { backgroundColor: colors.successText }]}>
                <Text style={styles.previewBadgeText}>NORMAL</Text>
              </View>
            </View>

            <View style={[styles.previewItem, { backgroundColor: colors.softWarning }]}>
              <View style={styles.previewLeft}>
                <AlertTriangle size={18} color={colors.warningText} />
                <Text style={[styles.previewRange, { color: colors.primaryText }]}>
                  {normVal} – {highVal} ppm
                </Text>
              </View>
              <View style={[styles.previewBadge, { backgroundColor: colors.warningText }]}>
                <Text style={styles.previewBadgeText}>AVERAGE</Text>
              </View>
            </View>

            <View style={[styles.previewItem, { backgroundColor: colors.softDanger }]}>
              <View style={styles.previewLeft}>
                <ShieldAlert size={18} color={colors.dangerText} />
                <Text style={[styles.previewRange, { color: colors.primaryText }]}>&gt; {highVal} ppm</Text>
              </View>
              <View style={[styles.previewBadge, { backgroundColor: colors.dangerText }]}>
                <Text style={styles.previewBadgeText}>HIGH</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Historical Integrity Note */}
        <View style={[styles.noteBox, { backgroundColor: colors.secondaryBg, borderColor: colors.border }]}>
          <Text style={[styles.noteTitle, { color: colors.primaryText }]}>Historical Record Integrity</Text>
          <Text style={[styles.noteText, { color: colors.secondaryText }]}>
            Updating risk thresholds applies to new scans captured going forward. Existing historical exposure records retain their original risk classification for auditing compliance.
          </Text>
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
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  successText: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 12,
  },
  previewList: {
    gap: 10,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
  },
  previewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewRange: {
    fontSize: 14,
    fontWeight: '700',
  },
  previewBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  previewBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  noteBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
