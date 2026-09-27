import { PostHog } from 'posthog-react-native';
import { supabase, isSupabaseConfigured } from './supabase';

export const posthog = new PostHog(
  process.env.EXPO_PUBLIC_POSTHOG_KEY ?? 'phc_placeholder',
  { host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com' }
);

type EventName =
  | 'app_open' | 'location_granted' | 'location_denied'
  | 'emergency_cta_tap' | 'clinic_list_view' | 'clinic_detail_view'
  | 'call_tap' | 'directions_tap' | 'directions_interstitial_shown'
  | 'directions_confirmed' | 'open_ping_submitted' | 'pet_card_created'
  | 'pet_card_field_filled' | 'pet_card_shared' | 'feedback_submitted'
  | 'report_submitted' | 'claim_submitted' | 'favorite_added'
  | 'community_clinic_added' | 'review_added' | 'clinic_photo_added'
  | 'banner_tap' | 'question_posted' | 'answer_posted' | 'message_sent'
  | 'conversation_started' | 'whatsapp_tap' | 'vet_login' | 'review_reply';

interface EventProps {
  clinic_id?: string;
  pet_id?: string;
  [key: string]: string | number | boolean | null | undefined;
}

// Çağıranlar (ACİL butonu, Ara butonu) bunu await ediyor — ağ isteği arka planda
// kalmalı ki analitik yüzünden arama/gezinme gecikmesin.
export async function track(event: EventName, props: EventProps = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  posthog.capture(event, props as any);
  if (!isSupabaseConfigured) return;
  void (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('user_events').insert({
        user_id: user?.id ?? null,
        event_name: event,
        clinic_id: props.clinic_id ?? null,
        pet_id: props.pet_id ?? null,
        props,
      });
    } catch {
      // non-critical
    }
  })();
}
