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
  AccessibilityInfo,
  Vibration,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useColorScheme } from "@/hooks/useColorScheme";
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TapGestureHandler, State, HandlerStateChangeEvent, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';
import axios from "axios";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const [currentScreen, setCurrentScreen] = useState("dietaryRestrictions");
  const goToCameraScreen = () => {
    setScanStatus("idle"); // Reset scanning state
    setScannedProduct(null); // Clear last scanned product
    setScanResult(null); // Clear last scan result
    setErrorMessage(null); // Clear any error messages
    setCurrentScreen("camera");
  };
  
  interface DietaryRestrictions {
    Eggs: boolean;
    Milk: boolean;
    Peanuts: boolean;
    Almonds: boolean;
  }

  const [restrictions, setRestrictions] = useState<DietaryRestrictions>({
    Eggs: false,
    Milk: false,
    Peanuts: true,
    Almonds: false,
  });  

  const [scanResult, setScanResult] = useState<{ isSafe: boolean; detectedIngredients: string[] } | null>(null);
  const [alternativeItems, setAlternativeItems] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
        setScanStatus("scanned");
        setCurrentScreen("scanResult");
      }, 3000);
    }
  }, [scanStatus, currentScreen]);  

  // play sound effect when camera facing is flipped
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

  useEffect(() => {
    if (errorMessage) {
      AccessibilityInfo.announceForAccessibility(errorMessage);
  
      // Auto-hide error message after 4 seconds
      setTimeout(() => setErrorMessage(null), 4000);
    }
  }, [errorMessage]);

  const fetchAlternatives = async (productTitle: string) => {
    setAlternativeItems([]); // Clear previous results
  
    const apiKey: string | undefined = process.env.OPENAI_API_KEY;
    const restrictedIngredients: string = Object.keys(restrictions)
      .filter((key) => restrictions[key as keyof DietaryRestrictions])
      .join(", ");
  
    const prompt: string = `Given this item - ${productTitle} - can you give me a list of just the five most similar items that do not contain ${restrictedIngredients}?`;
  
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 100,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
  
      const resultText: string = response.data.choices[0]?.message?.content || "";
      const fetchedItems: string[] = resultText
        .split("\n")
        .map((item) => item.replace(/^•\s*/, "").trim())
        .filter((item) => item.length > 0);
  
      setAlternativeItems(fetchedItems);
    } catch (error) {
      console.error("Failed to fetch alternative items:", error);
      setAlternativeItems(["Error fetching alternatives. Please try again."]);
    }
  };

  // call api when bacode scanned
  const convertUPCEtoUPCA = (upce: string): string => {
    if (upce.length !== 8) throw new Error("Invalid UPC-E format");
  
    // Convert UPC-E (compressed) to UPC-A (expanded)
    return "0" + upce.substring(0, 6) + "0000" + upce[6] + upce[7];
  };
  
  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanStatus !== "idle") return;
  
    setScanStatus("scanning");
    AccessibilityInfo.announceForAccessibility("Scanning in progress...");
  
    try {
      // Use the barcode as-is, unless it's UPC-E (8 digits), which we convert to UPC-A (12 digits)
      const formattedBarcode = data.length === 8 ? convertUPCEtoUPCA(data) : data;
      console.log("Formatted Barcode:", formattedBarcode);
  
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // API call to Open Food Facts
      const response = await axios.get(
        `https://world.openfoodfacts.org/api/v2/product/${formattedBarcode}.json`,
        {
          headers: {
            "User-Agent": "YourAppName - YourContactInfo",
          },
        }
      );
  
      // Check if product was found
      if (!response.data || response.data.status !== 1) {
        throw new Error("No product found.");
      }
  
      const product = response.data.product;
  
      const title = product.product_name || "Unknown Product";
      const brand = product.brands || "Unknown Brand";
      const image = product.image_url || null;
      const ingredientsList = product.ingredients_text ? product.ingredients_text.split(", ") : [];
  
      console.log("Product Data:", { title, brand, ingredientsList });
  
      // Check for restricted ingredients
      const detectedIngredients = ingredientsList.filter((ingredient: string) => {
        const formattedIngredient = ingredient.trim().toLowerCase();
        return (Object.keys(restrictions) as (keyof DietaryRestrictions)[]).some(
          (restriction) => {
            const formattedRestriction = restriction.trim().toLowerCase();
            return (
              restrictions[restriction] &&
              (formattedIngredient.includes(formattedRestriction) ||
                formattedIngredient.startsWith(formattedRestriction) ||
                formattedIngredient.endsWith(formattedRestriction))
            );
          }
        );
      });
  
      // Update state with scanned product details
      setScannedProduct({
        barcode: formattedBarcode,
        title,
        brand,
        ingredients: ingredientsList.join(", ") || "Not listed",
        image,
      });
  
      setScanResult({
        isSafe: detectedIngredients.length === 0,
        detectedIngredients,
      });
  
      // Provide accessibility feedback
      if (detectedIngredients.length === 0) {
        AccessibilityInfo.announceForAccessibility("Product is safe to consume.");
      } else {
        Vibration.vibrate([0, 500, 200, 500]);
        AccessibilityInfo.announceForAccessibility(
          `Caution: This item contains ${detectedIngredients.join(", ")} from your restricted list.`
        );
  
        await fetchAlternatives(title);
      }
  
      setScanStatus("scanned");
      setCurrentScreen("scanResult");
    } catch (error) {
      console.error("Error fetching product:", error);
      Vibration.vibrate(1000);
      setErrorMessage("Failed to fetch product data. Please try again.");
      setScanStatus("idle");
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
            {(Object.keys(restrictions) as (keyof DietaryRestrictions)[]).map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.buttonItem,
                  {
                    backgroundColor: restrictions[item] ? "#4CAF50" : "#E0E0E0",
                  }, // Green if selected, Gray otherwise
                ]}
                onPress={() =>
                  setRestrictions((prev) => ({
                    ...prev,
                    [item]: !prev[item], // ✅ Fixes TypeScript error
                  }))
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
                style={StyleSheet.absoluteFill}
                facing={facing}
                onBarcodeScanned={scanStatus === "idle" ? handleBarcodeScanned : undefined}
              >
                {errorMessage && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText} accessibilityLiveRegion="polite">
                      {errorMessage}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setErrorMessage(null)}
                      style={styles.dismissErrorButton}
                      accessibilityLabel="Dismiss error"
                    >
                      <Text style={styles.dismissErrorText}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
    if (!scanResult) return null;
  
    return (
      <SafeAreaView
        style={[
          styles.safeContainer,
          { backgroundColor: scanResult.isSafe ? "#90EE90" : "#F08080" },
        ]}
      >
        <View style={styles.resultContainer}>
          <Text
            style={[
              styles.resultText,
              { backgroundColor: scanResult.isSafe ? "#4CAF50" : "#D33" },
            ]}
          >
            {scanResult.isSafe ? "SAFE TO CONSUME" : "CANNOT CONSUME"}
          </Text>
  
          {!scanResult.isSafe && (
            <View style={styles.ingredientBox}>
              <Text style={styles.ingredientText}>
                This item contains the following ingredient(s) from your list:
              </Text>
              {scanResult.detectedIngredients.map((item, index) => (
                <Text key={index} style={styles.ingredientItem}>
                  • {item}
                </Text>
              ))}
            </View>
          )}
        </View>
  
        <TouchableOpacity
          style={styles.nextScanButton}
          onPress={goToCameraScreen}
        >
          <Text style={styles.nextScanButtonText}>Tap to Scan Next Item</Text>
        </TouchableOpacity>
        {!scanResult.isSafe && (
          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={() => setCurrentScreen("alternativeItems")}
          >
            <Text style={styles.alternativeButtonText}>See Alternative Options</Text>
          </TouchableOpacity>
        )}

      </SafeAreaView>
    );
  }  

  if (currentScreen === "alternativeItems") {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Alternative Items</Text>
        </View>
  
        <View style={styles.alternativeContainer}>
          {alternativeItems.length === 0 ? (
            <ActivityIndicator size="large" color="black" />
          ) : (
            <Text style={styles.alternativeText}>
              Alternative Items: {alternativeItems.join(", ")}
            </Text>
          )}
        </View>
  
        <TouchableOpacity
          style={styles.largeNextScanButton}
          onPress={goToCameraScreen}
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

  errorBanner: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 0, 0, 0.8)",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  
  errorText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },  

  dismissErrorButton: {
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 15,
    backgroundColor: "white",
    borderRadius: 5,
  },
  
  dismissErrorText: {
    color: "black",
    fontSize: 14,
    fontWeight: "bold",
  },
  
});
