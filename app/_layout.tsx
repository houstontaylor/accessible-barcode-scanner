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
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as Haptics from "expo-haptics";
import { useFonts } from "expo-font";
import { useColorScheme } from "@/hooks/useColorScheme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const [currentScreen, setCurrentScreen] = useState("dietaryRestrictions");
  const [scanCount, setScanCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [restrictions, setRestrictions] = useState({
    Eggs: false,
    Milk: false,
    Peanuts: true,
    Almonds: false,
  });

  const isSafeScan = scanCount % 2 === 0;
  const detectedIngredients = isSafeScan ? [] : ["Peanuts"];

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (currentScreen === "camera" && isScanning) {
      let scanInterval = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 800);

      setTimeout(() => {
        clearInterval(scanInterval);
        setScanCount((prev) => prev + 1);
        setIsScanning(false);
        setCurrentScreen("scanResult");
      }, 3000);

      return () => clearInterval(scanInterval);
    }
  }, [isScanning, currentScreen]);

  useEffect(() => {
    if (currentScreen === "scanResult") {
      if (!isSafeScan) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 200);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 400);
      }
    }
  }, [currentScreen]);

  if (!loaded) {
    return null;
  }

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
              <View key={item} style={styles.item}>
                <Switch
                  value={restrictions[item]}
                  onValueChange={() =>
                    setRestrictions({
                      ...restrictions,
                      [item]: !restrictions[item],
                    })
                  }
                  trackColor={{ false: "#D33", true: "#4CAF50" }}
                />
                <Text style={styles.label}>{item}</Text>
              </View>
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

  if (currentScreen === "camera") {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Scan Barcode</Text>
        </View>

        <View style={styles.cameraContainer}>
          <Text style={styles.cameraText}>📸 Scanning Screen 📸</Text>
          {!isScanning ? (
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => setIsScanning(true)}
            >
              <Text style={styles.scanButtonText}>Start Scan</Text>
            </TouchableOpacity>
          ) : (
            <>
              <ActivityIndicator size="large" color="black" />
              <Text style={styles.scanningText}>Scanning...</Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (currentScreen === "scanResult") {
    return (
      <SafeAreaView
        style={[
          styles.safeContainer,
          { backgroundColor: isSafeScan ? "#90EE90" : "#F08080" },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>Scan Barcode</Text>
        </View>

        <View style={styles.resultContainer}>
          <Text
            style={[
              styles.resultText,
              { backgroundColor: isSafeScan ? "#4CAF50" : "#D33" },
            ]}
          >
            {isSafeScan ? "SAFE TO CONSUME" : "CANNOT CONSUME"}
          </Text>
          {!isSafeScan && (
            <View style={styles.ingredientBox}>
              <Text style={styles.ingredientText}>
                This item contains the following ingredient from your list:
              </Text>
              {detectedIngredients.map((item, index) => (
                <Text key={index} style={styles.ingredientItem}>
                  • {item}
                </Text>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.nextScanButton}
          onPress={() => setCurrentScreen("camera")}
        >
          <Text style={styles.nextScanButtonText}>Scan Next Item</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return null;
}

// 🔹 **Styles**
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
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
  },

  scanButton: {
    backgroundColor: "black",
    paddingVertical: 15,
    paddingHorizontal: 100,
    borderRadius: 10,
    marginTop: 20,
    width: "90%",
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

  nextScanButton: {
    backgroundColor: "black",
    paddingVertical: 20,
    width: "100%",
    alignItems: "center",
  },

  nextScanButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
});
