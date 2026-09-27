// Uzak bildirimler (Expo Push). Sunucu olmadan çalışır: mesajı gönderen cihaz,
// alıcının Expo push jetonuna doğrudan bildirim yollar. Jetonlar yalnızca
// konuşmanın taraflarının okuyabildiği belgelerde saklanır (firestore.rules).
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

let cachedToken: string | null = null;

/** İzin ister ve bu cihazın Expo push jetonunu döner (web'de ya da izin yoksa null). */
export async function registerForPush(askPermission = true): Promise<string | null> {
  if (cachedToken) return cachedToken;
  if (Platform.OS === 'web') return null;
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted' && askPermission) status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return null;
    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) return null;
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    cachedToken = data;
    return data;
  } catch {
    return null;
  }
}

export async function sendPush(
  tokens: (string | null | undefined)[],
  title: string,
  body: string,
  data: Record<string, string>
): Promise<void> {
  const to = [...new Set(tokens.filter((t): t is string => !!t && t.startsWith('ExponentPushToken')))];
  if (to.length === 0) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(to.map((t) => ({ to: t, title, body: body.slice(0, 180), data, sound: 'default' }))),
    });
  } catch {
    // Bildirim en iyi çaba ile gönderilir; mesaj zaten kaydedildi.
  }
}
