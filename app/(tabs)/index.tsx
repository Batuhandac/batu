import React, { useCallback } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Text,
  Icon,
  IconBadge,
  Card,
  Section,
  Group,
  ListRow,
  Avatar,
  Button,
  LogoMark,
  Wordmark,
  type IconName,
} from '@/components/ds';
import { useTheme, radius, shadow } from '@/lib/theme';
import { usePets } from '@/lib/hooks/usePets';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useLocation } from '@/lib/hooks/useLocation';
import { speciesLabel } from '@/lib/utils/pets';
import { getRegisteredClinic } from '@/lib/data/registry';
import { getClinicById } from '@/lib/data/query';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

const QUICK: { icon: IconName; title: string; text: string; href: string }[] = [
  { icon: 'list', title: 'Yakın klinikler', text: 'Açık olanlar önce', href: '/(tabs)/nearby' },
  { icon: 'map', title: 'Harita', text: 'Çevrendeki klinikler', href: '/(tabs)/map' },
  { icon: 'bandage-outline', title: 'İlk yardım', text: 'Veterinere kadar', href: '/first-aid' },
  { icon: 'id-card-outline', title: 'Acil kart', text: 'Dostunun bilgileri', href: '/(tabs)/pets' },
];

export default function HomeScreen() {
  const t = useTheme();
  const { pets, load: loadPets } = usePets();
  const { favorites, load: loadFavs } = useFavorites();
  const { source, label } = useLocation();

  useFocusEffect(useCallback(() => { loadPets(); loadFavs(); }, [loadPets, loadFavs]));

  const primaryVet = favorites.find((f) => f.is_primary_vet);
  const primaryVetName = primaryVet
    ? getRegisteredClinic(primaryVet.clinic_id)?.name ?? getClinicById(primaryVet.clinic_id)?.name ?? 'Kayıtlı klinik'
    : null;

  const startEmergency = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    router.push('/emergency');
  };

  return (
    <Screen scroll>
      {/* Üst bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <LogoMark size={34} />
          <Wordmark size={21} />
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/nearby')}
          accessibilityRole="button"
          accessibilityLabel="Konum"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            maxWidth: 170,
            paddingHorizontal: 12,
            height: 36,
            borderRadius: radius.pill,
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
          }}
        >
          <Icon name={source === 'gps' ? 'navigate' : 'location-outline'} size={15} color={t.primary} />
          <Text variant="caption" numberOfLines={1}>
            {source === 'manual' ? label ?? 'Seçilen bölge' : source === 'gps' ? 'Konumun' : 'Konum seç'}
          </Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text variant="overline" tone="subtle">
          {greeting()}
        </Text>
        <Text variant="title" style={{ marginTop: 4 }}>
          Dostunun yanındayız.
        </Text>
      </View>

      {/* ACİL kartı */}
      <Pressable
        onPress={startEmergency}
        accessibilityRole="button"
        accessibilityLabel="Acil veteriner bul"
        style={({ pressed }) => ({
          marginHorizontal: 20,
          marginTop: 16,
          borderRadius: radius.xl,
          backgroundColor: pressed ? t.sosPressed : t.sos,
          padding: 22,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          ...shadow(t, 2),
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconBadge name="medkit" size={52} color={t.onSos} background="rgba(255,255,255,0.18)" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, height: 28, borderRadius: radius.pill }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.onSos }} />
            <Text variant="caption" color={t.onSos} style={{ fontSize: 12 }}>
              7/24
            </Text>
          </View>
        </View>
        <Text variant="title" color={t.onSos} style={{ marginTop: 18 }}>
          Acil veteriner bul
        </Text>
        <Text variant="callout" color="rgba(255,255,255,0.9)" style={{ marginTop: 4 }}>
          En yakın açık klinik, tek dokunuşla arama ve yolda yapman gerekenler.
        </Text>
        <View
          style={{
            marginTop: 18,
            height: 48,
            borderRadius: radius.md,
            backgroundColor: t.onSos,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Text variant="button" color={t.sos}>
            Hemen başla
          </Text>
          <Icon name="arrow-forward" size={18} color={t.sos} />
        </View>
      </Pressable>

      {/* Hızlı erişim */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginTop: 16 }}>
        {QUICK.map((q) => (
          <Card key={q.title} onPress={() => router.push(q.href as never)} style={{ width: '47.5%', flexGrow: 1 }} accessibilityLabel={q.title}>
            <IconBadge name={q.icon} size={40} />
            <Text variant="bodyStrong" style={{ marginTop: 12 }}>
              {q.title}
            </Text>
            <Text variant="caption" tone="muted">
              {q.text}
            </Text>
          </Card>
        ))}
      </View>

      {/* Dostlar */}
      <Section title="Dostların" action={pets.length > 0 ? 'Tümü' : undefined} onAction={() => router.push('/(tabs)/pets')}>
        {pets.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }} style={{ marginHorizontal: -20 }}>
            <View style={{ width: 8 }} />
            {pets.map((p) => (
              <Card key={p.id} onPress={() => router.push(`/pets/${p.id}`)} style={{ width: 200 }} accessibilityLabel={p.name}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar label={p.name} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {p.breed ?? speciesLabel(p.species)}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
            <Card onPress={() => router.push('/pets/create')} tone="alt" style={{ width: 150, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Dost ekle">
              <Icon name="add" size={22} color={t.primary} />
              <Text variant="caption" tone="primary">
                Dost ekle
              </Text>
            </Card>
            <View style={{ width: 8 }} />
          </ScrollView>
        ) : (
          <Card>
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <IconBadge name="paw" size={48} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Acil kartını şimdi hazırla</Text>
                <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
                  Kilo, alerji ve ilaç bilgisi acil anda ekranında olsun. 1 dakika sürer.
                </Text>
              </View>
            </View>
            <Button title="Kart oluştur" variant="soft" icon="add" onPress={() => router.push('/pets/create')} style={{ marginTop: 14 }} full />
          </Card>
        )}
      </Section>

      {primaryVetName && primaryVet && (
        <Section title="Veterinerin">
          <Group>
            <ListRow icon="heart" title={primaryVetName} subtitle="Düzenli veterinerin" onPress={() => router.push(`/clinic/${primaryVet.clinic_id}`)} last />
          </Group>
        </Section>
      )}

      {/* İpucu */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Card tone="honey">
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Icon name="information-circle" size={22} color={t.honey} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Gitmeden önce mutlaka ara</Text>
              <Text variant="callout" tone="muted" style={{ marginTop: 2 }}>
                Klinik dolu ya da o an kapalı olabilir. Aramak, varınca zaman kazandırır.
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Veteriner hekimlere */}
      <Pressable onPress={() => router.push('/vets')} style={{ paddingHorizontal: 20, marginTop: 20 }} accessibilityRole="button">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <Icon name="medical-outline" size={16} color={t.textMuted} />
          <Text variant="caption" tone="muted">
            Veteriner hekim misiniz?{' '}
            <Text variant="caption" tone="primary">
              Kliniğinizi ücretsiz doğrulayın
            </Text>
          </Text>
        </View>
      </Pressable>
    </Screen>
  );
}
