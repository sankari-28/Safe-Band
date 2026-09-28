import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, ActivityIndicator } from 'react-native';
import { Camera, RefreshCw, CheckCircle2, AlertTriangle, Video, VideoOff, SwitchCamera } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface LiveCameraViewfinderProps {
  selectedImage: string | null;
  onImageCaptured: (imageUri: string, viewfinderRoi?: [number, number, number, number]) => void;
  onClearImage: () => void;
  onRequestNativeCamera?: () => void;
}

export type ViewfinderMode = 'strip' | 'pad';

export const LiveCameraViewfinder: React.FC<LiveCameraViewfinderProps> = ({
  selectedImage,
  onImageCaptured,
  onClearImage,
  onRequestNativeCamera,
}) => {
  const { colors } = useTheme();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [viewfinderMode, setViewfinderMode] = useState<ViewfinderMode>('strip');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startWebcam = async (facing: 'user' | 'environment' = facingMode) => {
    if (Platform.OS !== 'web') {
      if (onRequestNativeCamera) onRequestNativeCamera();
      return;
    }

    setCameraError(null);
    setIsLoadingCamera(true);

    // Stop any active stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera streaming is not supported in this browser environment.');
      }

      // Mobile first: prioritize environment (rear) camera with portrait or HD resolution
      const attemptConstraints: MediaStreamConstraints[] = [
        { video: { facingMode: { ideal: facing }, width: { ideal: 1080 }, height: { ideal: 1920 } } },
        { video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { facingMode: 'environment' } },
        { video: { facingMode: 'user' } },
        { video: true },
      ];

      let stream: MediaStream | null = null;
      let lastErr: any = null;

      for (const constraints of attemptConstraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (e: any) {
          lastErr = e;
          if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
            break;
          }
        }
      }

      if (!stream) {
        throw lastErr || new Error('Could not initialize video stream.');
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => console.warn('Video play interrupted:', e));
      }
      setIsStreaming(true);
      onClearImage();
    } catch (err: any) {
      console.error('Webcam access error:', err);
      let msg = 'Could not access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'PERMISSION_DENIED';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera hardware detected on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is in use by another application or browser tab.';
      } else if (err.message) {
        msg = err.message;
      }
      setCameraError(msg);
      setIsStreaming(false);
    } finally {
      setIsLoadingCamera(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1080;
    const height = video.videoHeight || 1920;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror horizontally so captured image matches preview
    ctx.save();
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    // Calculate exact normalized ROI box reflecting what the user aligned on mobile
    let normalizedRoi: [number, number, number, number];
    if (viewfinderMode === 'strip') {
      // Centered vertical strip box: ~34% width, ~72% height
      const roiW = 0.34;
      const roiH = 0.72;
      const roiX = (1.0 - roiW) / 2.0;
      const roiY = (1.0 - roiH) / 2.0;
      normalizedRoi = [roiX, roiY, roiW, roiH];
    } else {
      // Centered square pad box: ~50% of min dimension
      const minDim = Math.min(width, height);
      const roiPx = minDim * 0.48;
      const roiX = (width - roiPx) / (2.0 * width);
      const roiY = (height - roiPx) / (2.0 * height);
      const roiW = roiPx / width;
      const roiH = roiPx / height;
      normalizedRoi = [roiX, roiY, roiW, roiH];
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onImageCaptured(dataUrl, normalizedRoi);

    stopWebcam();
  };

  const toggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startWebcam(nextMode);
  };

  const activeNeonColor = isStreaming ? '#2ED573' : colors.primaryOrange;

  return (
    <View style={[styles.container, { backgroundColor: '#0B1120', borderColor: colors.border }]}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View style={styles.liveIndicator}>
          <View
            style={[
              styles.liveDot,
              {
                backgroundColor: isStreaming
                  ? '#2ED573'
                  : selectedImage
                  ? colors.successText
                  : colors.primaryOrange,
              },
            ]}
          />
          <Text style={styles.liveText}>
            {isStreaming
              ? 'LIVE CAMERA ACTIVE'
              : selectedImage
              ? 'SNAPSHOT CAPTURED'
              : 'CAMERA STANDBY'}
          </Text>
        </View>

        {/* Viewfinder Target Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeTab,
              viewfinderMode === 'strip' && [styles.modeTabActive, { backgroundColor: colors.primaryOrange }],
            ]}
            onPress={() => setViewfinderMode('strip')}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeTabText, viewfinderMode === 'strip' && styles.modeTabTextActive]}>
              Vertical Strip
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTab,
              viewfinderMode === 'pad' && [styles.modeTabActive, { backgroundColor: colors.primaryOrange }],
            ]}
            onPress={() => setViewfinderMode('pad')}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeTabText, viewfinderMode === 'pad' && styles.modeTabTextActive]}>
              Square Pad
            </Text>
          </TouchableOpacity>
        </View>

        {isStreaming && (
          <View style={styles.streamControls}>
            <TouchableOpacity style={styles.iconBtn} onPress={toggleCamera} activeOpacity={0.7} accessibilityLabel="Flip Camera">
              <SwitchCamera size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={stopWebcam} activeOpacity={0.7} accessibilityLabel="Close Camera">
              <VideoOff size={16} color="#FF4757" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Viewport Container */}
      <View style={styles.viewport}>
        {/* Live HTML5 Video Feed on Web */}
        {Platform.OS === 'web' && (
          <video
            ref={videoRef as any}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isStreaming ? 'block' : 'none',
              borderRadius: 18,
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
            }}
          />
        )}

        {/* Static Snapshot Preview if Captured */}
        {selectedImage && !isStreaming ? (
          <Image source={{ uri: selectedImage }} style={styles.capturedImage} resizeMode="contain" />
        ) : null}

        {/* Loading Spinner */}
        {isLoadingCamera && (
          <View style={styles.centeredOverlay}>
            <ActivityIndicator size="large" color={colors.primaryOrange} />
            <Text style={styles.loadingText}>Connecting to device camera...</Text>
          </View>
        )}

        {/* Empty Standby State */}
        {!selectedImage && !isStreaming && !isLoadingCamera && (
          <View style={styles.standbyContent}>
            <View style={[styles.standbyIconCircle, { backgroundColor: 'rgba(232, 138, 61, 0.15)' }]}>
              <Camera size={38} color={colors.primaryOrange} />
            </View>
            <Text style={styles.standbyTitle}>Mobile Camera Viewfinder</Text>
            <Text style={styles.standbySub}>
              Align your test strip or wristband sensing pad inside the guide box for instant AI exposure reading
            </Text>
          </View>
        )}

        {/* Mobile Viewfinder Target Alignment Reticle */}
        {(isStreaming || selectedImage) && (
          <View style={styles.hudOverlay} pointerEvents="none">
            {/* Outer Darkened Vignette */}
            <View style={styles.vignetteTop} />
            <View style={styles.vignetteBottom} />
            <View style={styles.vignetteLeft} />
            <View style={styles.vignetteRight} />

            {/* Centered Target Box */}
            <View
              style={[
                viewfinderMode === 'strip' ? styles.targetStripBox : styles.targetPadBox,
                { borderColor: activeNeonColor },
              ]}
            >
              {/* Corner Brackets */}
              <View style={[styles.bracket, styles.bracketTL, { borderColor: activeNeonColor }]} />
              <View style={[styles.bracket, styles.bracketTR, { borderColor: activeNeonColor }]} />
              <View style={[styles.bracket, styles.bracketBL, { borderColor: activeNeonColor }]} />
              <View style={[styles.bracket, styles.bracketBR, { borderColor: activeNeonColor }]} />

              {/* Center Alignment Axis Guidelines */}
              <View style={[styles.axisH, { backgroundColor: activeNeonColor }]} />
              <View style={[styles.axisV, { backgroundColor: activeNeonColor }]} />

              {/* Reticle Target Badge */}
              <View style={[styles.reticleBadge, { backgroundColor: isStreaming ? 'rgba(46, 213, 115, 0.28)' : 'rgba(232, 138, 61, 0.28)' }]}>
                <Text style={[styles.reticleText, { color: activeNeonColor }]}>
                  {viewfinderMode === 'strip' ? '🎯 ALIGN STRIP HERE' : '🎯 ALIGN PAD HERE'}
                </Text>
                <Text style={styles.reticleSub}>
                  {viewfinderMode === 'strip'
                    ? 'Center vertical sensing strip inside frame'
                    : 'Center sensing pad inside box'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Camera Error / Permission Banner */}
      {cameraError && (
        <View style={styles.errorContainer}>
          <AlertTriangle size={18} color="#FF4757" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            {cameraError === 'PERMISSION_DENIED' ? (
              <View>
                <Text style={styles.errorHeader}>Camera Permission Needed</Text>
                <Text style={styles.errorSubText}>To activate your camera in browser:</Text>
                <Text style={styles.errorStep}>1. Click the lock/camera icon in your address bar.</Text>
                <Text style={styles.errorStep}>2. Allow camera access for this site.</Text>
                <TouchableOpacity
                  style={styles.retryPermBtn}
                  onPress={() => startWebcam()}
                  activeOpacity={0.8}
                >
                  <RefreshCw size={14} color="#FFFFFF" />
                  <Text style={styles.retryPermBtnText}>Try Camera Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.errorText}>{cameraError}</Text>
            )}
          </View>
        </View>
      )}

      {/* Quick Action Control Bar Under Viewport */}
      <View style={styles.actionRow}>
        {!isStreaming && !selectedImage && (
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: colors.primaryOrange }]}
            onPress={() => startWebcam()}
            activeOpacity={0.8}
          >
            <Video size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionBtnText}>Start Live Camera</Text>
          </TouchableOpacity>
        )}

        {isStreaming && (
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: '#2ED573' }]}
            onPress={captureSnapshot}
            activeOpacity={0.8}
          >
            <Camera size={20} color="#0B1120" />
            <Text style={[styles.primaryActionBtnText, { color: '#0B1120', fontWeight: '800' }]}>
              Capture Snapshot
            </Text>
          </TouchableOpacity>
        )}

        {selectedImage && !isStreaming && (
          <View style={styles.retakeRow}>
            <View style={styles.snapshotSuccessTag}>
              <CheckCircle2 size={16} color="#2ED573" />
              <Text style={styles.snapshotSuccessText}>Photo ready for AI analysis</Text>
            </View>
            <TouchableOpacity
              style={[styles.retakeBtn, { borderColor: colors.border, backgroundColor: colors.secondaryBg }]}
              onPress={() => startWebcam()}
              activeOpacity={0.7}
            >
              <RefreshCw size={14} color={colors.primaryOrange} />
              <Text style={[styles.retakeBtnText, { color: colors.primaryText }]}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
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
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 2,
    gap: 2,
  },
  modeTab: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modeTabActive: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modeTabText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  streamControls: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 6,
  },
  viewport: {
    width: '100%',
    height: Platform.OS === 'web' ? 440 : 380,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(0,0,0,0.6)',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturedImage: {
    ...(StyleSheet.absoluteFill as any),
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  centeredOverlay: {
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  standbyContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  standbyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  standbyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  standbySub: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  hudOverlay: {
    ...(StyleSheet.absoluteFill as any),
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetStripBox: {
    width: '42%',
    maxWidth: 220,
    minWidth: 140,
    height: '74%',
    maxHeight: 320,
    minHeight: 220,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  targetPadBox: {
    width: '58%',
    maxWidth: 260,
    minWidth: 180,
    height: '58%',
    maxHeight: 260,
    minHeight: 180,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  bracket: {
    position: 'absolute',
    width: 20,
    height: 20,
  },
  bracketTL: {
    top: -2,
    left: -2,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
  },
  bracketTR: {
    top: -2,
    right: -2,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
  },
  bracketBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
  },
  bracketBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
  },
  axisH: {
    position: 'absolute',
    width: 14,
    height: 1.5,
    opacity: 0.6,
  },
  axisV: {
    position: 'absolute',
    width: 1.5,
    height: 14,
    opacity: 0.6,
  },
  reticleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  reticleText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  reticleSub: {
    color: '#E2E8F0',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
    textAlign: 'center',
  },
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  vignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  vignetteLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  vignetteRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255, 71, 87, 0.12)',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  errorHeader: {
    color: '#FF4757',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  errorSubText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorStep: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16,
  },
  retryPermBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E88A3D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  retryPermBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF4757',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  actionRow: {
    marginTop: 12,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  retakeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snapshotSuccessTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  snapshotSuccessText: {
    color: '#2ED573',
    fontSize: 12.5,
    fontWeight: '700',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  retakeBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
