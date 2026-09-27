import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';

export default function Entry() {
  const { completed, hydrated } = useOnboardingStore();

  // AsyncStorage okunana kadar bekle — yoksa her açılışta onboarding'e atar
  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#131315', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#ff7f1c" size="large" />
      </View>
    );
  }

  if (completed) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(onboarding)/welcome" />;
}
