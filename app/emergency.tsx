// ACİL MOD — panikteki bir hayvan sahibi için tek ekranlık akış.
// İlkeler: tek karar (en iyi seçenek büyük, diğerleri küçük), dev dokunma
// alanları, az okuma, sakinleştirici dil, yapacak somut bir iş ("ararken
// şunları söyle") ve dürüstlük (bilmediğimiz saati "açık" göstermeyiz).
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useClinics } from '@/lib/hooks/useClinics';
import { useLocation } from '@/lib/hooks/useLocation';
import { usePets } from '@/lib/hooks/usePets';
import { useLocationStore } from '@/stores/location';
import { callClinic } from '@/lib/utils/call';
import { speciesLabel } from '@/lib/utils/pets';
import { track } from '@/lib/analytics';
import { FIRST_AID, BEFORE_YOU_GO, NEVER_HUMAN_MEDS } from '@/lib/content/firstAid';
import { DirectionsModal } from '@/components/clinic/DirectionsModal';
import { DistrictPicker } from '@/components/location/DistrictPicker';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { formatDistance } from '@/components/clinic/ClinicCard';
import type { Clinic, Pet } from '@/types';

const GREEN = '#38A169';
const ORANGE = '#ff7f1c';

const isOpen = (c: Clinic) => c.status === 'open' || c.is_24_7;
const canCall = (c: Clinic) => !!(c.phone || c.emergency_phone);

export default function EmergencyScreen() {
  useKeepAwake();
  const { clinics, loading, fetch } = useClinics();
  const { lat, lng, source, label, granted, loading: locating, request, refresh, setManual } = useLocation();
  const { pets, load: loadPets } = usePets();
  const [askedLocation, setAskedLocation] = useState(false);
  const [picker, setPicker] = useState(false);
  const [dirClinic, setDirClinic] = useState<Clinic | null>(null);
  const [petId, setPetId] = useState<string | null>(null);
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const [checked, setChecked] = useState<number[]>([]);

  // Açılışta: gerçek konumu hemen al (acil anında evde değil, başka yerde olabilir)
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    track('emergency_cta_tap');
    loadPets();
    (async () => {
      let ok = await refresh();
      if (!ok && granted !== false) ok = await request();
      setAskedLocation(true);
      if (!ok && useLocationStore.getState().lat == null) setPicker(true);
    })();
  }, []);

  useEffect(() => {
    if (lat != null && lng != null) fetch(lat, lng);
  }, [lat, lng, fetch]);

  const { best, others } = useMemo(() => {
    const bestClinic = clinics.find((c) => isOpen(c) && canCall(c)) ?? null;
    const rest = clinics.filter((c) => c !== bestClinic && (isOpen(c) || (c.status === 'unknown' && canCall(c))));
    return { best: bestClinic, others: rest.slice(0, 4) };
  }, [clinics]);

  const pet: Pet | undefined = pets.find((p) => p.id === petId) ?? pets.find((p) => p.is_primary) ?? pets[0];
  const searching = locating || loading || (lat == null && !askedLocation);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Üst */}
        <View className="px-5 pt-3 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-white text-2xl font-extrabold" style={{ letterSpacing: -0.4 }}>
              Yanındayız 🐾
            </Text>
            <Text className="text-gray-text text-base mt-1 leading-relaxed">
              Derin bir nefes al. En hızlı yolu birlikte bulalım.
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} className="bg-card rounded-full px-4 py-2" accessibilityLabel="Acil modu kapat">
            <Text className="text-gray-label font-semibold">Kapat</Text>
          </TouchableOpacity>
        </View>

        {/* Konum satırı */}
        <TouchableOpacity onPress={() => setPicker(true)} className="mx-5 mt-4 flex-row items-center gap-2" activeOpacity={0.7}>
          <Text className="text-gray-muted text-sm">
            📍 {source === 'manual' ? label ?? 'Seçilen bölge' : source === 'gps' ? 'Bulunduğun konuma göre' : 'Konum bekleniyor'}
          </Text>
          <Text style={{ color: ORANGE, fontSize: 13, fontWeight: '600' }}>Değiştir</Text>
        </TouchableOpacity>

        {/* 1. ADIM — En iyi seçenek */}
        <View className="px-5 mt-4">
          {searching && !best ? (
            <View className="bg-card border border-border rounded-3xl p-6 items-center">
              <ActivityIndicator color={ORANGE} size="large" />
              <Text className="text-white font-semibold text-base mt-4">
                {locating || lat == null ? 'Konumun alınıyor…' : 'Açık veterinerler aranıyor…'}
              </Text>
              <Text className="text-gray-muted text-sm mt-1 text-center">Birkaç saniye sürebilir.</Text>
            </View>
          ) : best ? (
            <BestClinicCard clinic={best} onDirections={() => setDirClinic(best)} />
          ) : lat != null ? (
            <View className="bg-card border border-border rounded-3xl p-5">
              <Text className="text-white font-bold text-lg">Şu an açık olduğunu bildiğimiz bir klinik yok</Text>
              <Text className="text-gray-text text-sm mt-2 leading-relaxed">
                Aşağıdaki klinikleri aramayı dene — birçoğu mesai dışında acil hattına yönlendirir.
                Kimse açmazsa konumu değiştirip daha geniş bölgede ara.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Diğer seçenekler */}
        {others.length > 0 && (
          <View className="px-5 mt-5">
            <Text className="text-gray-label text-xs font-bold uppercase tracking-wide mb-2">
              {best ? 'Açmazsa sıradaki' : 'Aranabilecek klinikler'}
            </Text>
            {others.map((c) => (
              <AltRow key={c.id} clinic={c} onDirections={() => setDirClinic(c)} />
            ))}
          </View>
        )}

        {!searching && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/nearby')} className="mx-5 mt-2 py-2">
            <Text style={{ color: ORANGE, fontWeight: '600' }}>Tüm yakın klinikleri gör →</Text>
          </TouchableOpacity>
        )}

        {/* 2. ADIM — Ararken söyle */}
        <View className="mx-5 mt-6 bg-card border border-border rounded-3xl p-5">
          <Text className="text-white font-bold text-lg">📋 Ararken şunları söyle</Text>
          {pets.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerStyle={{ gap: 8 }}>
              {pets.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setPetId(p.id)}
                  className="rounded-full px-4 py-2 border"
                  style={{ borderColor: pet?.id === p.id ? ORANGE : 'rgba(255,255,255,0.1)', backgroundColor: pet?.id === p.id ? 'rgba(255,127,28,0.15)' : 'transparent' }}
                >
                  <Text className="text-white text-sm">{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {pet ? <PetScript pet={pet} /> : <GenericScript />}
        </View>

        {/* 3. ADIM — Yola çıkmadan önce */}
        <View className="mx-5 mt-4 bg-card border border-border rounded-3xl p-5">
          <Text className="text-white font-bold text-lg mb-3">🎒 Yola çıkmadan önce</Text>
          {BEFORE_YOU_GO.map((item, i) => {
            const done = checked.includes(i);
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setChecked((c) => (done ? c.filter((x) => x !== i) : [...c, i]))}
                className="flex-row items-center gap-3 py-2"
                activeOpacity={0.7}
              >
                <View
                  className="w-6 h-6 rounded-md items-center justify-center border-2"
                  style={{ borderColor: done ? GREEN : '#44474c', backgroundColor: done ? GREEN : 'transparent' }}
                >
                  {done && <Text className="text-white text-xs font-bold">✓</Text>}
                </View>
                <Text className={`text-base flex-1 ${done ? 'text-gray-muted line-through' : 'text-gray-label'}`}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. Veterinere ulaşana kadar */}
        <View className="mx-5 mt-4">
          <Text className="text-white font-bold text-lg mb-1">🩹 Veterinere ulaşana kadar</Text>
          <Text className="text-gray-muted text-xs mb-3 leading-relaxed">
            Tedavi değildir; zarar vermemek ve zaman kazanmak içindir. Veterinerin söyledikleri her zaman önce gelir.
          </Text>
          <View className="rounded-2xl p-3 mb-3" style={{ backgroundColor: 'rgba(229,62,62,0.12)' }}>
            <Text className="text-red-400 text-sm font-semibold leading-relaxed">⛔ {NEVER_HUMAN_MEDS}</Text>
          </View>
          {FIRST_AID.map((g) => {
            const expanded = openGuide === g.key;
            return (
              <View key={g.key} className="bg-card border border-border rounded-2xl mb-2 overflow-hidden">
                <TouchableOpacity onPress={() => setOpenGuide(expanded ? null : g.key)} className="flex-row items-center px-4 py-3.5" activeOpacity={0.8}>
                  <Text className="text-lg mr-3">{g.emoji}</Text>
                  <Text className="text-white font-semibold text-base flex-1">{g.title}</Text>
                  <Text className="text-gray-muted text-lg">{expanded ? '−' : '+'}</Text>
                </TouchableOpacity>
                {expanded && (
                  <View className="px-4 pb-4">
                    {g.steps.map((s) => (
                      <Text key={s} className="text-gray-label text-sm leading-relaxed mb-1.5">✓  {s}</Text>
                    ))}
                    {g.avoid.map((s) => (
                      <Text key={s} className="text-red-400 text-sm leading-relaxed mb-1.5">✕  {s}</Text>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <DataAttribution clinics={[...(best ? [best] : []), ...others]} />
        <Text className="text-gray-muted text-xs text-center px-8 leading-relaxed">
          Pati SOS teşhis ya da tedavi önermez. Klinik bilgileri değişebilir; gitmeden önce ara.
        </Text>
      </ScrollView>

      {dirClinic && (
        <DirectionsModal
          visible
          onClose={() => setDirClinic(null)}
          onCallFirst={canCall(dirClinic) ? () => callClinic(phoneOf(dirClinic), 'emergency') : undefined}
          lat={dirClinic.lat}
          lng={dirClinic.lng}
          clinicId={dirClinic.id}
        />
      )}
      <DistrictPicker
        visible={picker}
        onClose={() => setPicker(false)}
        onPick={(d) => setManual(d.lat, d.lng, d.name)}
        onUseGps={async () => {
          const ok = granted ? await refresh() : await request();
          if (!ok) setPicker(true);
        }}
      />
    </SafeAreaView>
  );
}

// Açıksa klinik hattı; kapalı saatte mesai dışı hattı varsa onu ara
function phoneOf(c: Clinic): Clinic {
  if (c.emergency_phone && (!c.phone || c.status !== 'open')) return { ...c, phone: c.emergency_phone };
  return c;
}

function BestClinicCard({ clinic, onDirections }: { clinic: Clinic; onDirections: () => void }) {
  const why = [
    clinic.is_24_7 ? '7/24 açık' : 'Şu an açık',
    clinic.distance_km > 0 ? formatDistance(clinic.distance_km) : null,
    clinic.accepts_emergency && !clinic.is_24_7 ? 'acil kabul' : null,
    clinic.is_verified ? 'klinik onaylı' : null,
  ].filter(Boolean);
  const target = phoneOf(clinic);
  return (
    <View className="rounded-3xl p-5 border" style={{ backgroundColor: 'rgba(56,161,105,0.1)', borderColor: 'rgba(56,161,105,0.45)' }}>
      <Text style={{ color: '#68D391', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>EN UYGUN SEÇENEK</Text>
      <Text className="text-white text-2xl font-extrabold mt-1" numberOfLines={2}>{clinic.name}</Text>
      <Text className="text-gray-label text-sm mt-1">{why.join(' · ')}</Text>
      {clinic.address ? <Text className="text-gray-muted text-xs mt-1" numberOfLines={1}>{clinic.address}</Text> : null}

      <TouchableOpacity
        onPress={() => callClinic(target, 'emergency')}
        activeOpacity={0.85}
        className="rounded-2xl items-center justify-center mt-4"
        style={{ backgroundColor: GREEN, minHeight: 72 }}
        accessibilityLabel={`${clinic.name} şimdi ara`}
      >
        <Text className="text-white text-xl font-extrabold">📞  ŞİMDİ ARA</Text>
        <Text className="text-white/80 text-sm">{target.phone}</Text>
      </TouchableOpacity>

      <View className="flex-row gap-3 mt-3">
        <TouchableOpacity onPress={onDirections} className="flex-1 bg-card rounded-2xl py-3.5 items-center" activeOpacity={0.85}>
          <Text className="text-white font-semibold">🗺️ Yol tarifi</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/clinic/${clinic.id}`)} className="flex-1 bg-card rounded-2xl py-3.5 items-center" activeOpacity={0.85}>
          <Text className="text-white font-semibold">Detaylar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AltRow({ clinic, onDirections }: { clinic: Clinic; onDirections: () => void }) {
  const open = isOpen(clinic);
  return (
    <View className="bg-card border border-border rounded-2xl px-4 py-3 mb-2 flex-row items-center gap-3">
      <TouchableOpacity className="flex-1" onPress={() => router.push(`/clinic/${clinic.id}`)} activeOpacity={0.8}>
        <Text className="text-white font-semibold text-base" numberOfLines={1}>{clinic.name}</Text>
        <Text className="text-gray-muted text-xs mt-0.5">
          {[open ? (clinic.is_24_7 ? '7/24' : 'Açık') : 'Saat bilinmiyor', clinic.distance_km > 0 ? formatDistance(clinic.distance_km) : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </TouchableOpacity>
      {canCall(clinic) ? (
        <TouchableOpacity
          onPress={() => callClinic(phoneOf(clinic), 'emergency_alt')}
          className="rounded-full px-4 py-2.5"
          style={{ backgroundColor: open ? GREEN : 'rgba(68,71,76,0.9)' }}
          accessibilityLabel={`${clinic.name} ara`}
        >
          <Text className="text-white font-bold">📞 Ara</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={onDirections} className="rounded-full px-4 py-2.5 bg-surface">
          <Text className="text-gray-label font-semibold">🗺️ Git</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function PetScript({ pet }: { pet: Pet }) {
  const intro = [
    `${speciesLabel(pet.species, true)} ${pet.name}`,
    pet.breed,
    pet.age_years != null ? `${pet.age_years} yaşında` : null,
    pet.weight_kg != null ? `${pet.weight_kg} kg` : null,
  ]
    .filter(Boolean)
    .join(', ');
  const facts = [
    pet.allergies ? `Alerjisi: ${pet.allergies}` : null,
    pet.medications ? `Kullandığı ilaçlar: ${pet.medications}` : null,
    pet.chronic_conditions ? `Kronik hastalığı: ${pet.chronic_conditions}` : null,
    pet.emergency_note ? `Not: ${pet.emergency_note}` : null,
  ].filter(Boolean) as string[];
  return (
    <View className="mt-3">
      <Text className="text-gray-label text-base leading-relaxed">
        "Merhaba, acil bir durum için arıyorum. <Text className="text-white font-bold">{intro}.</Text>"
      </Text>
      <View className="rounded-xl p-3 mt-3" style={{ backgroundColor: 'rgba(255,127,28,0.1)' }}>
        <Text style={{ color: ORANGE, fontWeight: '700' }}>Sen ekle: Ne oldu, ne zaman başladı?</Text>
        <Text className="text-gray-text text-sm mt-1">Yediği / yuttuğu bir şey varsa ne olduğunu söyle.</Text>
      </View>
      {facts.map((f) => (
        <Text key={f} className="text-white text-base mt-2 leading-relaxed">• {f}</Text>
      ))}
      <Text className="text-gray-label text-base mt-3">"Şimdi gelebilir miyim? Yaklaşık ne kadar beklerim?"</Text>
    </View>
  );
}

function GenericScript() {
  return (
    <View className="mt-3">
      {[
        'Hayvanın türü, yaşı ve yaklaşık kilosu',
        'Ne oldu ve ne zaman başladı',
        'Yediği / yuttuğu bir şey varsa ne olduğu',
        'Kullandığı ilaçlar, bilinen hastalıkları',
        '"Şimdi gelebilir miyim?"',
      ].map((t) => (
        <Text key={t} className="text-white text-base mt-1.5 leading-relaxed">• {t}</Text>
      ))}
      <TouchableOpacity onPress={() => router.push('/pets/create')} className="mt-4">
        <Text className="text-gray-muted text-sm">
          Sonraki sefer için petinin acil kartını oluştur — burada otomatik görünür. →
        </Text>
      </TouchableOpacity>
    </View>
  );
}
