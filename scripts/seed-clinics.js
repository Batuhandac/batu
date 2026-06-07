#!/usr/bin/env node
/**
 * Pati SOS — Seed Script
 * Pulls Ankara vet clinics from Google Places API and upserts into Supabase.
 * Requires: GOOGLE_MAPS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in env.
 *
 * Usage: node scripts/seed-clinics.js
 */
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GOOGLE_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing env vars: GOOGLE_MAPS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DISTRICTS = [
  { name: 'Çankaya', lat: 39.9208, lng: 32.8541 },
  { name: 'Çayyolu', lat: 39.8801, lng: 32.6845 },
  { name: 'Ümitköy', lat: 39.8932, lng: 32.7345 },
  { name: 'Oran', lat: 39.9012, lng: 32.8102 },
  { name: 'Kızılay', lat: 39.9211, lng: 32.8609 },
  { name: 'Keçiören', lat: 39.9987, lng: 32.8765 },
  { name: 'Yenimahalle', lat: 39.9612, lng: 32.8102 },
  { name: 'Etimesgut', lat: 39.9423, lng: 32.6834 },
];

async function searchPlaces(district) {
  const { lat, lng, name: districtName } = district;
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  url.searchParams.set('location', `${lat},${lng}`);
  url.searchParams.set('radius', '5000');
  url.searchParams.set('type', 'veterinary_care');
  url.searchParams.set('key', GOOGLE_KEY);

  const res = await fetch(url.toString());
  const json = await res.json();
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    console.error(`Places API error for ${districtName}:`, json.status, json.error_message);
    return [];
  }
  return json.results ?? [];
}

async function getPlaceDetails(placeId) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'name,formatted_address,formatted_phone_number,geometry,rating,opening_hours,place_id');
  url.searchParams.set('key', GOOGLE_KEY);
  const res = await fetch(url.toString());
  const json = await res.json();
  return json.result ?? null;
}

async function main() {
  let total = 0;
  const seen = new Set();

  for (const district of DISTRICTS) {
    console.log(`\nSearching ${district.name}...`);
    const places = await searchPlaces(district);
    console.log(`  Found ${places.length} places`);

    for (const place of places) {
      if (seen.has(place.place_id)) continue;
      seen.add(place.place_id);

      const details = await getPlaceDetails(place.place_id);
      if (!details) continue;

      const row = {
        name: details.name,
        address: details.formatted_address ?? null,
        district: district.name,
        city: 'Ankara',
        lat: details.geometry.location.lat,
        lng: details.geometry.location.lng,
        phone: details.formatted_phone_number ?? null,
        google_place_id: details.place_id,
        rating: details.rating ?? null,
        verification_status: 'seed',
        is_24_7: false,
        accepts_emergency: false,
        is_verified: false,
      };

      const { error } = await supabase
        .from('clinics')
        .upsert(row, { onConflict: 'google_place_id', ignoreDuplicates: false });

      if (error) console.error(`  Error upserting ${row.name}:`, error.message);
      else { total++; process.stdout.write('.'); }

      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`\n\nDone. Upserted ${total} clinics.`);
  console.log('Next step: verify clinics via the admin panel (set is_verified, is_24_7, accepts_emergency).');
}

main().catch(console.error);
