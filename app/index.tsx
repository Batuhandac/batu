import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';

export default function Entry() {
  const { completed, hydrated } = useOnboardingStore();

  // AsyncStorage okunana kadar bekle — yoksa her açılışta onboarding'e atar
  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D1B2A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#E53E3E" size="large" />
      </View>
    );
  }

  if (completed) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(onboarding)/welcome" />;
}
