import '../global.css';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useOnboardingStore } from '@/stores/onboarding';
import { track } from '@/lib/analytics';
import { useTheme } from '@/lib/theme';
import { LogoMark } from '@/components/ds';

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
  const t = useTheme();
  const { load, hydrated, completed } = useOnboardingStore();
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    ...Ionicons.font,
  });

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

  // Yazı tipleri yüklenene kadar markalı bekleme (hata olursa sistem fontuyla devam)
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <LogoMark size={72} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="emergency" options={{ presentation: 'fullScreenModal', animation: 'fade_from_bottom' }} />
        <Stack.Screen name="first-aid" options={{ presentation: 'card' }} />
        <Stack.Screen name="vets" options={{ presentation: 'card' }} />
        <Stack.Screen name="clinic/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="clinic/[id]/report" options={{ presentation: 'modal' }} />
        <Stack.Screen name="clinic/[id]/claim" options={{ presentation: 'modal' }} />
        <Stack.Screen name="clinic/add" options={{ presentation: 'modal' }} />
        <Stack.Screen name="pets/create" options={{ presentation: 'modal' }} />
        <Stack.Screen name="pets/[id]" options={{ presentation: 'card' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
