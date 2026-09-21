import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { X, Camera as CameraIcon, SwitchCamera } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onPictureTaken: (uri: string) => void;
  onPermissionDenied: () => void;
}

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
          quality: 0.8,
          skipProcessing: Platform.OS === 'android',
        });
        if (photo?.uri) {
          onPictureTaken(photo.uri);
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

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        {permission?.granted ? (
          <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
            {/* Overlay Grid / Target Alignment Guide */}
            <View style={styles.overlay}>
              {/* Header Controls */}
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.iconBtn} onPress={onClose} activeOpacity={0.7}>
                  <X size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconBtn} onPress={toggleCameraFacing} activeOpacity={0.7}>
                  <SwitchCamera size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Center Alignment Frame */}
              <View style={styles.targetFrame}>
                <View style={[styles.corner, styles.cornerTL, { borderColor: colors.primaryOrange }]} />
                <View style={[styles.corner, styles.cornerTR, { borderColor: colors.primaryOrange }]} />
                <View style={[styles.corner, styles.cornerBL, { borderColor: colors.primaryOrange }]} />
                <View style={[styles.corner, styles.cornerBR, { borderColor: colors.primaryOrange }]} />
                <Text style={styles.alignText}>Align SafeBand Sensing Strip</Text>
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
          </CameraView>
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
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 20 : 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetFrame: {
    height: 200,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
  },
  cornerTL: { top: 10, left: 10, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 10, right: 10, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 10, left: 10, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 10, right: 10, borderBottomWidth: 3, borderRightWidth: 3 },
  alignText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
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
