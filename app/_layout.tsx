import { useState, useEffect } from "react";
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useColorScheme } from "@/hooks/useColorScheme";
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TapGestureHandler, State, HandlerStateChangeEvent, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const [currentScreen, setCurrentScreen] = useState("dietaryRestrictions");
  const [scanCount, setScanCount] = useState(0);
  type RestrictionType = {
    [key: string]: boolean; // Keys are strings, values are boolean
  };
  const [restrictions, setRestrictions] = useState<RestrictionType>({
    Eggs: false,
    Milk: false,
    Peanuts: true,
    Almonds: false,
  });  

  const isSafeScan = scanCount % 2 === 0;
  const detectedIngredients = isSafeScan ? [] : ["Peanuts"];
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [flipSound, setFlipSound] = useState<Audio.Sound | null>(null);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "scanned">("idle");
  const [scannedProduct, setScannedProduct] = useState<{
    barcode: string;
    title: string;
    brand: string;
    ingredients: string;
    image: string | null;
  } | null>(null);  

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (currentScreen === "camera" && scanStatus === "scanning") {
      setTimeout(() => {
        setScanCount((prev) => prev + 1);
        setScanStatus("scanned");
        setCurrentScreen("scanResult");
      }, 3000);
    }
  }, [scanStatus, currentScreen]);  

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

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanStatus !== "idle") return; 
  
    if (!/^\d{7,14}$/.test(data)) {
      Alert.alert("Invalid Barcode", "The scanned barcode is not a valid format.", [
        { text: "OK", onPress: () => setScanStatus("idle") },
      ]);
      return;
    }
  
    setScanStatus("scanning");
  
    try {
      const apiKey = "YOUR_ACTUAL_API_KEY"; 
      const response = await fetch(
        `https://api.barcodelookup.com/v3/products?barcode=${data}&formatted=y&key=${apiKey}`
      );
  
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
  
      const result = await response.json();
      const product = result.products?.[0] || null;
  
      if (product) {
        setScannedProduct({
          barcode: data,
          title: product.title,
          brand: product.brand,
          ingredients: product.ingredients || "Not listed",
          image: product.images?.[0] || null,
        });
  
        setScanStatus("scanned");
        setCurrentScreen("scanResult"); 
      } else {
        Alert.alert("No Product Found", "No details available for this barcode.", [
          { text: "OK", onPress: () => setScanStatus("idle") },
        ]);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      Alert.alert("Error", "Failed to fetch product data.", [
        { text: "OK", onPress: () => setScanStatus("idle") },
      ]);
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

  if (!loaded) {
    return null;
  }

  // 📌 **Dietary Restrictions Page**
  if (currentScreen === "dietaryRestrictions") {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Dietary Restrictions</Text>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>
              This is where you highlight the items that you want our product to
              look out for in its AI analysis.
            </Text>
          </View>

          <View style={styles.list}>
            {Object.keys(restrictions).map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.buttonItem,
                  {
                    backgroundColor: restrictions[item] ? "#4CAF50" : "#E0E0E0",
                  }, // Green if selected, Gray otherwise
                ]}
                onPress={() =>
                  setRestrictions({
                    ...restrictions,
                    [item]: !restrictions[item],
                  })
                }
                accessibilityLabel={`${item}, currently ${
                  restrictions[item] ? "selected" : "not selected"
                }`}
                accessibilityHint={`Double tap to ${
                  restrictions[item] ? "deselect" : "select"
                } ${item}`}
              >
                <Text style={styles.buttonText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setCurrentScreen("camera")}
          >
            <Text style={styles.scanButtonText}>BEGIN SCAN</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 📸 **Camera Scanning Screen**
  if (currentScreen === "camera") {
    if (!permission || !permission.granted) {
      return (
        <SafeAreaView style={styles.safeContainer}>
          <Text style={styles.permissionText}>We need access to your camera.</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionText}>Grant Permission</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    } else {
      return (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <TapGestureHandler onHandlerStateChange={handleDoubleTap} numberOfTaps={2}>
            <View style={styles.cameraContainer}> 
              <CameraView
                style={StyleSheet.absoluteFill} // ✅ This ensures full screen!
                facing={facing}
                onBarcodeScanned={scanStatus === "idle" ? handleBarcodeScanned : undefined}
              >
                <View style={styles.overlayContainer}>
                  <TouchableOpacity onPress={toggleCameraFacing} style={styles.iconButton}>
                    <IconSymbol size={32} name="camera.rotate" color="white" weight="medium" />
                  </TouchableOpacity>
                </View>
              </CameraView>
            </View>
          </TapGestureHandler>
        </GestureHandlerRootView>
      );      
    }
  }

  // 🛑 **Scan Result Screen**
  if (currentScreen === "scanResult") {
    if (!scannedProduct) {
      return null;
    } else {
      return (
        <SafeAreaView style={styles.safeContainer}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Scan Result</Text>
          </View>
    
          <View style={styles.resultContainer}>
            {scannedProduct.image && (
              <Image source={{ uri: scannedProduct.image }} style={styles.productImage} />
            )}
            <Text style={styles.productTitle}>{scannedProduct.title}</Text>
            <Text style={styles.productBrand}>Brand: {scannedProduct.brand}</Text>
            <Text style={styles.productBarcode}>Barcode: {scannedProduct.barcode}</Text>
    
            <View style={styles.ingredientBox}>
              <Text style={styles.ingredientText}>Ingredients:</Text>
              <Text style={styles.ingredientItem}>{scannedProduct.ingredients}</Text>
            </View>
          </View>
    
          <TouchableOpacity style={styles.nextScanButton} onPress={() => {
            setScanStatus("idle");
            setCurrentScreen("camera");
          }}>
            <Text style={styles.nextScanButtonText}>Scan Another Item</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
  }

  if (currentScreen === "alternativeItems") {
    const alternativeItems = [
      "Sunflower Butter",
      "Almond Butter",
      "Soy Butter",
    ];
    const alternativeText = `Alternative Items: ${alternativeItems.join(", ")}`;

    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Alternative Items</Text>
        </View>

        <View style={styles.alternativeContainer}>
          <Text style={styles.alternativeText}>{alternativeText}</Text>
        </View>

        <TouchableOpacity
          style={styles.largeNextScanButton}
          onPress={() => setCurrentScreen("camera")}
        >
          <Text style={styles.nextScanButtonText}>Tap to Scan Next Item</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return null;
}

// 🔹 **Styles**
const styles = StyleSheet.create({
  label: {
    fontSize: 30, // Increased text size
    fontWeight: "bold", // Make it stand out
    marginRight: 15, // Add spacing from the switch
  },
  switchContainer: {
    transform: [{ scale: 2.5 }], // Scale up the switch size
  },
  safeContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
  },
  instructionText: {
    fontSize: 25,
  },
  header: {
    width: "100%",
    backgroundColor: "black",
    paddingVertical: 15,
    alignItems: "center",
  },
  headerText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },

  container: {
    width: "90%",
    alignItems: "center",
    paddingVertical: 20,
  },

  instructionBox: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },

  list: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E0E0E0",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginVertical: 8,
    marginBottom: 15, // Adjust spacing for better readability
  },

  scanButton: {
    backgroundColor: "black",
    paddingVertical: 130,
    paddingHorizontal: 100,
    borderRadius: 10,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },

  scanButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },

  cameraContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },

  cameraText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },

  scanningText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
  },

  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },

  resultText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },

  ingredientBox: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },

  ingredientText: {
    fontSize: 18, 
    fontWeight: "bold",
    color: "black", 
    textAlign: "center",
    marginVertical: 10,
  },  

  nextScanButton: {
    backgroundColor: "black",
    paddingVertical: 130,
    width: "100%",
    alignItems: "center",
  },

  nextScanButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },

  alternativeButton: {
    backgroundColor: "black",
    paddingVertical: 130,
    paddingHorizontal: 20,
    alignItems: "center",
    width: "100%",
  },

  alternativeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },

  alternativeContainer: {
    flex: 1,
    justifyContent: "center",
    width: "90%",
  },

  alternativeText: {
    fontSize: 35,
  },

  largeNextScanButton: {
    backgroundColor: "black",
    paddingVertical: 100,
    width: "100%",
    alignItems: "center",
  },

  alternativeList: {
    marginTop: 10,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    alignItems: "flex-start",
    width: "90%",
  },

  alternativeItem: {
    fontSize: 18,
    paddingVertical: 5,
  },
  buttonItem: {
    width: 400,
    height: 60,
    paddingVertical: 8,
    paddingHorizontal: 50,
    borderRadius: 10,
    marginVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "black",
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

  overlayContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "100%",
    padding: 20,
    alignItems: "flex-end",
  },
  
  iconButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 50,
    padding: 10,
  },  

  productImage: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginBottom: 10,
  },
  
  productTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  
  productBrand: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
  
  productBarcode: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 10,
  },  

  ingredientItem: {
    fontSize: 16,  
    fontWeight: "500",  
    color: "#D33",       
    textAlign: "center", 
    marginTop: 5,
    paddingVertical: 4,  
    backgroundColor: "#FFF5F5", 
    borderRadius: 5,    
    overflow: "hidden",  
    paddingHorizontal: 10,
  },  
});
