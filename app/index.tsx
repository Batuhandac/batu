import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Root() {
  const { session, initialized } = useAuthStore();

  if (!initialized) return null;
  return <Redirect href={session ? '/(main)/' : '/(auth)/'} />;
}
