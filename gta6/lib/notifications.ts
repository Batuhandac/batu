import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Lang, GamePlatform } from '@/types';

/**
 * Push registration. expo-notifications is loaded lazily so the web bundle and
 * Expo Go (which dropped remote push in SDK 53+) never crash on import.
 */
export async function registerForPush(lang: Lang, platform: GamePlatform | null): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const Notifications = await import('expo-notifications');
    const Device = await import('expo-device');
    if (!Device.isDevice) return null;

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const projectId: string | undefined =
      Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId;
    if (!projectId) return null;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    if (isSupabaseConfigured) {
      await supabase.from('push_tokens').upsert(
        { token, lang, platform, os: Platform.OS, updated_at: new Date().toISOString() },
        { onConflict: 'token' },
      );
    }
    return token;
  } catch {
    return null;
  }
}

export async function unregisterPush(token: string | null) {
  if (!token || !isSupabaseConfigured) return;
  try {
    await supabase.from('push_tokens').delete().eq('token', token);
  } catch {
    /* best effort */
  }
}
