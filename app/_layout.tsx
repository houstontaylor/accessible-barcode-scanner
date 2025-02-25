import { useState } from "react";
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { useColorScheme } from "@/hooks/useColorScheme";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const [currentScreen, setCurrentScreen] = useState("dietaryRestrictions");
  const [scanCount, setScanCount] = useState(0);
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

  if (!loaded) {
    return null;
  }

  // 📌 **Ensure Custom Screens Load Before the Default Expo Router**
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
            style={styles.button}
            onPress={() => setCurrentScreen("camera")}
          >
            <Text style={styles.buttonText}>BEGIN SCAN</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 📸 **Camera Placeholder Screen**
  if (currentScreen === "camera") {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Scan Barcode</Text>
        </View>

        <View style={styles.cameraContainer}>
          <Text style={styles.cameraText}>📷 Placeholder Camera Screen 📷</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setScanCount(scanCount + 1);
            setCurrentScreen("scanResult");
          }}
        >
          <Text style={styles.buttonText}>Simulate Scan</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 🛑 **Scan Result Screen**
  if (currentScreen === "scanResult") {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Scan Barcode</Text>
        </View>

        <View
          style={[
            styles.alertBox,
            { backgroundColor: isSafeScan ? "#90EE90" : "#F08080" },
          ]}
        >
          <Text style={styles.alertText}>
            {isSafeScan ? "SAFE TO CONSUME" : "CANNOT CONSUME"}
          </Text>
        </View>

        <Image
          source={{
            uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/UPC-A.svg/320px-UPC-A.svg.png",
          }}
          style={styles.barcodeImage}
        />

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

        <TouchableOpacity
          style={styles.darkButton}
          onPress={() => setCurrentScreen("camera")}
        >
          <Text style={styles.darkButtonText}>Scan Next Item</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return null; // 🔥 **This prevents Expo Router from overriding your screens**
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#C0C0C0",
    alignItems: "center",
    paddingTop: 20,
  },

  // 🔹 HEADER STYLING (Consistent Across All Pages)
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

  // 🔹 DIETARY RESTRICTIONS PAGE STYLES
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
    marginBottom: 15,
  },
  instructionText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },

  list: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E0E0E0", // Light gray box for each item
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginVertical: 8, // Adds spacing between items
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
  },

  button: {
    backgroundColor: "white",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 20,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },

  // 🔹 CAMERA PLACEHOLDER PAGE STYLES
  cameraContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  cameraText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40, // Added space below text
  },

  // 🔹 SCAN RESULT PAGE STYLES
  alertBox: {
    backgroundColor: "#F08080",
    padding: 15,
    borderRadius: 10,
    width: "90%",
    alignItems: "center",
    marginVertical: 15,
    justifyContent: "center",
  },
  alertText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "black",
  },

  ingredientBox: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    width: "90%",
    alignItems: "center",
    marginVertical: 10,
  },
  ingredientText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  ingredientItem: {
    fontSize: 16,
    color: "black",
    marginTop: 5,
  },

  darkButton: {
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
  },
  darkButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
});
