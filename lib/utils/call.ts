import { Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { track } from '@/lib/analytics';
import { scheduleCallFeedback } from '@/lib/notifications';

/** tel: URL'inde boşluk/parantez geçersiz — "(0312) 000 00 00" → "03120000000" */
export function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/**
 * Kliniği hemen arar. Arama hiçbir şeyi beklemez: analitik arka planda,
 * geri bildirim bildirimi (ilk seferde izin penceresi açar) aramadan sonra.
 */
export async function callClinic(c: { id: string; name: string; phone: string | null }, via?: string) {
  if (!c.phone) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  track('call_tap', { clinic_id: c.id, via: via ?? null });
  await Linking.openURL(telUrl(c.phone)).catch(() => {});
  scheduleCallFeedback(c.id, c.name).catch(() => {});
}
