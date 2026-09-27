import React from 'react';
import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';
import { useTheme } from '@/lib/theme';
import { LogoMark } from '@/components/ds';

export default function Entry() {
  const t = useTheme();
  const { completed, hydrated } = useOnboardingStore();

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
