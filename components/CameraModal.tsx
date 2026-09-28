import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { X, Camera as CameraIcon, SwitchCamera } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onPictureTaken: (uri: string, base64?: string, viewfinderRoi?: [number, number, number, number]) => void;
  onPermissionDenied: () => void;
}

export type ViewfinderMode = 'strip' | 'pad';

export const CameraModal: React.FC<CameraModalProps> = ({
  visible,
  onClose,
  onPictureTaken,
  onPermissionDenied,
}) => {
  const { colors } = useTheme();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [viewfinderMode, setViewfinderMode] = useState<ViewfinderMode>('strip');

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission().then((res) => {
        if (!res.granted) {
          onPermissionDenied();
        }
      });
    }
  }, [visible]);

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const handleTakePicture = async () => {
    if (isCapturing) return;
    try {
      setIsCapturing(true);
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          base64: true,
          skipProcessing: false,
        });
        if (photo?.uri) {
          // Calculate normalized ROI corresponding to on-screen reticle
          let normalizedRoi: [number, number, number, number];
          if (viewfinderMode === 'strip') {
            // Centered vertical strip: ~34% width, ~72% height
            const roiW = 0.34;
            const roiH = 0.72;
            const roiX = (1.0 - roiW) / 2.0;
            const roiY = (1.0 - roiH) / 2.0;
            normalizedRoi = [roiX, roiY, roiW, roiH];
          } else {
            // Centered square pad
            const roiW = 0.48;
            const roiH = 0.48;
            const roiX = (1.0 - roiW) / 2.0;
            const roiY = (1.0 - roiH) / 2.0;
            normalizedRoi = [roiX, roiY, roiW, roiH];
          }

          onPictureTaken(photo.uri, photo.base64, normalizedRoi);
          onClose();
        }
      }
    } catch (err) {
      console.warn('Failed to take picture with CameraView:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  if (!visible) return null;

  const activeNeonColor = '#2ED573';

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        {permission?.granted ? (
          <View style={StyleSheet.absoluteFill}>
            <CameraView style={StyleSheet.absoluteFill} facing={facing} ref={cameraRef} />
            {/* Overlay Grid / Target Alignment Guide */}
            <View style={styles.overlay}>
              {/* Header Controls */}
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.iconBtn} onPress={onClose} activeOpacity={0.7}>
                  <X size={24} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Mode Selector Pill */}
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

                <TouchableOpacity style={styles.iconBtn} onPress={toggleCameraFacing} activeOpacity={0.7}>
                  <SwitchCamera size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Center Alignment Frame */}
              <View style={styles.reticleContainer} pointerEvents="none">
                <View
                  style={[
                    viewfinderMode === 'strip' ? styles.targetStripBox : styles.targetPadBox,
                    { borderColor: activeNeonColor },
                  ]}
                >
                  {/* Neon Brackets */}
                  <View style={[styles.bracket, styles.bracketTL, { borderColor: activeNeonColor }]} />
                  <View style={[styles.bracket, styles.bracketTR, { borderColor: activeNeonColor }]} />
                  <View style={[styles.bracket, styles.bracketBL, { borderColor: activeNeonColor }]} />
                  <View style={[styles.bracket, styles.bracketBR, { borderColor: activeNeonColor }]} />

                  {/* Crosshair Guides */}
                  <View style={[styles.axisH, { backgroundColor: activeNeonColor }]} />
                  <View style={[styles.axisV, { backgroundColor: activeNeonColor }]} />

                  {/* Guidance Badge */}
                  <View style={[styles.reticleBadge, { backgroundColor: 'rgba(46, 213, 115, 0.28)' }]}>
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

              {/* Bottom Shutter Controls */}
              <View style={styles.bottomRow}>
                <TouchableOpacity
                  style={[
                    styles.shutterBtn,
                    { backgroundColor: colors.primaryOrange, opacity: isCapturing ? 0.6 : 1 },
                  ]}
                  onPress={handleTakePicture}
                  disabled={isCapturing}
                  activeOpacity={0.8}
                >
                  <View style={styles.shutterInner}>
                    <CameraIcon size={28} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.permissionBox}>
            <Text style={[styles.permissionText, { color: '#FFFFFF' }]}>
              Requesting camera permission...
            </Text>
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.primaryOrange }]} onPress={onClose}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 24 : 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modeTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modeTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  reticleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetStripBox: {
    width: '38%',
    height: 290,
    borderWidth: 2,
    borderRadius: 16,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  targetPadBox: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderRadius: 16,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  bracket: {
    position: 'absolute',
    width: 22,
    height: 22,
  },
  bracketTL: {
    top: -3,
    left: -3,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 14,
  },
  bracketTR: {
    top: -3,
    right: -3,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 14,
  },
  bracketBL: {
    bottom: -3,
    left: -3,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 14,
  },
  bracketBR: {
    bottom: -3,
    right: -3,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 14,
  },
  axisH: {
    position: 'absolute',
    width: 28,
    height: 2,
    opacity: 0.85,
  },
  axisV: {
    position: 'absolute',
    width: 2,
    height: 28,
    opacity: 0.85,
  },
  reticleBadge: {
    position: 'absolute',
    bottom: -46,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46, 213, 115, 0.4)',
    minWidth: 170,
  },
  reticleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  reticleSub: {
    fontSize: 8.5,
    color: '#E2E8F0',
    fontWeight: '500',
    marginTop: 1,
  },
  bottomRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  shutterInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  closeBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
