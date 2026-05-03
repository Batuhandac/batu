import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export default function RootLayout() {
  const { setSession, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      useAuthStore.setState({ initialized: true });
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session) fetchProfile();
      })
      .catch(() => {})
      .finally(() => {
        useAuthStore.setState({ initialized: true });
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile();
      else useAuthStore.setState({ profile: null });
    });

    return () => listener.subscription.unsubscribe();
  }, [setSession, fetchProfile]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="request-details" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(main)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
