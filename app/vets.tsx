import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Header, Text, Card, IconBadge, Field, Group, ListRow, Button, type IconName } from '@/components/ds';
import { searchClinicsByName, trFold } from '@/lib/data/query';
import { allRegisteredClinics } from '@/lib/data/registry';

const POINTS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'pricetag-outline', title: 'Tamamen ücretsiz', text: 'Başvuru, doğrulama ve profil ücretsizdir. Ücretli üyelik yoktur.' },
  {
    icon: 'scale-outline',
    title: 'Reklam değil, bilgi',
    text: 'Sıralama satın alınamaz. Sıra yalnızca şu an açık olmaya, mesafeye ve bilgilerin eksiksiz olmasına göre belirlenir. Tanıtım metni, kampanya ya da övgü yayımlanmaz.',
  },
  { icon: 'call-outline', title: 'Doğru numara, doğru saat', text: 'Klinik telefonunuz, çalışma saatleriniz ve varsa mesai dışı hattınız hasta sahiplerine doğrudan gösterilir.' },
  { icon: 'shield-checkmark-outline', title: 'Klinik onaylı rozeti', text: 'Telefonla doğrulanan klinikler "Klinik onaylı" görünür; hasta sahipleri bilgilerin güncel olduğunu bilir.' },
  { icon: 'chatbubbles-outline', title: 'Hasta sahipleriyle mesajlaşma', text: 'Randevu ve acil olmayan sorular uygulama içinden size gelir; yeni mesajda telefonunuza bildirim düşer. İstediğiniz an kapatabilirsiniz.' },
  { icon: 'school-outline', title: 'Bilginizle görünür olun', text: 'Topluluktaki sorulara "Veteriner hekim" rozeti ve klinik adınızla yanıt verin. Reklam değil, meslektaşça bilgi paylaşımı.' },
];

// Veteriner hekimler Türkiye'de reklam veremiyor. Bu ekran onlara reklam değil,
// doğru bilgiyle bulunabilirlik sunar: ücretsiz, sıralaması satın alınamaz.
export default function VetsScreen() {
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const fq = trFold(q);
    if (fq.length < 2) return [];
    const seen = new Set<string>();
    const out: { id: string; name: string; sub: string }[] = [];
    const add = (id: string, name: string, sub: string) => {
      if (seen.has(id)) return;
      seen.add(id);
      out.push({ id, name, sub });
    };
    for (const c of allRegisteredClinics()) {
      if (trFold(c.name).includes(fq)) add(c.id, c.name, [c.district, c.city].filter(Boolean).join(', ') || (c.address ?? ''));
    }
    for (const c of searchClinicsByName(q, 30)) add(c.id, c.name, [c.district, c.city].filter(Boolean).join(', ') || (c.address ?? ''));
    return out.slice(0, 20);
  }, [q]);

  return (
    <Screen scroll>
      <Header
        title="Veteriner hekimler için"
        subtitle="Gece 03:00'te hayvanı hastalanan biri açık veteriner arıyor. Kliniğinizin orada doğru bilgiyle görünmesi için hiçbir ücret ödemezsiniz."
        onBack={() => router.back()}
      />
      <View style={{ paddingHorizontal: 20 }}>
        <Card>
          <View style={{ gap: 18 }}>
            {POINTS.map((p) => (
              <View key={p.title} style={{ flexDirection: 'row', gap: 14 }}>
                <IconBadge name={p.icon} size={40} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{p.title}</Text>
                  <Text variant="callout" tone="muted" style={{ marginTop: 2 }}>
                    {p.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <Text variant="headline" style={{ marginTop: 28 }}>
          Kliniğinizi bulun
        </Text>
        <Text variant="callout" tone="muted" style={{ marginTop: 2, marginBottom: 14 }}>
          Adını yazın, listeden seçin ve bilgilerinizi gönderin.
        </Text>
        <Field label="Klinik adı" value={q} onChangeText={setQ} placeholder="Örn. Pati Veteriner Kliniği" autoCorrect={false} />

        {results.length > 0 && (
          <Group>
            {results.map((r, i) => (
              <ListRow key={r.id} icon="business-outline" title={r.name} subtitle={r.sub || undefined} onPress={() => router.push(`/clinic/${r.id}/claim`)} last={i === results.length - 1} />
            ))}
          </Group>
        )}
        {trFold(q).length >= 2 && results.length === 0 && (
          <Text variant="callout" tone="muted">
            Bu isimde klinik bulamadık.
          </Text>
        )}

        <Button title="Kliniğim listede yok" icon="add-circle-outline" variant="secondary" full onPress={() => router.push('/clinic/new/claim')} style={{ marginTop: 18 }} />

        <Text variant="caption" tone="subtle" style={{ marginTop: 20 }}>
          Patiport tıbbi hizmet sunmaz ve klinikler arasında tavsiyede bulunmaz. Gösterilen bilgiler
          yalnızca hasta sahiplerinin açık bir kliniğe ulaşmasını kolaylaştırmak içindir.
        </Text>
      </View>
    </Screen>
  );
}
