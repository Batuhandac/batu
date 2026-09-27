import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import { Stars } from '@/components/ui/Stars';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { PingButton } from '@/components/clinic/PingButton';
import { PhotosSection } from '@/components/clinic/PhotosSection';
import { DirectionsModal } from '@/components/clinic/DirectionsModal';
import { FeedbackModal } from '@/components/clinic/FeedbackModal';
import { ReviewsSection } from '@/components/clinic/ReviewsSection';
import { formatDistance } from '@/components/clinic/ClinicCard';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { getClinicById, seedToClinic } from '@/lib/data/query';
import { getRegisteredClinic } from '@/lib/data/registry';
import { fetchPlaceClinic } from '@/lib/data/places';
import { applyProfile, loadClinicProfiles } from '@/lib/data/profiles';
import { withLiveStatus } from '@/lib/utils/openingHours';
import { callClinic } from '@/lib/utils/call';
import { track } from '@/lib/analytics';
import type { Clinic } from '@/types';

function Stat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View className="flex-1 items-center">
      <Text style={{ color: valueColor ?? '#e4e2e3', fontWeight: '700', fontSize: 16 }}>{value}</Text>
      <Text className="text-gray-muted text-xs mt-0.5">{label}</Text>
    </View>
  );
}

function sourceNote(c: Clinic): string {
  if (c.is_verified) {
    const d = c.last_verified_at ? new Date(c.last_verified_at).toLocaleDateString('tr-TR') : null;
    return `Bilgiler klinik tarafından onaylandı${d ? ` (${d})` : ''}.`;
  }
  if (c.source === 'google') return 'Saat ve telefon bilgisi Google Maps kaynaklıdır.';
  if (c.source === 'builtin') return 'Bilgiler OpenStreetMap gönüllülerince girildi; eksik ya da eski olabilir.';
  return 'Bu klinik bir kullanıcı tarafından eklendi.';
}

export default function ClinicDetailScreen() {
  const { id, feedback } = useLocalSearchParams<{ id: string; feedback?: string }>();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDirections, setShowDirections] = useState(false);
  const [showFeedback, setShowFeedback] = useState(feedback === '1');
  const { isFav, isPrimaryVet, toggle, setPrimaryVet, load: loadFavs } = useFavorites();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadClinic(id).then((c) => {
      if (!alive) return;
      setClinic(c);
      setLoading(false);
    });
    loadFavs();
    track('clinic_detail_view', { clinic_id: id });
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (feedback === '1') setShowFeedback(true);
  }, [feedback]);

  const handleWhatsApp = async () => {
    if (!clinic?.phone) return;
    // Telefonu uluslararası formata çevir (sadece rakam; TR için 0 → 90)
    let digits = clinic.phone.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '90' + digits.slice(1);
    if (!digits.startsWith('90') && digits.length === 10) digits = '90' + digits;
    const msg = encodeURIComponent(
      `Merhaba, Pati SOS üzerinden ulaşıyorum. Acil bir durum için ${clinic.name} hakkında bilgi alabilir miyim?`
    );
    track('call_tap', { clinic_id: id, via: 'whatsapp' });
    const url = `whatsapp://send?phone=${digits}&text=${msg}`;
    try {
      const ok = await Linking.canOpenURL(url);
      await Linking.openURL(ok ? url : `https://wa.me/${digits}?text=${msg}`);
    } catch {
      await Linking.openURL(`https://wa.me/${digits}?text=${msg}`).catch(() => {});
    }
  };

  const handleDirections = () => {
    track('directions_tap', { clinic_id: id });
    track('directions_interstitial_shown', { clinic_id: id });
    setShowDirections(true);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#ff7f1c" size="large" />
      </SafeAreaView>
    );
  }

  if (!clinic) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center px-6">
        <Text className="text-white text-center">Klinik bulunamadı. İnternet bağlantını kontrol edip tekrar dene.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-gray-text underline">Geri dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const open = clinic.status === 'open' || clinic.is_24_7;
  const statusLabel = open ? 'Açık' : clinic.status === 'closed' ? 'Kapalı' : 'Bilinmiyor';
  const statusColor = open ? '#68D391' : clinic.status === 'closed' ? '#FC8181' : '#c4c6cc';
  const weekdayText = clinic.weekday_text ?? [];
  const initial = clinic.name.trim().charAt(0).toUpperCase();
  const place = [clinic.district, clinic.city].filter(Boolean).join(', ');

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Kapak */}
        <LinearGradient
          colors={open ? ['#1f6b48', '#1f2a24', '#131315'] : ['#3a2a20', '#1f1f21', '#131315']}
          style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 16 }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
              accessibilityLabel="Geri"
            >
              <Text className="text-white text-xl">‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toggle(id)}
              className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
              accessibilityLabel={isFav(id) ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            >
              <Text className="text-xl">{isFav(id) ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>

          <View className="items-center">
            <View
              className="w-20 h-20 rounded-3xl items-center justify-center mb-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 2, borderColor: statusColor }}
            >
              <Text className="text-white text-3xl font-extrabold">{initial}</Text>
            </View>
            <Text className="text-white text-2xl font-bold text-center px-4">{clinic.name}</Text>
            {clinic.is_verified && (
              <View className="flex-row items-center gap-1 mt-2 rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(104,211,145,0.15)' }}>
                <Text style={{ color: '#68D391', fontSize: 12, fontWeight: '700' }}>✓ Klinik onaylı bilgiler</Text>
              </View>
            )}
            {(place || clinic.distance_km > 0) && (
              <Text className="text-gray-text text-sm mt-2">
                📍 {[place, clinic.distance_km > 0 ? formatDistance(clinic.distance_km) : null].filter(Boolean).join(' · ')}
              </Text>
            )}
            {clinic.rating ? (
              <View className="flex-row items-center gap-1 mt-1.5">
                <Stars value={clinic.rating} size={14} />
                <Text className="text-gray-text text-xs">
                  {clinic.rating.toFixed(1)}
                  {clinic.rating_count ? ` (${clinic.rating_count})` : ''}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="flex-row mt-5 bg-black/20 rounded-2xl py-3">
            <Stat
              label={open && clinic.closes_in_min != null && clinic.closes_in_min < 60 ? `${clinic.closes_in_min} dk sonra kapanıyor` : 'Şu an'}
              value={statusLabel}
              valueColor={statusColor}
            />
            <View className="w-px bg-white/10" />
            <Stat label="Çalışma" value={clinic.is_24_7 ? '7/24' : weekdayText.length ? 'Saatli' : '—'} />
            <View className="w-px bg-white/10" />
            <Stat label="Acil" value={clinic.accepts_emergency ? 'Kabul' : '—'} valueColor={clinic.accepts_emergency ? '#ff7f1c' : undefined} />
          </View>
        </LinearGradient>

        {/* Eylemler — acilde en önemli şey: tek dokunuşla aramak */}
        <View className="px-4 mt-4 gap-3">
          {clinic.phone ? (
            <TouchableOpacity
              onPress={() => callClinic(clinic, 'detail')}
              className="rounded-2xl py-5 items-center"
              style={{ backgroundColor: '#38A169' }}
              activeOpacity={0.85}
              accessibilityLabel={`${clinic.name} ara`}
            >
              <Text className="text-white font-extrabold text-lg">📞  Hemen Ara</Text>
              <Text className="text-white/80 text-sm mt-0.5">{clinic.phone}</Text>
            </TouchableOpacity>
          ) : (
            <View className="bg-card border border-border rounded-2xl p-4">
              <Text className="text-white font-semibold">Telefon bilgisi yok</Text>
              <Text className="text-gray-text text-sm mt-1 leading-relaxed">
                Bu kliniğin telefonunu bilmiyoruz. Yol tarifini kullanabilir ya da numarayı biliyorsan
                bildirerek başkalarına yardım edebilirsin.
              </Text>
              <TouchableOpacity onPress={() => router.push(`/clinic/${id}/report?type=missing_phone`)} className="mt-3">
                <Text style={{ color: '#ff7f1c', fontWeight: '700' }}>Telefonu bildir →</Text>
              </TouchableOpacity>
            </View>
          )}

          {clinic.emergency_phone ? (
            <TouchableOpacity
              onPress={() => callClinic({ ...clinic, phone: clinic.emergency_phone! }, 'emergency_line')}
              className="rounded-2xl py-4 items-center border"
              style={{ backgroundColor: 'rgba(255,127,28,0.12)', borderColor: 'rgba(255,127,28,0.4)' }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#ff7f1c', fontWeight: '800', fontSize: 15 }}>🌙  Mesai dışı acil hattı</Text>
              <Text className="text-gray-text text-sm mt-0.5">{clinic.emergency_phone}</Text>
            </TouchableOpacity>
          ) : null}

          <View className="flex-row gap-3">
            <TouchableOpacity onPress={handleDirections} className="flex-1 bg-card border border-border rounded-2xl py-4 items-center" activeOpacity={0.85}>
              <Text className="text-xl mb-0.5">🗺️</Text>
              <Text className="text-white font-bold text-sm">Yol Tarifi</Text>
            </TouchableOpacity>
            {clinic.phone ? (
              <TouchableOpacity onPress={handleWhatsApp} className="flex-1 bg-card border border-border rounded-2xl py-4 items-center" activeOpacity={0.85}>
                <Text className="text-xl mb-0.5">💬</Text>
                <Text className="text-white font-bold text-sm">WhatsApp</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Bilgiler */}
        <View className="mt-5 bg-card border border-border rounded-2xl mx-4 p-4 gap-4">
          {clinic.address ? (
            <View>
              <Text className="text-gray-muted text-xs font-bold uppercase tracking-wide">Adres</Text>
              <Text className="text-white text-sm mt-1">{clinic.address}</Text>
            </View>
          ) : null}
          {weekdayText.length > 0 ? (
            <View>
              <Text className="text-gray-muted text-xs font-bold uppercase tracking-wide mb-2">Çalışma Saatleri</Text>
              {weekdayText.map((line, i) => {
                const [day, ...rest] = line.split(':');
                return (
                  <View key={i} className="flex-row justify-between py-0.5">
                    <Text className="text-gray-text text-sm" style={{ minWidth: 40 }}>{day?.trim()}</Text>
                    <Text className="text-white text-sm text-right">{rest.join(':').trim()}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View>
              <Text className="text-gray-muted text-xs font-bold uppercase tracking-wide">Çalışma Saatleri</Text>
              <Text className="text-gray-text text-sm mt-1">Bilinmiyor — gitmeden önce mutlaka ara.</Text>
            </View>
          )}
          {clinic.services && clinic.services.length > 0 ? (
            <View>
              <Text className="text-gray-muted text-xs font-bold uppercase tracking-wide mb-2">Hizmetler</Text>
              <View className="flex-row flex-wrap gap-2">
                {clinic.services.map((s) => (
                  <View key={s} className="bg-surface border border-border rounded-full px-3 py-1">
                    <Text className="text-gray-label text-xs">{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          {clinic.note ? (
            <View className="rounded-xl p-3" style={{ backgroundColor: 'rgba(234,195,51,0.1)' }}>
              <Text style={{ color: '#eac333', fontSize: 12, fontWeight: '700' }}>Klinikten not</Text>
              <Text className="text-gray-label text-sm mt-1">{clinic.note}</Text>
            </View>
          ) : null}
          <Text className="text-gray-muted text-xs leading-relaxed">{sourceNote(clinic)} Durum değişebilir; gitmeden önce ara.</Text>
        </View>

        {/* Topluluk teyidi */}
        <View className="px-4 mt-4">
          <PingButton clinicId={id} />
        </View>

        <TouchableOpacity
          onPress={() => setPrimaryVet(id)}
          className="mx-4 mt-3 bg-surface border border-border rounded-2xl py-3 items-center"
        >
          <Text className="text-gray-label text-sm">
            {isPrimaryVet(id) ? '⭐ Düzenli veterinerim (seçili)' : '☆ Düzenli veterinerim olarak kaydet'}
          </Text>
        </TouchableOpacity>

        {/* Mini harita */}
        <TouchableOpacity onPress={handleDirections} activeOpacity={0.9} className="mx-4 mt-4 rounded-2xl overflow-hidden" style={{ height: 150 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{ latitude: clinic.lat, longitude: clinic.lng, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            userInterfaceStyle="dark"
          >
            <Marker coordinate={{ latitude: clinic.lat, longitude: clinic.lng }} title={clinic.name} />
          </MapView>
          <View className="absolute bottom-3 left-3 right-3 rounded-xl py-2 items-center" style={{ backgroundColor: 'rgba(19,19,21,0.85)' }}>
            <Text className="text-white text-sm font-semibold">🗺️  Yol Tarifi Al</Text>
          </View>
        </TouchableOpacity>

        <PhotosSection clinicId={id} />
        <ReviewsSection clinicId={id} clinicName={clinic.name} />

        {/* Veteriner hekimlere: reklam değil, doğru bilgi */}
        {!clinic.is_verified && (
          <TouchableOpacity
            onPress={() => router.push(`/clinic/${id}/claim`)}
            activeOpacity={0.85}
            className="mx-4 mt-6 rounded-2xl p-4 border"
            style={{ backgroundColor: 'rgba(186,200,220,0.08)', borderColor: 'rgba(186,200,220,0.25)' }}
          >
            <Text className="text-white font-bold text-base">🩺 Bu kliniğin veteriner hekimi misiniz?</Text>
            <Text className="text-gray-text text-sm mt-1 leading-relaxed">
              Telefon, çalışma saatleri ve acil hattınızı ücretsiz doğrulayın. Reklam değil — acildeki
              hasta sahipleri size doğru bilgiyle ulaşsın.
            </Text>
            <Text style={{ color: '#bac8dc', fontWeight: '700', marginTop: 8 }}>Bilgilerimi doğrula →</Text>
          </TouchableOpacity>
        )}

        <View className="flex-row gap-4 px-4 mt-5 justify-center">
          <TouchableOpacity onPress={() => router.push(`/clinic/${id}/report`)}>
            <Text className="text-gray-muted text-sm underline">Hatalı bilgi bildir</Text>
          </TouchableOpacity>
        </View>

        <View className="px-4 pb-8">
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
      />
      <FeedbackModal
        visible={showFeedback}
        onClose={() => setShowFeedback(false)}
        clinicId={id}
        clinicName={clinic.name}
      />
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
  if (c && !c.is_verified) {
    const profiles = await loadClinicProfiles().catch(() => ({}));
    c = applyProfile(c, (profiles as Record<string, never>)[id]);
  }
  return c;
}
