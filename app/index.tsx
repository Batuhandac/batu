import React from 'react';
import { Redirect } from 'expo-router';
import { Platform, View } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';
import { useTheme } from '@/lib/theme';
import { LogoMark } from '@/components/ds';

export default function Entry() {
  const t = useTheme();
  const { completed, hydrated } = useOnboardingStore();

  // Web derlemesi yalnızca hekim paneli için yayınlanır
  if (Platform.OS === 'web') return <Redirect href="/panel" />;

  // AsyncStorage okunana kadar bekle — yoksa her açılışta tanıtıma atar
  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <LogoMark size={72} />
      </View>
    );
  }

  if (completed) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(onboarding)/welcome" />;
}
