import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, ActivityIndicator } from 'react-native';
import { Camera, RefreshCw, CheckCircle2, AlertTriangle, Video, VideoOff, SwitchCamera } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface LiveCameraViewfinderProps {
  selectedImage: string | null;
  onImageCaptured: (imageUri: string) => void;
  onClearImage: () => void;
  onRequestNativeCamera?: () => void;
}

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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

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

      // Try progressive fallback constraints for desktop / laptop webcams
      const attemptConstraints: MediaStreamConstraints[] = [
        { video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
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
      let msg = 'Could not access webcam.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'PERMISSION_DENIED';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera hardware detected on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is already in use by another application (e.g. Teams, Zoom, or another tab).';
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
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
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

    // High-quality JPEG data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onImageCaptured(dataUrl);

    stopWebcam();
  };

  const toggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startWebcam(nextMode);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0B1120', borderColor: colors.border }]}>
      {/* Header telemetry badge */}
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
              ? 'LIVE WEBCAM ACTIVE'
              : selectedImage
              ? 'SNAPSHOT READY'
              : 'CAMERA STANDBY'}
          </Text>
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

      {/* Main Viewport */}
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
              borderRadius: 16,
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
            }}
          />
        )}

        {/* Static Snapshot Preview if Captured */}
        {selectedImage && !isStreaming ? (
          <Image source={{ uri: selectedImage }} style={styles.capturedImage} resizeMode="cover" />
        ) : null}

        {/* Loading Spinner */}
        {isLoadingCamera && (
          <View style={styles.centeredOverlay}>
            <ActivityIndicator size="large" color={colors.primaryOrange} />
            <Text style={styles.loadingText}>Initializing camera module...</Text>
          </View>
        )}

        {/* Empty Standby State */}
        {!selectedImage && !isStreaming && !isLoadingCamera && (
          <View style={styles.standbyContent}>
            <Camera size={44} color="rgba(255,255,255,0.4)" />
            <Text style={styles.standbyTitle}>Camera Viewfinder</Text>
            <Text style={styles.standbySub}>
              Start your device camera or upload a strip photograph to analyze H₂S concentration
            </Text>
          </View>
        )}

        {/* OpenCV HUD Target Alignment Reticle Overlay */}
        {(isStreaming || selectedImage) && (
          <View style={styles.hudOverlay} pointerEvents="none">
            {/* Outer Frame Corner Brackets */}
            <View style={[styles.corner, styles.cornerTL, { borderColor: isStreaming ? '#2ED573' : colors.primaryOrange }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: isStreaming ? '#2ED573' : colors.primaryOrange }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: isStreaming ? '#2ED573' : colors.primaryOrange }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: isStreaming ? '#2ED573' : colors.primaryOrange }]} />

            {/* Centered Target Box */}
            <View style={[styles.centerReticleBox, { borderColor: isStreaming ? '#2ED573' : colors.primaryOrange }]}>
              <View style={[styles.innerReticleCorner, styles.innerReticleTL, { borderColor: isStreaming ? '#2ED573' : colors.primaryOrange }]} />
              <View style={[styles.innerReticleCorner, styles.innerReticleTR, { borderColor: isStreaming ? '#2ED573' : colors.primaryOrange }]} />
              <View style={[styles.innerReticleCorner, styles.innerReticleBL, { borderColor: isStreaming ? '#2ED573' : colors.primaryOrange }]} />
              <View style={[styles.innerReticleCorner, styles.innerReticleBR, { borderColor: isStreaming ? '#2ED573' : colors.primaryOrange }]} />
              
              <View style={[styles.reticleBadge, { backgroundColor: isStreaming ? 'rgba(46, 213, 115, 0.25)' : 'rgba(232, 138, 61, 0.25)' }]}>
                <Text style={[styles.reticleText, { color: isStreaming ? '#2ED573' : colors.primaryOrange }]}>
                  🎯 ALIGN WRISTBAND HERE
                </Text>
                <Text style={styles.reticleSub}>Keep reactive sensing pad inside this box</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Camera Error / Permission Guide */}
      {cameraError && (
        <View style={styles.errorContainer}>
          <AlertTriangle size={18} color="#FF4757" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            {cameraError === 'PERMISSION_DENIED' ? (
              <View>
                <Text style={styles.errorHeader}>Camera Permission Blocked in Browser</Text>
                <Text style={styles.errorSubText}>To activate your live camera:</Text>
                <Text style={styles.errorStep}>
                  1. Look at the right end of your browser's address bar (next to the bookmark/star icon).
                </Text>
                <Text style={styles.errorStep}>
                  2. Click the <Text style={{ fontWeight: '700', color: '#FF4757' }}>crossed-out camera icon 📷</Text>.
                </Text>
                <Text style={styles.errorStep}>
                  3. Choose <Text style={{ fontWeight: '700', color: '#2ED573' }}>"Always allow http://localhost:8088 to access your camera"</Text> and click Done.
                </Text>
                <Text style={styles.errorStep}>
                  4. Click the <Text style={{ fontWeight: '700' }}>"Try Camera Again"</Text> button below.
                </Text>

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

      {/* Interactive Quick Bar Under Viewport */}
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
            <Camera size={20} color="#FFFFFF" />
            <Text style={[styles.primaryActionBtnText, { color: '#0B1120', fontWeight: '800' }]}>
              Capture Snapshot
            </Text>
          </TouchableOpacity>
        )}

        {selectedImage && !isStreaming && (
          <View style={styles.retakeRow}>
            <View style={styles.snapshotSuccessTag}>
              <CheckCircle2 size={16} color="#2ED573" />
              <Text style={styles.snapshotSuccessText}>Photo captured and ready</Text>
            </View>
            <TouchableOpacity
              style={[styles.retakeBtn, { borderColor: colors.border, backgroundColor: colors.secondaryBg }]}
              onPress={() => startWebcam()}
              activeOpacity={0.7}
            >
              <RefreshCw size={15} color={colors.primaryOrange} />
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
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  streamControls: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 6,
  },
  viewport: {
    width: '100%',
    height: Platform.OS === 'web' ? 520 : 380,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturedImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  centeredOverlay: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  standbyContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  standbyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  standbySub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 380,
  },
  hudOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    zIndex: 10,
  },
  cornerTL: {
    top: 14,
    left: 14,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTR: {
    top: 14,
    right: 14,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBL: {
    bottom: 14,
    left: 14,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBR: {
    bottom: 14,
    right: 14,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  centerReticleBox: {
    width: '65%',
    maxWidth: 540,
    minWidth: 320,
    height: '68%',
    maxHeight: 350,
    minHeight: 250,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  innerReticleCorner: {
    position: 'absolute',
    width: 22,
    height: 22,
  },
  innerReticleTL: {
    top: -2,
    left: -2,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
  },
  innerReticleTR: {
    top: -2,
    right: -2,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
  },
  innerReticleBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
  },
  innerReticleBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
  },
  reticleBadge: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  reticleText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  reticleSub: {
    color: '#E2E8F0',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255, 71, 87, 0.12)',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  errorHeader: {
    color: '#FF4757',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  errorSubText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  errorStep: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  retryPermBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E88A3D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  retryPermBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF4757',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  actionRow: {
    marginTop: 14,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
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
    fontSize: 13,
    fontWeight: '700',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  retakeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
