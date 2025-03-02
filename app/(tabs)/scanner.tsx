import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TapGestureHandler, State, HandlerStateChangeEvent, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';

export default function ScannerScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [flipSound, setFlipSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(require('@/assets/sounds/flip_sound.mp3'));
      setFlipSound(sound);
    };

    loadSound();

    return () => {
      flipSound?.unloadAsync();
    };
  }, []);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = async () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    if (flipSound) {
      await flipSound.replayAsync();
    }
  };

  const handleDoubleTap = async (event: HandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      await toggleCameraFacing();
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TapGestureHandler onHandlerStateChange={handleDoubleTap} numberOfTaps={2}>
        <View style={styles.container}>
          <CameraView
            style={styles.camera}
            facing={facing}
          >
            <TouchableOpacity onPress={toggleCameraFacing} style={styles.iconButton}>
              <IconSymbol
                size={32}
                name="camera.rotate"
                color="white"
                weight="medium"
              />
            </TouchableOpacity>
          </CameraView>
        </View>
      </TapGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
  permissionButton: {
    backgroundColor: '#1E90FF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  permissionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  iconButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
  },
});