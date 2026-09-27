import { router, useLocalSearchParams } from 'expo-router';
import { useOnboardingStore } from '@/stores/onboarding';

/**
 * Giriş ekranlarından sonra nereye gidileceği:
 * - Tanıtımdan geldiyse konum iznine (hekimler doğrudan hekim paneline)
 * - Uygulama içinden geldiyse hesap sayfasına
 */
export function useAuthFlow() {
  const { from, mode } = useLocalSearchParams<{ from?: string; mode?: string }>();
  const onboarding = from === 'onboarding';
  const setCompleted = useOnboardingStore((s) => s.setCompleted);

  const continueAsGuest = () => {
    if (onboarding) router.replace('/(onboarding)/location');
    else if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const done = (role: 'owner' | 'vet') => {
    if (role === 'vet') {
      if (onboarding) setCompleted(true);
      router.replace('/vet');
      return;
    }
    if (onboarding) router.replace('/(onboarding)/location');
    else router.replace('/account');
  };

  return { onboarding, from, initialMode: mode === 'signin' ? ('signin' as const) : ('signup' as const), continueAsGuest, done };
}
