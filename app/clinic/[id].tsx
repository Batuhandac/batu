import React, { useEffect, useState } from 'react';
import { View, ScrollView, Linking, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Text, Icon, IconButton, Button, Card, Badge, Group, ListRow, Section, EmptyState, Chip, BackButton } from '@/components/ds';
import { useTheme, radius, hairline } from '@/lib/theme';
import { Stars } from '@/components/ui/Stars';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { PingButton } from '@/components/clinic/PingButton';
import { PhotosSection } from '@/components/clinic/PhotosSection';
import { DirectionsModal } from '@/components/clinic/DirectionsModal';
import { FeedbackModal } from '@/components/clinic/FeedbackModal';
import { ReviewsSection } from '@/components/clinic/ReviewsSection';
import { GoogleReviews } from '@/components/clinic/GoogleReviews';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { getClinicById, seedToClinic } from '@/lib/data/query';
import { getRegisteredClinic } from '@/lib/data/registry';
import { fetchPlaceClinic } from '@/lib/data/places';
import { fetchAppleClinic } from '@/lib/data/apple';
import { chamberLabel, directionsAddress } from '@/lib/data/chamber';
import { applyProfile, loadClinicProfiles } from '@/lib/data/profiles';
import { withLiveStatus, istanbulNow } from '@/lib/utils/openingHours';
import { clinicStatus, formatDistance } from '@/lib/utils/status';
import { callClinic } from '@/lib/utils/call';
import { track } from '@/lib/analytics';
import { fetchInbox, openConversation, type ClinicInbox } from '@/lib/data/messages';
import { loadPets } from '@/lib/data/localStore';
import type { Clinic } from '@/types';

/** WhatsApp yalnızca cep numaralarında çalışır: +90 5xx xxx xx xx */
function whatsappNumber(phone: string | null): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('0')) d = '90' + d.slice(1);
  if (d.length === 10) d = '90' + d;
  return /^905\d{9}$/.test(d) ? d : null;
}

function sourceNote(c: Clinic): string {
  if (c.is_verified) {
    const d = c.last_verified_at ? new Date(c.last_verified_at).toLocaleDateString('tr-TR') : null;
    return `Bilgiler klinik tarafından onaylandı${d ? ` (${d})` : ''}.`;
  }
  if (c.source === 'google') return 'Saat ve telefon bilgisi Google Maps kaynaklıdır.';
  if (c.source === 'builtin') return 'Bilgiler OpenStreetMap gönüllülerince girildi; eksik ya da eski olabilir.';
  if (c.source === 'apple') return 'Adres ve telefon Apple Haritalar kaynaklıdır; çalışma saati bilinmiyor, gitmeden önce ara.';
  if (c.source === 'chamber')
    return `Adres ve telefon ${chamberLabel(c.id)} listesinden alındı; çalışma saati bilinmiyor.${c.location_approx ? ' Haritadaki yer adresten bulundu, birkaç yüz metre sapabilir.' : ''}`;
  return 'Bu klinik bir kullanıcı tarafından eklendi.';
}

export default function ClinicDetailScreen() {
  const t = useTheme();
  const { id, feedback } = useLocalSearchParams<{ id: string; feedback?: string }>();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDirections, setShowDirections] = useState(false);
  const [showFeedback, setShowFeedback] = useState(feedback === '1');
  const { isFav, isPrimaryVet, toggle, setPrimaryVet, load: loadFavs } = useFavorites();
  const [inbox, setInbox] = useState<ClinicInbox | null>(null);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadClinic(id).then((c) => {
      if (!alive) return;
      setClinic(c);
      setLoading(false);
    });
    loadFavs();
    fetchInbox(id).then((i) => alive && setInbox(i?.open ? i : null));
    track('clinic_detail_view', { clinic_id: id });
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (feedback === '1') setShowFeedback(true);
  }, [feedback]);

  const handleWhatsApp = async () => {
    const digits = whatsappNumber(clinic?.phone ?? null);
    if (!digits) return;
    const msg = encodeURIComponent('Merhaba, Patiport üzerinden ulaşıyorum.');
    track('whatsapp_tap', { clinic_id: id });
    const url = `whatsapp://send?phone=${digits}&text=${msg}`;
    try {
      const ok = await Linking.canOpenURL(url);
      await Linking.openURL(ok ? url : `https://wa.me/${digits}?text=${msg}`);
    } catch {
      await Linking.openURL(`https://wa.me/${digits}?text=${msg}`).catch(() => {});
    }
  };

  const handleMessage = async () => {
    if (!clinic) return;
    setOpening(true);
    const pets = await loadPets();
    const p = pets.find((x) => x.is_primary) ?? pets[0];
    const summary = p
      ? [p.name, p.breed ?? (p.species === 'cat' ? 'Kedi' : p.species === 'dog' ? 'Köpek' : null), p.age_years != null ? `${p.age_years} yaş` : null, p.weight_kg != null ? `${p.weight_kg} kg` : null]
          .filter(Boolean)
          .join(' · ')
      : null;
    const convId = await openConversation({ id: clinic.id, name: clinic.name }, summary);
    setOpening(false);
    if (!convId) {
      Alert.alert('Mesajlaşma açılamadı', 'İnternet bağlantını kontrol edip tekrar dene.');
      return;
    }
    track('conversation_started', { clinic_id: clinic.id });
    router.push(`/messages/${convId}`);
  };

  const handleDirections = () => {
    track('directions_tap', { clinic_id: id });
    setShowDirections(true);
  };

  if (loading || !clinic) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <BackButton onPress={() => router.back()} />
        </View>
        {loading ? (
          <ActivityIndicator color={t.primary} size="large" style={{ marginTop: 80 }} />
        ) : (
          <EmptyState
            icon="cloud-offline-outline"
            title="Klinik bulunamadı"
            text="İnternet bağlantını kontrol edip tekrar dene."
            action={<Button title="Geri dön" variant="secondary" onPress={() => router.back()} full />}
          />
        )}
      </SafeAreaView>
    );
  }

  const s = clinicStatus(clinic);
  const weekdayText = clinic.weekday_text ?? [];
  const todayIdx = (istanbulNow().dow + 6) % 7; // weekday_text Pazartesi'den başlar
  const place = [clinic.district, clinic.city].filter(Boolean).join(', ');
  const meta = [place || null, clinic.distance_km > 0 ? formatDistance(clinic.distance_km, clinic.location_approx) : null].filter(Boolean).join(' · ');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 6 }}>
        <BackButton onPress={() => router.back()} />
        <IconButton
          icon={isFav(id) ? 'heart' : 'heart-outline'}
          color={isFav(id) ? t.sos : undefined}
          onPress={() => toggle(id)}
          accessibilityLabel={isFav(id) ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          size={40}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Kimlik */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ flex: 1 }}>
              <Text variant="title">{clinic.name}</Text>
              {meta ? (
                <Text variant="callout" tone="muted" style={{ marginTop: 2 }}>
                  {meta}
                </Text>
              ) : null}
            </View>
          </View>
          {clinic.rating ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <Stars value={clinic.rating} size={14} />
              <Text variant="caption" tone="muted">
                {clinic.rating.toFixed(1).replace('.', ',')}
                {clinic.rating_count ? ` · ${clinic.rating_count} değerlendirme` : ''}
              </Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 4, marginTop: 12 }}>
            <Badge label={s.label} tone={s.tone} dot />
            {s.closingSoon ? <Badge label={s.closingSoon} tone="honey" icon="time-outline" /> : null}
            {clinic.accepts_emergency && !clinic.is_24_7 ? <Badge label="Acil kabul" tone="sos" /> : null}
            {clinic.is_verified ? <Badge label="Klinik onaylı" tone="primary" icon="shield-checkmark" /> : null}
            {clinic.source === 'community' ? <Badge label="Kullanıcı ekledi" /> : null}
          </View>
        </View>

        {/* Eylemler — acilde en önemli şey: tek dokunuşla aramak */}
        <View style={{ paddingHorizontal: 20, marginTop: 20, gap: 10 }}>
          {clinic.phone ? (
            <Button title="Hemen ara" subtitle={clinic.phone} icon="call" size="lg" full onPress={() => callClinic(clinic, 'detail')} accessibilityLabel={`${clinic.name} ara`} />
          ) : (
            <Card>
              <Text variant="bodyStrong">Telefon bilgisi yok</Text>
              <Text variant="callout" tone="muted" style={{ marginTop: 2 }}>
                Bu kliniğin numarasını bilmiyoruz. Biliyorsan bildir; bir sonraki acilde başkası arayabilsin.
              </Text>
              <Button title="Telefonu bildir" variant="ghost" icon="add-circle-outline" onPress={() => router.push(`/clinic/${id}/report?type=missing_phone`)} style={{ alignSelf: 'flex-start', marginTop: 4, marginLeft: -12 }} />
            </Card>
          )}
          {clinic.emergency_phone ? (
            <Button
              title="Mesai dışı acil hattı"
              subtitle={clinic.emergency_phone}
              icon="moon"
              variant="sos"
              full
              onPress={() => callClinic({ ...clinic, phone: clinic.emergency_phone! }, 'emergency_line')}
            />
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Yol tarifi" icon="navigate-outline" variant="secondary" onPress={handleDirections} style={{ flex: 1 }} />
            {whatsappNumber(clinic.phone) ? <Button title="WhatsApp" icon="logo-whatsapp" variant="secondary" onPress={handleWhatsApp} style={{ flex: 1 }} /> : null}
          </View>
          {inbox ? (
            <Button
              title="Mesaj gönder"
              subtitle={inbox.response_hint ?? 'Acil olmayan soruların için'}
              icon="chatbubble-ellipses-outline"
              variant="secondary"
              full
              loading={opening}
              onPress={handleMessage}
            />
          ) : null}
        </View>

        {/* Bilgiler */}
        <Section title="Bilgiler">
          <Group>
            {clinic.address ? (
              <ListRow
                icon="location-outline"
                title={clinic.address}
                subtitle={clinic.location_approx ? 'Adres · haritadaki yer yaklaşık' : 'Adres'}
                onPress={handleDirections}
              />
            ) : null}
            <View style={{ padding: 16, borderBottomWidth: hairline, borderBottomColor: t.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: weekdayText.length ? 10 : 0 }}>
                <Icon name="time-outline" size={20} color={t.primary} />
                <Text variant="bodyStrong">Çalışma saatleri</Text>
              </View>
              {weekdayText.length > 0 ? (
                weekdayText.map((line, i) => {
                  const [day, ...rest] = line.split(':');
                  const today = weekdayText.length === 7 && i === todayIdx;
                  return (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                      <Text variant={today ? 'bodyStrong' : 'callout'} tone={today ? 'primary' : 'muted'}>
                        {day?.trim()}
                        {today ? ' · bugün' : ''}
                      </Text>
                      <Text variant={today ? 'bodyStrong' : 'callout'} tone={today ? 'primary' : 'default'}>
                        {rest.join(':').trim()}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text variant="callout" tone="muted" style={{ marginTop: 6 }}>
                  Bilinmiyor — gitmeden önce mutlaka ara.
                </Text>
              )}
            </View>
            <View style={{ padding: 16 }}>
              <Text variant="caption" tone="subtle">
                {sourceNote(clinic)} Durum değişebilir; gitmeden önce ara.
              </Text>
            </View>
          </Group>

          {clinic.services && clinic.services.length > 0 ? (
            <View style={{ marginTop: 14 }}>
              <Text variant="overline" tone="muted" style={{ marginBottom: 8 }}>
                Hizmetler
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {clinic.services.map((x) => (
                  <Chip key={x} label={x} />
                ))}
              </View>
            </View>
          ) : null}

          {clinic.note ? (
            <Card style={{ marginTop: 14 }}>
              <Text variant="overline" tone="muted">
                Klinikten not
              </Text>
              <Text variant="callout" style={{ marginTop: 4 }}>
                {clinic.note}
              </Text>
            </Card>
          ) : null}
        </Section>

        {/* Konum */}
        <Pressable
          onPress={handleDirections}
          accessibilityRole="button"
          accessibilityLabel="Yol tarifi"
          style={{ marginHorizontal: 20, marginTop: 20, height: 160, borderRadius: radius.lg, overflow: 'hidden' }}
        >
          <MapView
            style={{ flex: 1 }}
            initialRegion={{ latitude: clinic.lat, longitude: clinic.lng, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            userInterfaceStyle={t.dark ? 'dark' : 'light'}
          >
            <Marker coordinate={{ latitude: clinic.lat, longitude: clinic.lng }} title={clinic.name} pinColor={t.primary} />
          </MapView>
        </Pressable>

        <View style={{ paddingHorizontal: 20, marginTop: 20, gap: 12 }}>
          <PingButton clinicId={id} />
          <Group>
            <ListRow
              icon={isPrimaryVet(id) ? 'heart' : 'heart-outline'}
              title={isPrimaryVet(id) ? 'Düzenli veterinerin' : 'Düzenli veterinerim olarak kaydet'}
              subtitle={isPrimaryVet(id) ? 'Ana sayfada kısayol olarak görünür' : 'Ana sayfadan tek dokunuşla ulaş'}
              onPress={() => setPrimaryVet(id)}
              right={isPrimaryVet(id) ? <Icon name="checkmark-circle" size={22} color={t.primary} /> : undefined}
              last
            />
          </Group>
        </View>

        <PhotosSection clinicId={id} />
        <GoogleReviews clinic={clinic} />
        <ReviewsSection clinicId={id} clinicName={clinic.name} />

        {/* Veteriner hekimlere: reklam değil, doğru bilgi */}
        {!clinic.is_verified && (
          <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
            <Card tone="primary">
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Icon name="medical" size={22} color={t.primary} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">Bu kliniğin veteriner hekimi misiniz?</Text>
                  <Text variant="callout" tone="muted" style={{ marginTop: 2 }}>
                    Telefon, çalışma saatleri ve acil hattınızı ücretsiz doğrulayın. Reklam değil; acildeki hasta sahipleri size doğru bilgiyle ulaşsın.
                  </Text>
                </View>
              </View>
              <Button title="Bilgilerimi doğrula" variant="primary" size="md" full onPress={() => router.push(`/clinic/${id}/claim`)} style={{ marginTop: 14 }} />
            </Card>
          </View>
        )}

        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <Button title="Hatalı bilgiyi bildir" icon="flag-outline" variant="ghost" onPress={() => router.push(`/clinic/${id}/report`)} style={{ alignSelf: 'center' }} />
          <DataAttribution clinics={[clinic]} />
          <Disclaimer />
        </View>
      </ScrollView>

      <DirectionsModal
        visible={showDirections}
        onClose={() => setShowDirections(false)}
        onCallFirst={clinic.phone ? () => callClinic(clinic, 'directions') : undefined}
        lat={clinic.lat}
        lng={clinic.lng}
        clinicId={id}
        address={directionsAddress(clinic)}
      />
      <FeedbackModal visible={showFeedback} onClose={() => setShowFeedback(false)} clinicId={id} clinicName={clinic.name} />
    </SafeAreaView>
  );
}

// Listede gösterilen kayıt (mesafe/durum hazır) → gömülü veri → Google
// (önbellek ya da Place Details). Onaylı profil varsa üzerine uygulanır.
async function loadClinic(id: string): Promise<Clinic | null> {
  const reg = getRegisteredClinic(id);
  let c: Clinic | null = reg ? withLiveStatus(reg) : null;
  if (!c) {
    const seed = getClinicById(id);
    if (seed) c = seedToClinic(seed);
  }
  if (!c) c = await fetchPlaceClinic(id).catch(() => null);
  if (!c) c = await fetchAppleClinic(id).catch(() => null);
  if (c && !c.is_verified) {
    const profiles = await loadClinicProfiles().catch(() => ({}));
    c = applyProfile(c, (profiles as Record<string, never>)[id]);
  }
  return c;
}
