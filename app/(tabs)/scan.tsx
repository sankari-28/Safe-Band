import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Upload, CheckCircle2, Info, Sparkles, Layers, Cpu, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { CameraModal } from '../../components/CameraModal';
import { LiveCameraViewfinder } from '../../components/LiveCameraViewfinder';
import { runMockExposureAnalysis, INITIAL_ANALYSIS_STEPS } from '../../services/mockAnalysisService';

export default function ScanScreen() {
  const { colors } = useTheme();
  const { currentUser } = useAuth();
  const { calculateRiskLevel, addExposureRecord, setLastScanResult } = useApp();
  const router = useRouter();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showCameraModal, setShowCameraModal] = useState(false);

  // -------------------------------------------------------------
  // 1. CAPTURE IMAGE — REAL EXPO CAMERA (NATIVE & WEB)
  // -------------------------------------------------------------
  const handleCaptureImage = async () => {
    setErrorMessage('');
    if (Platform.OS === 'web') {
      try {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setErrorMessage('Camera access was denied. Please enable camera permission in your device settings.');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setSelectedImage(asset.uri);
        }
      } catch (err) {
        setErrorMessage('Camera access failed or is unsupported on this platform.');
      }
    } else {
      setShowCameraModal(true);
    }
  };

  // -------------------------------------------------------------
  // 2. UPLOAD IMAGE — REAL FILE EXPLORER / PICKER (MOBILE & WEB)
  // -------------------------------------------------------------
  const handleUploadImage = async () => {
    setErrorMessage('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;

        // Basic file extension verification if filename is provided
        if (asset.fileName) {
          const lowerName = asset.fileName.toLowerCase();
          const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
          const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));
          if (!isValid) {
            setErrorMessage('Please select a valid image file.');
            return;
          }
        }

        setSelectedImage(uri);
      }
    } catch (err) {
      setErrorMessage('Unable to open file picker on this device/browser.');
    }
  };

  // -------------------------------------------------------------
  // 3. START AI EXPOSURE ANALYSIS PIPELINE
  // -------------------------------------------------------------
  const startAnalysis = async () => {
    setErrorMessage('');

    if (!selectedImage) {
      setErrorMessage('Please start the camera and capture a photo (or upload a strip image) before analyzing.');
      return;
    }

    setIsAnalyzing(true);
    setActiveStepIndex(-1);

    try {
      const workerId = currentUser?.employeeId || currentUser?.id || 'SID001';
      const workerName = currentUser?.name || 'Siddharth (Worker)';

      const result = await runMockExposureAnalysis(
        calculateRiskLevel,
        (stepIndex) => setActiveStepIndex(stepIndex),
        selectedImage,
        workerId
      );

      // If AI detects missing wristband, empty background, or glare requiring retake
      if (result.retakeRequired) {
        setIsAnalyzing(false);
        setErrorMessage(result.warning || result.message || 'Please align your wristband sensing strip inside the box and take the photo again.');
        return;
      }

      // Save record in context and persist in MySQL backend via API gateway
      await addExposureRecord({
        workerId,
        workerName,
        timestamp: result.timestamp,
        date: result.date,
        h2sLevelPpm: result.h2sLevel,
        exposureDurationMinutes: result.exposureDuration,
        confidencePercentage: result.confidence,
        reportGenerated: true,
        imageUri: selectedImage || undefined,
        notes: result.isMock
          ? 'Simulation mode analysis.'
          : `Live OpenCV + Random Forest AI scan (${result.riskCategory || result.riskLevel}).`,
      });

      setLastScanResult(result);

      setTimeout(() => {
        setIsAnalyzing(false);
        router.push('/result');
      }, 500);
    } catch (err) {
      setIsAnalyzing(false);
      setErrorMessage('Analysis service encountered an unexpected error. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader title="Scan Wristband" subtitle="AI Image Exposure Analysis" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Error / Permission Banner */}
        {errorMessage ? (
          <View style={[styles.alertBanner, { backgroundColor: colors.softDanger, borderColor: colors.dangerText }]}>
            <AlertCircle size={18} color={colors.dangerText} />
            <Text style={[styles.alertBannerText, { color: colors.dangerText }]}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Live Camera Viewfinder & Alignment HUD */}
        <LiveCameraViewfinder
          selectedImage={selectedImage}
          onImageCaptured={(uri) => {
            setSelectedImage(uri);
            setErrorMessage('');
          }}
          onClearImage={() => {
            setSelectedImage(null);
            setErrorMessage('');
          }}
          onRequestNativeCamera={() => setShowCameraModal(true)}
        />

        {/* Upload Image Option */}
        <View style={styles.controlRow}>
          {Platform.OS !== 'web' && (
            <SecondaryButton
              title="Native Camera"
              onPress={() => setShowCameraModal(true)}
              disabled={isAnalyzing}
              icon={<Camera size={18} color={colors.primaryOrange} />}
              style={{ flex: 1 }}
            />
          )}

          <SecondaryButton
            title="Upload Photo from Computer"
            onPress={handleUploadImage}
            disabled={isAnalyzing}
            icon={<Upload size={18} color={colors.primaryText} />}
            style={{ flex: 1 }}
          />
        </View>

        {/* Primary Analysis Trigger Button */}
        <PrimaryButton
          title={isAnalyzing ? 'Analyzing Image...' : 'Analyze Exposure'}
          onPress={startAnalysis}
          disabled={isAnalyzing}
          loading={isAnalyzing}
          icon={<Cpu size={20} color="#FFFFFF" />}
          style={{ marginBottom: 16 }}
        />

        {/* Analysis Simulation Card */}
        {isAnalyzing && (
          <View style={[styles.analysisModalCard, { backgroundColor: colors.card, borderColor: colors.primaryOrange }]}>
            <View style={styles.analysisModalHeader}>
              <ActivityIndicator size="small" color={colors.primaryOrange} />
              <Text style={[styles.analysisModalTitle, { color: colors.primaryText }]}>
                AI Optical Pipeline Analysis...
              </Text>
            </View>

            <View style={styles.stepsList}>
              {INITIAL_ANALYSIS_STEPS.map((step, idx) => {
                const isCompleted = idx <= activeStepIndex;
                const isCurrent = idx === activeStepIndex + 1;

                return (
                  <View key={step.id} style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepIconCircle,
                        {
                          backgroundColor: isCompleted
                            ? colors.softSuccess
                            : isCurrent
                            ? colors.lightOrange
                            : colors.secondaryBg,
                        },
                      ]}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={16} color={colors.successText} />
                      ) : (
                        <Text
                          style={[
                            styles.stepNumber,
                            { color: isCurrent ? colors.primaryOrange : colors.secondaryText },
                          ]}
                        >
                          {step.id}
                        </Text>
                      )}
                    </View>

                    <View style={styles.stepTextContainer}>
                      <Text
                        style={[
                          styles.stepTitle,
                          {
                            color: isCompleted
                              ? colors.successText
                              : isCurrent
                              ? colors.primaryOrange
                              : colors.secondaryText,
                            fontWeight: isCompleted || isCurrent ? '700' : '500',
                          },
                        ]}
                      >
                        {step.title}
                      </Text>
                      <Text style={[styles.stepSubtitle, { color: colors.secondaryText }]}>
                        {step.subtitle}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Photography Guidance Checklist */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.checklistHeader}>
            <Sparkles size={18} color={colors.primaryOrange} />
            <Text style={[styles.checklistTitle, { color: colors.primaryText }]}>
              Instructions for Clear Analysis
            </Text>
          </View>

          <View style={styles.checklistItems}>
            <View style={styles.checkItem}>
              <CheckCircle2 size={15} color={colors.successText} />
              <Text style={[styles.checkText, { color: colors.primaryText }]}>Keep wristband clearly visible</Text>
            </View>

            <View style={styles.checkItem}>
              <CheckCircle2 size={15} color={colors.successText} />
              <Text style={[styles.checkText, { color: colors.primaryText }]}>Keep sensing strip inside frame</Text>
            </View>

            <View style={styles.checkItem}>
              <CheckCircle2 size={15} color={colors.successText} />
              <Text style={[styles.checkText, { color: colors.primaryText }]}>Include the reference colour scale</Text>
            </View>

            <View style={styles.checkItem}>
              <CheckCircle2 size={15} color={colors.successText} />
              <Text style={[styles.checkText, { color: colors.primaryText }]}>Avoid blurry images & heavy reflections</Text>
            </View>

            <View style={styles.checkItem}>
              <CheckCircle2 size={15} color={colors.successText} />
              <Text style={[styles.checkText, { color: colors.primaryText }]}>Use sufficient lighting</Text>
            </View>

            <View style={styles.checkItem}>
              <CheckCircle2 size={15} color={colors.successText} />
              <Text style={[styles.checkText, { color: colors.primaryText }]}>Keep camera straight and steady</Text>
            </View>
          </View>
        </View>

        {/* Link to SafeBand Guidance */}
        <TouchableOpacity
          style={[styles.guidanceBanner, { backgroundColor: colors.secondaryBg, borderColor: colors.border }]}
          onPress={() => router.push('/guidance')}
        >
          <View style={styles.guidanceBannerText}>
            <Text style={[styles.guidanceBannerTitle, { color: colors.primaryText }]}>
              Need Help Using SafeBand?
            </Text>
            <Text style={[styles.guidanceBannerSub, { color: colors.secondaryText }]}>
              Read detailed instructions on strip replacement & color calibration
            </Text>
          </View>
          <ArrowRight size={18} color={colors.primaryOrange} />
        </TouchableOpacity>
      </ScrollView>

      <CameraModal
        visible={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPictureTaken={(uri) => setSelectedImage(uri)}
        onPermissionDenied={() => {
          setShowCameraModal(false);
          setErrorMessage('Camera access was denied. Please enable camera permission in your device settings.');
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
    paddingBottom: 40,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 4,
  },
  alertBannerText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  viewfinderCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginVertical: 14,
    alignItems: 'center',
  },
  viewfinderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  guidancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  guidancePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  targetFrame: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    zIndex: 10,
  },
  cornerTL: {
    top: 10,
    left: 10,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 10,
    right: 10,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 10,
    left: 10,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 10,
    right: 10,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  alignmentGuideCenter: {
    alignItems: 'center',
    gap: 8,
  },
  guideCenterText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  frameHint: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 14,
    textAlign: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  analysisModalCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 18,
    marginBottom: 16,
  },
  analysisModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  analysisModalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
  },
  stepSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  checklistTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  checklistItems: {
    gap: 10,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 13,
    fontWeight: '500',
  },
  guidanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  guidanceBannerText: {
    flex: 1,
    paddingRight: 10,
  },
  guidanceBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  guidanceBannerSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
