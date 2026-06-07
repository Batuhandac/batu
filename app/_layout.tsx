import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useOnboardingStore } from '@/stores/onboarding';
import { track } from '@/lib/analytics';
import * as Notifications from 'expo-notifications';

export default function RootLayout() {
  const { load } = useOnboardingStore();

  useEffect(() => {
    load();
    track('app_open');
    Notifications.addNotificationResponseReceivedListener(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0D1B2A' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="clinic/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="clinic/[id]/report" options={{ presentation: 'modal' }} />
        <Stack.Screen name="clinic/[id]/claim" options={{ presentation: 'modal' }} />
        <Stack.Screen name="pets/create" options={{ presentation: 'modal' }} />
        <Stack.Screen name="pets/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
