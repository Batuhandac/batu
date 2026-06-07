import { PostHog } from 'posthog-react-native';
import { supabase } from './supabase';

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
  | 'report_submitted' | 'claim_submitted' | 'favorite_added';

interface EventProps {
  clinic_id?: string;
  pet_id?: string;
  [key: string]: unknown;
}

export async function track(event: EventName, props: EventProps = {}) {
  posthog.capture(event, props);
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
}
