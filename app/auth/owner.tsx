import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Header } from '@/components/ds';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuthFlow } from '@/lib/hooks/useAuthFlow';

export default function OwnerAuthScreen() {
  const { initialMode, done } = useAuthFlow();
  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header
        title="Evcil hayvan sahibi"
        subtitle="Acil kartların yedeklenir, soruların ve mesajların tek hesapta toplanır."
        onBack={() => router.back()}
      />
      <View style={{ paddingHorizontal: 20 }}>
        <AuthForm role="owner" initialMode={initialMode} onDone={() => done('owner')} />
      </View>
    </Screen>
  );
}
