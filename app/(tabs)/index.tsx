import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const [restrictions, setRestrictions] = useState({
    Eggs: false,
    Milk: false,
    Peanuts: true,
    Almonds: false,
  });

  const handleBeginScan = async () => {
    // Save dietary restrictions to AsyncStorage
    await AsyncStorage.setItem('dietaryRestrictions', JSON.stringify(restrictions));
    await AsyncStorage.setItem('setupComplete', 'true');
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Dietary Restrictions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}>
            This is where you highlight the items that you want our product to look out for in its AI analysis.
          </Text>
        </View>

        <View style={styles.list}>
          {Object.keys(restrictions).map((item) => (
            <View key={item} style={styles.item}>
              <Switch
                value={restrictions[item as keyof typeof restrictions]}
                onValueChange={() =>
                  setRestrictions({
                    ...restrictions,
                    [item as keyof typeof restrictions]: !restrictions[item as keyof typeof restrictions],
                  })
                }
                trackColor={{ false: '#D33', true: '#4CAF50' }}
              />
              <Text style={styles.label}>{item}</Text>
            </View>
          ))}
        </View>

        <Link href="/(tabs)/scanner" style={styles.button} onPress={handleBeginScan}>
          <Text style={styles.buttonText}>BEGIN SCAN</Text>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#C0C0C0',
    alignItems: 'center',
    paddingTop: 20,
  },
  header: {
    width: '100%',
    backgroundColor: 'black',
    paddingVertical: 15,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  container: {
    width: '90%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  instructionBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  instructionText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginVertical: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 20,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});