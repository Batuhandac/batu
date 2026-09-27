import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
// Yalnızca kullanılan kesimler (paket kökünden almak bütün kalınlıkları uygulamaya ekler)
import { Baloo2_600SemiBold } from '@expo-google-fonts/baloo-2/600SemiBold';
import { Baloo2_700Bold } from '@expo-google-fonts/baloo-2/700Bold';
import { Nunito_500Medium } from '@expo-google-fonts/nunito/500Medium';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useOnboardingStore } from '@/stores/onboarding';
import { useSession } from '@/stores/session';
import { track } from '@/lib/analytics';
import { useTheme } from '@/lib/theme';
import { LogoMark, ToastHost } from '@/components/ds';

const HANDLED_KEY = 'patisos:handled_notification';

// Bildirime dokununca ilgili ekranı aç: "Kliniği aradın mı?" → geri bildirim sorusu,
// yeni mesaj → konuşma. Son bildirim yanıtı her açılışta yeniden döndüğü için
// işlenenleri hatırla.
async function openNotification(response: Notifications.NotificationResponse | null) {
  if (!response) return;
  const data = response.notification.request.content.data as
    | { type?: string; clinicId?: string; conversationId?: string; petId?: string }
    | undefined;
  const key = response.notification.request.identifier;
  try {
    if ((await AsyncStorage.getItem(HANDLED_KEY)) === key) return;
    await AsyncStorage.setItem(HANDLED_KEY, key);
  } catch {}
  if (data?.type === 'call_feedback' && data.clinicId) {
    router.push({ pathname: '/clinic/[id]', params: { id: data.clinicId, feedback: '1' } });
  } else if (data?.type === 'message' && data.conversationId) {
    router.push({ pathname: '/messages/[id]', params: { id: data.conversationId } });
  } else if (data?.type === 'care' && data.petId) {
    router.push({ pathname: '/pets/[id]', params: { id: data.petId } });
  }
}

export default function RootLayout() {
  const t = useTheme();
  const { load, hydrated, completed } = useOnboardingStore();
  const [fontsLoaded, fontError] = useFonts({
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    ...Ionicons.font,
  });

  useEffect(() => {
    load();
    useSession.getState().init();
    track('app_open');
    const sub = Notifications.addNotificationResponseReceivedListener(openNotification);
    return () => sub.remove();
  }, []);

  // Uygulama kapalıyken bildirime dokunulduysa, açılış tamamlanınca yönlendir
  useEffect(() => {
    if (!hydrated || !completed) return;
    Notifications.getLastNotificationResponseAsync()
      .then((r) => setTimeout(() => openNotification(r), 300))
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
        <Stack.Screen name="map" options={{ presentation: 'card' }} />
        <Stack.Screen name="community/ask" options={{ presentation: 'modal' }} />
        <Stack.Screen name="community/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="messages/index" options={{ presentation: 'card' }} />
        <Stack.Screen name="messages/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="vet/index" options={{ presentation: 'card' }} />
        <Stack.Screen name="auth/index" options={{ presentation: 'card', gestureEnabled: false }} />
        <Stack.Screen name="auth/owner" options={{ presentation: 'card' }} />
        <Stack.Screen name="auth/vet" options={{ presentation: 'card' }} />
        <Stack.Screen name="account/index" options={{ presentation: 'card' }} />
        <Stack.Screen name="care/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="karne" options={{ presentation: 'card' }} />
      </Stack>
      <ToastHost />
    </GestureHandlerRootView>
  );
}
