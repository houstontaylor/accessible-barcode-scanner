import { CameraView, CameraType, useCameraPermissions, BarcodeScannerResult} from 'expo-camera';
import { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TapGestureHandler, State, HandlerStateChangeEvent, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';

export default function ScannerScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [flipSound, setFlipSound] = useState<Audio.Sound | null>(null);
  //Addition 1: Barcode Scanner const
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);


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
  // Addition 3: Handling barcode scanning
  const handleBarCodeScanned = ({ type, data }: BarcodeScannerResult) => {
    // Stop scanning to prevent multiple scans
    setScannedBarcode(data);
    
    const openFoodRequest = async () => {
        try {
          const body = "Plain stringl"
          const food_response = await fetch("https://world.openfoodfacts.org/", {
            method: "POST",
            headers: {
              "Content-Type": "text/plain", //this should change depending on the type of return value that the barcode gives
             
            },
            body: body,
            }),
          });
    // Look up dietary information (replace with actual API call)
    const info = openFoodRequest;
    if (info) {
      setDietaryInfo(info);

    } else {
      // Handle case where barcode is not found
      alert('No dietary information found for this barcode');
    }
  };

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
            
            //Addition 2: barcode scanner and types here
            barcodeScannerSettings={{
                // Specify which barcode types you want to scan
                barcodeTypes: [
                  'ean13', 
                  'ean8', 
                  'upc_a', 
                  'upc_e', 
                  'code39', 
                  'code128'
                ]
              }}
              onBarcodeScanned={handleBarCodeScanned}
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