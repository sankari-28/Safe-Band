import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Info, CheckCircle2, Eye, RefreshCw, AlertCircle, Camera } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { AppHeader } from '../components/AppHeader';

export default function GuidanceScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader title="SafeBand Guidance" subtitle="Usage & Strip Scan Instructions" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title Header */}
        <View style={styles.titleSection}>
          <Text style={[styles.mainTitle, { color: colors.primaryText }]}>SafeBand Guidance</Text>
          <Text style={[styles.mainSubtitle, { color: colors.secondaryText }]}>
            How to use, maintain, and scan your H₂S monitoring wristband
          </Text>
        </View>

        {/* Featured SafeBand Diagram Image */}
        <View style={[styles.imageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image
            source={require('../assets/images/safeband-guidance.png')}
            style={styles.guidanceImage}
            resizeMode="contain"
          />
          <Text style={[styles.imageCaption, { color: colors.secondaryText }]}>
            Official SafeBand H₂S Wristband & Replaceable Strip Diagram
          </Text>
        </View>

        {/* Section 1 — Wear the Wristband */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.lightOrange }]}>
              <Shield size={20} color={colors.primaryOrange} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>1. Wear the Wristband</Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <CheckCircle2 size={16} color={colors.successText} />
              <Text style={[styles.bulletText, { color: colors.primaryText }]}>
                Wear the wristband securely on your wrist during your work shift.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <CheckCircle2 size={16} color={colors.successText} />
              <Text style={[styles.bulletText, { color: colors.primaryText }]}>
                Keep the sensing strip area exposed and clear of obstruction.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <CheckCircle2 size={16} color={colors.successText} />
              <Text style={[styles.bulletText, { color: colors.primaryText }]}>
                Ensure the wristband is positioned properly before taking scan images.
              </Text>
            </View>
          </View>
        </View>

        {/* Section 2 — Replace the Strip (01 Open, 02 Insert, 03 Close) */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.lightOrange }]}>
              <RefreshCw size={20} color={colors.primaryOrange} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>2. Replace the Strip</Text>
          </View>

          <Text style={[styles.sectionDesc, { color: colors.secondaryText }]}>
            Follow the 3-step physical strip insertion sequence:
          </Text>

          <View style={styles.stepsGrid}>
            <View style={[styles.stepCard, { backgroundColor: colors.secondaryBg, borderColor: colors.border }]}>
              <Text style={[styles.stepNum, { color: colors.primaryOrange }]}>01</Text>
              <Text style={[styles.stepName, { color: colors.primaryText }]}>Open</Text>
              <Text style={[styles.stepDetail, { color: colors.secondaryText }]}>
                Open the wristband cover carefully to reveal the sensing compartment.
              </Text>
            </View>

            <View style={[styles.stepCard, { backgroundColor: colors.secondaryBg, borderColor: colors.border }]}>
              <Text style={[styles.stepNum, { color: colors.primaryOrange }]}>02</Text>
              <Text style={[styles.stepName, { color: colors.primaryText }]}>Insert</Text>
              <Text style={[styles.stepDetail, { color: colors.secondaryText }]}>
                Place a fresh replaceable sensing strip into the designated slot.
              </Text>
            </View>

            <View style={[styles.stepCard, { backgroundColor: colors.secondaryBg, borderColor: colors.border }]}>
              <Text style={[styles.stepNum, { color: colors.primaryOrange }]}>03</Text>
              <Text style={[styles.stepName, { color: colors.primaryText }]}>Close</Text>
              <Text style={[styles.stepDetail, { color: colors.secondaryText }]}>
                Close the wristband cover securely until it latches in place.
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3 — Reference Colour Scale */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.lightOrange }]}>
              <Eye size={20} color={colors.primaryOrange} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>3. Reference Colour Scale</Text>
          </View>

          <Text style={[styles.sectionDesc, { color: colors.secondaryText }]}>
            The built-in reference colour scale strip is essential for AI computer vision accuracy:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <CheckCircle2 size={16} color={colors.successText} />
              <Text style={[styles.bulletText, { color: colors.primaryText }]}>
                Helps the mobile camera auto-calibrate lighting conditions and shadow variations.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <CheckCircle2 size={16} color={colors.successText} />
              <Text style={[styles.bulletText, { color: colors.primaryText }]}>
                Compares the copper acetate strip colour shift against known ppm values.
              </Text>
            </View>
          </View>
        </View>

        {/* Section 4 — Expiry Indicator */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.lightOrange }]}>
              <AlertCircle size={20} color={colors.primaryOrange} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>4. Expiry Indicator</Text>
          </View>

          <Text style={[styles.sectionDesc, { color: colors.secondaryText }]}>
            Check the visible indicator window on the wristband:
          </Text>

          <View style={styles.indicatorRow}>
            <View style={[styles.indicatorPill, { backgroundColor: colors.softSuccess }]}>
              <View style={[styles.indicatorDot, { backgroundColor: colors.successText }]} />
              <Text style={[styles.indicatorPillText, { color: colors.successText }]}>Green → Valid Strip</Text>
            </View>

            <View style={[styles.indicatorPill, { backgroundColor: colors.softDanger }]}>
              <View style={[styles.indicatorDot, { backgroundColor: colors.dangerText }]} />
              <Text style={[styles.indicatorPillText, { color: colors.dangerText }]}>Red → Expired Strip</Text>
            </View>
          </View>
        </View>

        {/* Section 5 — How to Scan */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.lightOrange }]}>
              <Camera size={20} color={colors.primaryOrange} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>5. How to Scan</Text>
          </View>

          <View style={styles.numberedScanList}>
            {[
              'Open the Scan page in the mobile application.',
              'Place the wristband inside the camera guide frame.',
              'Make sure the strip and reference colour scale are visible.',
              'Use sufficient, glare-free lighting.',
              'Avoid motion blur and harsh reflections.',
              'Capture the photo.',
              'Wait a few seconds for AI optical analysis.',
              'View your estimated H₂S ppm exposure result & risk classification.',
            ].map((text, idx) => (
              <View key={idx} style={styles.scanNumItem}>
                <View style={[styles.scanNumBadge, { backgroundColor: colors.primaryOrange }]}>
                  <Text style={styles.scanNumText}>{idx + 1}</Text>
                </View>
                <Text style={[styles.scanStepText, { color: colors.primaryText }]}>{text}</Text>
              </View>
            ))}
          </View>
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
  titleSection: {
    marginTop: 14,
    marginBottom: 14,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  mainSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  imageCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  guidanceImage: {
    width: '100%',
    height: 240,
    borderRadius: 14,
  },
  imageCaption: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionDesc: {
    fontSize: 13,
    marginBottom: 12,
  },
  bulletList: {
    gap: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  stepsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  stepCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  stepNum: {
    fontSize: 18,
    fontWeight: '900',
  },
  stepName: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  stepDetail: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  indicatorRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  indicatorPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  indicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  indicatorPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  numberedScanList: {
    gap: 10,
  },
  scanNumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scanNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanNumText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  scanStepText: {
    fontSize: 13,
    flex: 1,
  },
});
