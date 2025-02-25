import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Tabs, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  useEffect(() => {
    const checkSetupStatus = async () => {
      const setupComplete = await AsyncStorage.getItem('setupComplete');
      setIsSetupComplete(setupComplete === 'true');
    };

    checkSetupStatus();
  }, []);

  if (!isSetupComplete) {
    return (
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="grocery-list"
        options={{
          title: 'Grocery List',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="camera.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dietary Restrictions',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
        }}
      />
    </Tabs>
  );
}