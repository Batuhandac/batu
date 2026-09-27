// ACİL MOD — panikteki bir hayvan sahibi için tek ekranlık akış.
// İlkeler: tek karar (en iyi seçenek büyük, diğerleri küçük), dev dokunma
// alanları, az okuma, sakinleştirici dil, yapacak somut bir iş ("ararken
// şunları söyle") ve dürüstlük (bilmediğimiz saati "açık" göstermeyiz).
import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Screen, Text, Icon, IconBadge, IconButton, Button, Card, Badge, Checkbox } from '@/components/ds';
import { useTheme, radius } from '@/lib/theme';
import { useClinics } from '@/lib/hooks/useClinics';
import { useLocation } from '@/lib/hooks/useLocation';
import { usePets } from '@/lib/hooks/usePets';
import { useLocationStore } from '@/stores/location';
import { callClinic } from '@/lib/utils/call';
import { speciesLabel } from '@/lib/utils/pets';
import { clinicStatus, formatDistance, isOpenNow, canCall, pickBestClinic } from '@/lib/utils/status';
import { track } from '@/lib/analytics';
import { BEFORE_YOU_GO } from '@/lib/content/firstAid';
import { FirstAidList } from '@/components/clinic/FirstAidList';
import { DirectionsModal } from '@/components/clinic/DirectionsModal';
import { DistrictPicker } from '@/components/location/DistrictPicker';
import { DataAttribution } from '@/components/ui/DataAttribution';
import type { Clinic, Pet } from '@/types';

const KEEP_AWAKE_TAG = 'pati-sos-emergency';

// Açıksa klinik hattı; kapalı saatte mesai dışı hattı varsa onu ara
function phoneOf(c: Clinic): Clinic {
  if (c.emergency_phone && (!c.phone || c.status !== 'open')) return { ...c, phone: c.emergency_phone };
  return c;
}

export default function EmergencyScreen() {
  const t = useTheme();
  const { clinics, loading, fetch } = useClinics();
  const { lat, lng, source, label, granted, loading: locating, request, refresh, setManual } = useLocation();
  const { pets, load: loadPets } = usePets();
  const [askedLocation, setAskedLocation] = useState(false);
  const [picker, setPicker] = useState(false);
  const [dirClinic, setDirClinic] = useState<Clinic | null>(null);
  const [petId, setPetId] = useState<string | null>(null);
  const [checked, setChecked] = useState<number[]>([]);

  // Arama metnini okurken ekran kararmasın (izin verilmezse sessizce geç)
  useEffect(() => {
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      Promise.resolve(deactivateKeepAwake(KEEP_AWAKE_TAG)).catch(() => {});
    };
  }, []);

  // Açılışta gerçek konumu hemen al (acil anında evde değil, başka yerde olabilir)
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
    const bestClinic = pickBestClinic(clinics);
    const rest = clinics.filter((c) => c !== bestClinic && (isOpenNow(c) || (c.status === 'unknown' && canCall(c))));
    return { best: bestClinic, others: rest.slice(0, 4) };
  }, [clinics]);

  const pet: Pet | undefined = pets.find((p) => p.id === petId) ?? pets.find((p) => p.is_primary) ?? pets[0];
  const searching = locating || loading || (lat == null && !askedLocation);

  return (
    <Screen scroll edges={['top', 'bottom']}>
      {/* Üst */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 8 }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text variant="overline" tone="sos">
            Acil mod
          </Text>
          <Text variant="display" style={{ marginTop: 4 }}>
            Yanındayız.
          </Text>
          <Text variant="body" tone="muted" style={{ marginTop: 4 }}>
            Derin bir nefes al. En hızlı yolu birlikte bulalım.
          </Text>
        </View>
        <IconButton icon="close" onPress={() => router.back()} accessibilityLabel="Acil modu kapat" />
      </View>

      <Pressable onPress={() => setPicker(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, marginTop: 14 }} accessibilityRole="button">
        <Icon name={source === 'gps' ? 'navigate' : 'location-outline'} size={15} color={t.textMuted} />
        <Text variant="caption" tone="muted">
          {source === 'manual' ? label ?? 'Seçilen bölge' : source === 'gps' ? 'Bulunduğun konuma göre' : 'Konum bekleniyor'}
        </Text>
        <Text variant="caption" tone="primary">
          · Değiştir
        </Text>
      </Pressable>

      {/* 1 — En uygun seçenek */}
      <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
        {searching && !best ? (
          <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
            <ActivityIndicator color={t.primary} size="large" />
            <Text variant="bodyStrong" style={{ marginTop: 14 }}>
              {locating || lat == null ? 'Konumun alınıyor…' : 'Açık veterinerler aranıyor…'}
            </Text>
            <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
              Birkaç saniye sürebilir.
            </Text>
          </Card>
        ) : best ? (
          <BestClinicCard clinic={best} onDirections={() => setDirClinic(best)} />
        ) : lat != null ? (
          <Card tone="honey">
            <Text variant="bodyStrong">Şu an açık olduğunu bildiğimiz bir klinik yok</Text>
            <Text variant="callout" tone="muted" style={{ marginTop: 4 }}>
              Aşağıdaki klinikleri aramayı dene; birçoğu mesai dışında acil hattına yönlendirir. Kimse
              açmazsa konumu değiştirip daha geniş bir bölgede ara.
            </Text>
          </Card>
        ) : null}
      </View>

      {others.length > 0 && (
        <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
          <Text variant="overline" tone="subtle" style={{ marginBottom: 10 }}>
            {best ? 'Açmazsa sıradaki' : 'Aranabilecek klinikler'}
          </Text>
          {others.map((c) => (
            <AltRow key={c.id} clinic={c} onDirections={() => setDirClinic(c)} />
          ))}
          <Button title="Tüm yakın klinikler" variant="ghost" icon="list" onPress={() => router.push('/(tabs)/nearby')} style={{ alignSelf: 'flex-start' }} />
        </View>
      )}

      {/* 2 — Ararken söyle */}
      <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <IconBadge name="chatbubble-ellipses-outline" size={36} />
            <Text variant="headline">Ararken şunları söyle</Text>
          </View>
          {pets.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
              {pets.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setPetId(p.id)}
                  style={{
                    paddingHorizontal: 14,
                    height: 34,
                    borderRadius: radius.pill,
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: pet?.id === p.id ? t.primary : t.border,
                    backgroundColor: pet?.id === p.id ? t.primarySoft : 'transparent',
                  }}
                >
                  <Text variant="caption" color={pet?.id === p.id ? t.primary : t.text}>
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          {pet ? <PetScript pet={pet} /> : <GenericScript />}
        </Card>
      </View>

      {/* 3 — Yola çıkmadan önce */}
      <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <IconBadge name="bag-handle-outline" size={36} />
            <Text variant="headline">Yola çıkmadan önce</Text>
          </View>
          <View style={{ gap: 12 }}>
            {BEFORE_YOU_GO.map((item, i) => {
              const done = checked.includes(i);
              return (
                <Checkbox key={item} checked={done} onPress={() => setChecked((c) => (done ? c.filter((x) => x !== i) : [...c, i]))}>
                  <Text variant="body" tone={done ? 'subtle' : 'default'} style={done ? { textDecorationLine: 'line-through' } : undefined}>
                    {item}
                  </Text>
                </Checkbox>
              );
            })}
          </View>
        </Card>
      </View>

      {/* 4 — Veterinere ulaşana kadar */}
      <View style={{ paddingHorizontal: 20, marginTop: 26 }}>
        <Text variant="headline">Veterinere ulaşana kadar</Text>
        <Text variant="caption" tone="muted" style={{ marginTop: 2, marginBottom: 12 }}>
          Tedavi değildir; zarar vermemek ve zaman kazanmak içindir. Veterinerin söyledikleri her zaman önce gelir.
        </Text>
        <FirstAidList />
      </View>

      <DataAttribution clinics={[...(best ? [best] : []), ...others]} />
      <Text variant="caption" tone="subtle" center style={{ paddingHorizontal: 32 }}>
        Pati SOS teşhis ya da tedavi önermez. Klinik bilgileri değişebilir; gitmeden önce ara.
      </Text>

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
    </Screen>
  );
}

function BestClinicCard({ clinic, onDirections }: { clinic: Clinic; onDirections: () => void }) {
  const t = useTheme();
  const s = clinicStatus(clinic);
  const target = phoneOf(clinic);
  return (
    <View style={{ borderRadius: radius.xl, backgroundColor: t.surface, borderWidth: 2, borderColor: t.primary, padding: 20 }}>
      <Text variant="overline" tone="primary">
        En uygun seçenek
      </Text>
      <Text variant="title" style={{ marginTop: 6 }} numberOfLines={2}>
        {clinic.name}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        <Badge label={s.label} tone="open" dot />
        {clinic.distance_km > 0 ? <Badge label={formatDistance(clinic.distance_km)} tone="neutral" icon="navigate-outline" /> : null}
        {s.closingSoon ? <Badge label={s.closingSoon} tone="honey" icon="time-outline" /> : null}
        {clinic.is_verified ? <Badge label="Klinik onaylı" tone="primary" icon="shield-checkmark" /> : null}
      </View>
      {clinic.address ? (
        <Text variant="caption" tone="muted" numberOfLines={1} style={{ marginTop: 10 }}>
          {clinic.address}
        </Text>
      ) : null}
      {s.closingSoon ? (
        <Text variant="caption" tone="sos" style={{ marginTop: 6 }}>
          Kapanmak üzere — geldiğini haber vermek için hemen ara.
        </Text>
      ) : null}

      <Button
        title="Şimdi ara"
        subtitle={target.phone ?? undefined}
        icon="call"
        size="lg"
        full
        onPress={() => callClinic(target, 'emergency')}
        style={{ marginTop: 16 }}
        accessibilityLabel={`${clinic.name} şimdi ara`}
      />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <Button title="Yol tarifi" icon="navigate-outline" variant="secondary" onPress={onDirections} style={{ flex: 1 }} />
        <Button title="Detaylar" icon="information-circle-outline" variant="secondary" onPress={() => router.push(`/clinic/${clinic.id}`)} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function AltRow({ clinic, onDirections }: { clinic: Clinic; onDirections: () => void }) {
  const t = useTheme();
  const s = clinicStatus(clinic);
  return (
    <Card style={{ marginBottom: 8, paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable style={{ flex: 1 }} onPress={() => router.push(`/clinic/${clinic.id}`)} accessibilityRole="button">
          <Text variant="bodyStrong" numberOfLines={1}>
            {clinic.name}
          </Text>
          <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
            {[s.closingSoon ?? s.label, clinic.distance_km > 0 ? formatDistance(clinic.distance_km) : null].filter(Boolean).join(' · ')}
          </Text>
        </Pressable>
        {canCall(clinic) ? (
          <Button
            title="Ara"
            icon="call"
            size="sm"
            variant={s.tone === 'open' ? 'primary' : 'soft'}
            onPress={() => callClinic(phoneOf(clinic), 'emergency_alt')}
            accessibilityLabel={`${clinic.name} ara`}
          />
        ) : (
          <Button title="Git" icon="navigate-outline" size="sm" variant="secondary" onPress={onDirections} />
        )}
      </View>
    </Card>
  );
}

function PetScript({ pet }: { pet: Pet }) {
  const t = useTheme();
  const intro = [
    `${speciesLabel(pet.species, true)} ${pet.name}`,
    pet.breed,
    pet.age_years != null ? `${pet.age_years} yaşında` : null,
    pet.weight_kg != null ? `${pet.weight_kg} kg` : null,
  ]
    .filter(Boolean)
    .join(', ');
  const facts = [
    pet.allergies ? { k: 'Alerji', v: pet.allergies } : null,
    pet.medications ? { k: 'İlaçlar', v: pet.medications } : null,
    pet.chronic_conditions ? { k: 'Kronik', v: pet.chronic_conditions } : null,
    pet.emergency_note ? { k: 'Not', v: pet.emergency_note } : null,
  ].filter(Boolean) as { k: string; v: string }[];
  return (
    <View style={{ marginTop: 14 }}>
      <Text variant="body">
        "Merhaba, acil bir durum için arıyorum. <Text variant="bodyStrong">{intro}.</Text>"
      </Text>
      <View style={{ borderRadius: radius.md, padding: 12, marginTop: 12, backgroundColor: t.sosSoft }}>
        <Text variant="bodyStrong" tone="sos">
          Sen ekle: ne oldu, ne zaman başladı?
        </Text>
        <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
          Yediği ya da yuttuğu bir şey varsa ne olduğunu söyle.
        </Text>
      </View>
      {facts.map((f) => (
        <View key={f.k} style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Text variant="bodyStrong" style={{ width: 70 }}>
            {f.k}
          </Text>
          <Text variant="body" style={{ flex: 1 }}>
            {f.v}
          </Text>
        </View>
      ))}
      <Text variant="body" tone="muted" style={{ marginTop: 12 }}>
        "Şimdi gelebilir miyim? Yaklaşık ne kadar beklerim?"
      </Text>
    </View>
  );
}

function GenericScript() {
  const t = useTheme();
  return (
    <View style={{ marginTop: 12, gap: 8 }}>
      {[
        'Hayvanın türü, yaşı ve yaklaşık kilosu',
        'Ne oldu ve ne zaman başladı',
        'Yediği ya da yuttuğu bir şey varsa ne olduğu',
        'Kullandığı ilaçlar ve bilinen hastalıkları',
        '"Şimdi gelebilir miyim?"',
      ].map((x) => (
        <View key={x} style={{ flexDirection: 'row', gap: 10 }}>
          <Icon name="ellipse" size={8} color={t.primary} />
          <Text variant="body" style={{ flex: 1, marginTop: -6 }}>
            {x}
          </Text>
        </View>
      ))}
      <Button title="Sonraki sefer için acil kart oluştur" variant="ghost" icon="id-card-outline" onPress={() => router.push('/pets/create')} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
    </View>
  );
}
