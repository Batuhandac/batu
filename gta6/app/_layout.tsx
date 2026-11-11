import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { useContent } from '@/stores/contentStore';
import { hydrateSettings } from '@/stores/settingsStore';

export default function RootLayout() {
  const refresh = useContent((s) => s.refresh);
  const router = useRouter();

  useEffect(() => {
    hydrateSettings().then(refresh);
  }, [refresh]);

  // Deep-link from a push payload { href: '/cheat/slug' } into the matching screen.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let unsub: (() => void) | undefined;
    import('expo-notifications')
      .then((N) => {
        const sub = N.addNotificationResponseReceivedListener((resp) => {
          const href = resp.notification.request.content.data?.href;
          if (typeof href === 'string' && href.startsWith('/')) {
            refresh();
            router.push(href as never);
          }
        });
        unsub = () => sub.remove();
      })
      .catch(() => {});
    return () => unsub?.();
  }, [router, refresh]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="cheat/[slug]" />
          <Stack.Screen name="mission/[slug]" />
          <Stack.Screen name="guide/[slug]" />
          <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          <Stack.Screen name="legal" options={{ presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
