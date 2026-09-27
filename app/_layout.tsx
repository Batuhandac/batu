import '../global.css';
import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingStore } from '@/stores/onboarding';
import { track } from '@/lib/analytics';

const HANDLED_KEY = 'patisos:handled_notification';

// "Kliniği aradın mı?" bildirimine dokununca o kliniğin geri bildirim sorusunu aç.
// Son bildirim yanıtı her açılışta yeniden döndüğü için işlenenleri hatırla.
async function openFeedback(response: Notifications.NotificationResponse | null) {
  if (!response) return;
  const data = response.notification.request.content.data as { type?: string; clinicId?: string } | undefined;
  if (data?.type !== 'call_feedback' || !data.clinicId) return;
  const key = response.notification.request.identifier;
  try {
    if ((await AsyncStorage.getItem(HANDLED_KEY)) === key) return;
    await AsyncStorage.setItem(HANDLED_KEY, key);
  } catch {}
  router.push({ pathname: '/clinic/[id]', params: { id: data.clinicId, feedback: '1' } });
}

export default function RootLayout() {
  const { load, hydrated, completed } = useOnboardingStore();

  useEffect(() => {
    load();
    track('app_open');
    const sub = Notifications.addNotificationResponseReceivedListener(openFeedback);
    return () => sub.remove();
  }, []);

  // Uygulama kapalıyken bildirime dokunulduysa, açılış tamamlanınca yönlendir
  useEffect(() => {
    if (!hydrated || !completed) return;
    Notifications.getLastNotificationResponseAsync()
      .then((r) => setTimeout(() => openFeedback(r), 300))
      .catch(() => {});
  }, [hydrated, completed]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#131315' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="emergency" options={{ presentation: 'fullScreenModal', animation: 'fade_from_bottom' }} />
        <Stack.Screen name="vets" options={{ presentation: 'card' }} />
        <Stack.Screen name="clinic/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="clinic/[id]/report" options={{ presentation: 'modal' }} />
        <Stack.Screen name="clinic/[id]/claim" options={{ presentation: 'modal' }} />
        <Stack.Screen name="pets/create" options={{ presentation: 'modal' }} />
        <Stack.Screen name="pets/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
