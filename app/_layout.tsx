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
import { useFonts } from "expo-font";
import { useColorScheme } from "@/hooks/useColorScheme";
import axios from "axios";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  interface DietaryRestrictions {
    Eggs: boolean;
    Milk: boolean;
    Peanuts: boolean;
    Almonds: boolean;
  }
  
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const [currentScreen, setCurrentScreen] = useState("dietaryRestrictions");
  const [scanCount, setScanCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [itemName, setItemName] = useState("Peanut Butter");
  const [restrictions, setRestrictions] = useState<DietaryRestrictions>({
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
      setTimeout(() => {
        setScanCount((prev) => prev + 1);
        setIsScanning(false);
        setCurrentScreen("scanResult");
      }, 3000); // Simulate a 3-second scan
    }
  }, [isScanning, currentScreen]);

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

  // 📸 **Fake Camera Scanning Screen**
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

        {!isScanning && (
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setCurrentScreen("dietaryRestrictions")}
          >
            <Text style={styles.scanButtonText}>Back</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  // 🛑 **Scan Result Screen**
  if (currentScreen === "scanResult") {
    return (
      <SafeAreaView
        style={[
          styles.safeContainer,
          { backgroundColor: isSafeScan ? "#90EE90" : "#F08080" },
        ]}
      >
        <TouchableOpacity
        style={styles.alternativeButton}
        onPress={() => setCurrentScreen("alternativeItems")}
      >
        <Text style={styles.alternativeButtonText}>Tap to see alternative items</Text>
      </TouchableOpacity>
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
          <Text style={styles.nextScanButtonText}>Tap to Scan Next Item</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (currentScreen === "alternativeItems") {
    const [alternativeItems, setAlternativeItems] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    //const alternativeItems = ["Sunflower Butter", "Almond Butter", "Soy Butter"];

    useEffect(() => {
      const fetchAlternatives = async () => {
        setLoading(true);
        setError(null);
  
        const apiKey: string | undefined = process.env.OPENAI_API_KEY;
        const restrictedIngredients: string = Object.keys(restrictions)
          .filter((key) => restrictions[key as keyof DietaryRestrictions])
          .join(", ");
  
        const prompt: string = `Given this item - ${itemName} - can you give me a list of just the five most similar items that do not contain ${restrictedIngredients}?`;
  
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
          setError("Failed to fetch alternative items.");
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchAlternatives();
    }, []);
  
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Alternative Items</Text>
        </View>
  
        <View style={styles.alternativeContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="black" />
          ) : error ? (
            <Text style={styles.alternativeText}>{error}</Text>
          ) : (
            <Text style={styles.alternativeText}>
              Alternative Items: {alternativeItems.join(", ")}
            </Text>
          )}
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
    paddingVertical: 100,
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
    paddingVertical: 100,
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
  
});
