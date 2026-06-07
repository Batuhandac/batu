import { Redirect } from 'expo-router';
import { useOnboardingStore } from '@/stores/onboarding';

export default function Entry() {
  const { completed } = useOnboardingStore();
  if (completed) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(onboarding)/welcome" />;
}
