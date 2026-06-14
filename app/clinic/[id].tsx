import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Stars } from '@/components/ui/Stars';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { PingButton } from '@/components/clinic/PingButton';
import { PhotosSection } from '@/components/clinic/PhotosSection';
import { DirectionsModal } from '@/components/clinic/DirectionsModal';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { getClinicById, getClinicHours } from '@/lib/data/query';
import { getRegisteredClinic } from '@/lib/data/registry';
import { ReviewsSection } from '@/components/clinic/ReviewsSection';
import { track } from '@/lib/analytics';
import { scheduleCallFeedback } from '@/lib/notifications';
import type { Clinic, ClinicHours } from '@/types';

const DOW = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function Stat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View className="flex-1 items-center">
      <Text style={{ color: valueColor ?? '#F7FAFC', fontWeight: '700', fontSize: 16 }}>{value}</Text>
      <Text className="text-gray-muted text-xs mt-0.5">{label}</Text>
    </View>
  );
}

export default function ClinicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [hours, setHours] = useState<ClinicHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDirections, setShowDirections] = useState(false);
  const { isFav, isPrimaryVet, toggle, setPrimaryVet, load: loadFavs } = useFavorites();

  useEffect(() => {
    loadClinic();
    loadFavs();
    track('clinic_detail_view', { clinic_id: id });
  }, [id]);

  const loadClinic = async () => {
    setLoading(true);
    const c = getClinicById(id);
    if (c) {
      setClinic({
        id: c.id,
        name: c.name,
        address: c.address,
        district: c.district,
        lat: c.lat,
        lng: c.lng,
        phone: c.phone,
        is_24_7: c.is_24_7,
        accepts_emergency: c.accepts_emergency,
        is_verified: c.is_verified,
        verification_status: c.verification_status as Clinic['verification_status'],
        last_verified_at:
          c.verified_days_ago == null
            ? null
            : new Date(Date.now() - c.verified_days_ago * 86400000).toISOString(),
        rating: c.rating,
        phone_active: true,
        distance_km: 0,
        is_open_now: false,
        status: 'unknown',
        emergency_score: 0,
      } as Clinic);
      setHours(getClinicHours(id));
    } else {
      // Topluluk kliniği (gömülü değil) — bellek kaydından oku
      const reg = getRegisteredClinic(id);
      if (reg) {
        setClinic(reg);
        setHours([]);
      }
    }
    setLoading(false);
  };

  const handleCall = async () => {
    if (!clinic?.phone) return;
    await track('call_tap', { clinic_id: id });
    await scheduleCallFeedback(id, clinic.name);
    Linking.openURL(`tel:${clinic.phone}`);
  };

  const handleWhatsApp = async () => {
    if (!clinic?.phone) return;
    // Telefonu uluslararası formata çevir (sadece rakam; TR için 0 → 90)
    let digits = clinic.phone.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '90' + digits.slice(1);
    if (!digits.startsWith('90') && digits.length === 10) digits = '90' + digits;
    const msg = encodeURIComponent(
      `Merhaba, Pati SOS üzerinden ulaşıyorum. Acil bir durum için ${clinic.name} hakkında bilgi alabilir miyim?`
    );
    await track('call_tap', { clinic_id: id, via: 'whatsapp' });
    const url = `whatsapp://send?phone=${digits}&text=${msg}`;
    try {
      const ok = await Linking.canOpenURL(url);
      await Linking.openURL(ok ? url : `https://wa.me/${digits}?text=${msg}`);
    } catch {
      await Linking.openURL(`https://wa.me/${digits}?text=${msg}`);
    }
  };

  const handleDirections = async () => {
    await track('directions_tap', { clinic_id: id });
    await track('directions_interstitial_shown', { clinic_id: id });
    setShowDirections(true);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#E53E3E" size="large" />
      </SafeAreaView>
    );
  }

  if (!clinic) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center px-6">
        <Text className="text-white text-center">Klinik bulunamadı.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-gray-text underline">Geri dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const open = clinic.status === 'open' || clinic.is_24_7;
  const initial = clinic.name.trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Kapak (profil) */}
        <LinearGradient
          colors={open ? ['#1f6b48', '#15324a', '#0D1B2A'] : ['#3a2030', '#15324a', '#0D1B2A']}
          style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 16 }}
        >
          {/* Üst bar */}
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
              activeOpacity={0.8}
            >
              <Text className="text-white text-xl">‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toggle(id)}
              className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
              activeOpacity={0.8}
            >
              <Text className="text-xl">{isFav(id) ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar + ad */}
          <View className="items-center">
            <View
              className="w-24 h-24 rounded-3xl items-center justify-center mb-3"
              style={{ backgroundColor: open ? 'rgba(56,161,105,0.25)' : 'rgba(229,62,62,0.18)', borderWidth: 2, borderColor: open ? '#38A169' : '#E53E3E' }}
            >
              <Text className="text-white text-4xl font-extrabold">{initial}</Text>
            </View>
            <Text className="text-white text-2xl font-bold text-center px-4">{clinic.name}</Text>
            {clinic.district && (
              <Text className="text-gray-text text-sm mt-1">📍 {clinic.district}, Ankara</Text>
            )}
            {clinic.rating ? (
              <View className="flex-row items-center gap-1 mt-1.5">
                <Stars value={clinic.rating} size={14} />
                <Text className="text-gray-text text-xs">{clinic.rating.toFixed(1)}</Text>
              </View>
            ) : null}
            <View className="mt-3">
              <StatusBadge status={clinic.status} last_verified_at={clinic.last_verified_at} />
            </View>
          </View>

          {/* İstatistik şeridi */}
          <View className="flex-row mt-5 bg-black/20 rounded-2xl py-3">
            <Stat label="Durum" value={open ? 'Açık' : 'Kapalı'} valueColor={open ? '#68D391' : '#FC8181'} />
            <View className="w-px bg-white/10" />
            <Stat label="Puan" value={clinic.rating ? clinic.rating.toFixed(1) : '—'} />
            <View className="w-px bg-white/10" />
            <Stat label="Tip" value={clinic.is_24_7 ? '7/24' : 'Gündüz'} />
          </View>
        </LinearGradient>

        {/* Etiketler */}
        <View className="flex-row gap-2 px-4 mt-4 flex-wrap">
          {clinic.is_24_7 && <View className="bg-green-open/20 border border-green-open/40 rounded-full px-3 py-1"><Text className="text-green-light text-sm font-medium">7/24</Text></View>}
          {clinic.accepts_emergency && <View className="bg-red-sos/20 border border-red-sos/40 rounded-full px-3 py-1"><Text className="text-red-400 text-sm font-medium">Acil kabul</Text></View>}
          {clinic.is_verified && <View className="bg-blue-900/40 border border-blue-700/40 rounded-full px-3 py-1"><Text className="text-blue-300 text-sm font-medium">✓ Doğrulanmış</Text></View>}
          {clinic.source === 'community' && <View className="bg-surface border border-border rounded-full px-3 py-1"><Text className="text-gray-label text-sm font-medium">🐾 Topluluk</Text></View>}
        </View>

        {/* Actions */}
        <View className="px-4 mt-5 gap-3">
          {clinic.phone ? (
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={handleCall} className="flex-1 bg-green-open rounded-2xl py-4 items-center" activeOpacity={0.85}>
                <Text className="text-2xl mb-0.5">📞</Text>
                <Text className="text-white font-bold text-sm">Ara</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleWhatsApp} className="flex-1 rounded-2xl py-4 items-center" style={{ backgroundColor: '#25D366' }} activeOpacity={0.85}>
                <Text className="text-2xl mb-0.5">💬</Text>
                <Text className="text-white font-bold text-sm">WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDirections} className="flex-1 bg-card border border-border rounded-2xl py-4 items-center" activeOpacity={0.85}>
                <Text className="text-2xl mb-0.5">🗺️</Text>
                <Text className="text-white font-bold text-sm">Yol Tarifi</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handleDirections} className="bg-card border border-border rounded-2xl py-4 items-center" activeOpacity={0.85}>
              <Text className="text-white font-bold text-base">🗺️  Yol Tarifi</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info */}
        <View className="px-4 mt-5 bg-card border border-border rounded-2xl mx-4 p-4 gap-3">
          {clinic.address && (
            <View>
              <Text className="text-gray-muted text-xs font-bold uppercase tracking-wide">Adres</Text>
              <Text className="text-white text-sm mt-1">{clinic.address}</Text>
            </View>
          )}
          {clinic.phone && (
            <View>
              <Text className="text-gray-muted text-xs font-bold uppercase tracking-wide">Telefon</Text>
              <Text className="text-white text-sm mt-1">{clinic.phone}</Text>
            </View>
          )}
          {hours.length > 0 && (
            <View>
              <Text className="text-gray-muted text-xs font-bold uppercase tracking-wide mb-2">Çalışma Saatleri</Text>
              {hours.map(h => (
                <View key={h.id} className="flex-row justify-between py-0.5">
                  <Text className="text-gray-text text-sm w-10">{DOW[h.weekday]}</Text>
                  <Text className="text-white text-sm">
                    {h.is_closed ? 'Kapalı' : h.is_overnight ? '00:00 – 00:00 (gece)' : `${h.open_time?.slice(0,5)} – ${h.close_time?.slice(0,5)}`}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Ping */}
        <View className="px-4 mt-4">
          <PingButton clinicId={id} />
        </View>

        {/* Primary vet */}
        <TouchableOpacity
          onPress={() => setPrimaryVet(id)}
          className="mx-4 mt-3 bg-surface border border-border rounded-2xl py-3 items-center"
        >
          <Text className="text-gray-label text-sm">
            {isPrimaryVet(id) ? '⭐ Düzenli veterinerim (seçili)' : '☆ Düzenli veterinerim olarak kaydet'}
          </Text>
        </TouchableOpacity>

        {/* Report / Claim */}
        <View className="flex-row gap-4 px-4 mt-4 justify-center">
          <TouchableOpacity onPress={() => router.push(`/clinic/${id}/report`)}>
            <Text className="text-gray-muted text-sm underline">Hatalı bilgi bildir</Text>
          </TouchableOpacity>
          <Text className="text-gray-muted">·</Text>
          <TouchableOpacity onPress={() => router.push(`/clinic/${id}/claim`)}>
            <Text className="text-gray-muted text-sm underline">Bu klinik benim</Text>
          </TouchableOpacity>
        </View>

        {/* Mini harita önizlemesi */}
        {clinic.lat && clinic.lng ? (
          <TouchableOpacity
            onPress={handleDirections}
            activeOpacity={0.9}
            className="mx-4 mt-5 rounded-2xl overflow-hidden"
            style={{ height: 160 }}
          >
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: clinic.lat,
                longitude: clinic.lng,
                latitudeDelta: 0.008,
                longitudeDelta: 0.008,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              mapType="standard"
              userInterfaceStyle="dark"
            >
              <Marker coordinate={{ latitude: clinic.lat, longitude: clinic.lng }} title={clinic.name} />
            </MapView>
            {/* Yol tarifi overlay */}
            <View
              className="absolute bottom-3 left-3 right-3 rounded-xl py-2 items-center"
              style={{ backgroundColor: 'rgba(13,27,42,0.82)' }}
            >
              <Text className="text-white text-sm font-semibold">🗺️  Yol Tarifi Al</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Fotoğraflar */}
        <PhotosSection clinicId={id} />

        {/* Yorumlar & puanlar */}
        <ReviewsSection clinicId={id} clinicName={clinic.name} />

        <View className="px-4 pb-8">
          <Disclaimer />
        </View>
      </ScrollView>

      <DirectionsModal
        visible={showDirections}
        onClose={() => setShowDirections(false)}
        onCallFirst={handleCall}
        lat={clinic.lat}
        lng={clinic.lng}
        clinicId={id}
      />
    </SafeAreaView>
  );
}
