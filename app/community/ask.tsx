import React, { useEffect, useMemo, useState } from 'react';
import { View, Image, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Header, Text, Field, Segmented, Chip, Button, Icon, Card, IconButton } from '@/components/ds';
import { RulesSheet } from '@/components/community/Safety';
import { useTheme, radius } from '@/lib/theme';
import { TOPICS, postQuestion, type Species, type TopicKey } from '@/lib/data/qa';
import { hasAcceptedRules, acceptRules } from '@/lib/data/safety';
import { checkCommunityText, looksLikeEmergency } from '@/lib/utils/moderation';
import { loadPets } from '@/lib/data/localStore';
import { getAuthorName, setAuthorName } from '@/lib/deviceId';
import { useSession } from '@/stores/session';
import { track } from '@/lib/analytics';
import type { Pet } from '@/types';

function petSummary(p: Pet): string {
  return [
    p.breed,
    p.age_years != null ? `${String(p.age_years).replace('.', ',')} yaşında` : null,
    p.weight_kg != null ? `${String(p.weight_kg).replace('.', ',')} kg` : null,
    p.chronic_conditions ? `Kronik: ${p.chronic_conditions}` : null,
    p.medications ? `İlaçlar: ${p.medications}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

export default function AskScreen() {
  const t = useTheme();
  const vet = useSession((s) => s.vet);
  const [species, setSpecies] = useState<Species>('dog');
  const [topic, setTopic] = useState<TopicKey | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [pet, setPet] = useState<Pet | null>(null);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPets().then((list) => {
      const p = list.find((x) => x.is_primary) ?? list[0] ?? null;
      setPet(p);
      if (p?.species === 'cat' || p?.species === 'dog') setSpecies(p.species);
      else if (p) setSpecies('other');
    });
    getAuthorName().then((n) => setName(n === 'Pati dostu' ? '' : n));
  }, []);

  const emergency = useMemo(() => looksLikeEmergency(`${title} ${body}`), [title, body]);
  const canSend = title.trim().length >= 10 && !!topic && !saving;

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Galeri izni gerekli', 'Fotoğraf eklemek için Ayarlar’dan galeri erişimine izin ver.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5, allowsEditing: true });
    if (!res.canceled && res.assets?.[0]) setPhoto(res.assets[0].uri);
  };

  const addPetInfo = () => {
    if (!pet) return;
    const line = `${pet.name}: ${petSummary(pet)}`;
    setBody((b) => (b.includes(line) ? b : b ? `${b.trim()}\n\n${line}` : line));
  };

  const submit = async (skipRules = false) => {
    setError(null);
    const problem = checkCommunityText(`${title}\n${body}\n${name}`);
    if (problem) {
      setError(problem);
      return;
    }
    if (!skipRules && !(await hasAcceptedRules())) {
      setRules(true);
      return;
    }
    setSaving(true);
    if (!vet) await setAuthorName(name.trim() || 'Pati dostu');
    const res = await postQuestion({ species, topic: topic ?? 'diger', title, body, photoUri: photo });
    setSaving(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    track('question_posted', { topic: topic ?? 'diger', species, photo: !!photo });
    router.replace(`/community/${res.id}`);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 }}>
          <IconButton icon="close" onPress={() => router.back()} accessibilityLabel="Kapat" size={40} />
          <Button title="Paylaş" size="sm" disabled={!canSend} loading={saving} onPress={() => submit()} />
        </View>
        <Screen scroll edges={[]} contentStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
          <View style={{ marginHorizontal: -20, marginBottom: 8 }}>
            <Header title="Soru sor" subtitle="Veteriner hekimler ve pati sahipleri yanıtlar." />
          </View>

          {emergency ? (
            <Card tone="sos" style={{ marginBottom: 18 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Icon name="alert-circle" size={24} color={t.sos} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">Bu belirtiler acil olabilir</Text>
                  <Text variant="callout" tone="muted" style={{ marginTop: 2 }}>
                    Topluluktan yanıt gelmesi saatler sürebilir. Hemen bir veterineri ara; sonra buraya dönebilirsin.
                  </Text>
                  <Button title="Acil veteriner bul" variant="sos" icon="call" onPress={() => router.push('/emergency')} style={{ marginTop: 12 }} full />
                </View>
              </View>
            </Card>
          ) : null}

          <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>
            Dostun
          </Text>
          <Segmented
            options={[
              { key: 'dog', label: 'Köpek', icon: 'paw-outline' },
              { key: 'cat', label: 'Kedi', icon: 'paw-outline' },
              { key: 'other', label: 'Diğer', icon: 'ellipsis-horizontal' },
            ]}
            value={species}
            onChange={setSpecies}
          />

          <Text variant="caption" tone="muted" style={{ marginBottom: 8 }}>
            Konu
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {TOPICS.map((x) => (
              <Chip key={x.key} label={x.label} icon={x.icon} active={topic === x.key} onPress={() => setTopic(x.key)} />
            ))}
          </View>

          <Field
            label="Sorun"
            value={title}
            onChangeText={setTitle}
            maxLength={120}
            placeholder="Ör. Kedim 2 gündür mamasını az yiyor, normal mi?"
            hint={title.trim().length > 0 && title.trim().length < 10 ? 'Biraz daha açık yazar mısın?' : `${title.length}/120`}
          />
          <Field
            label="Ayrıntılar (isteğe bağlı)"
            value={body}
            onChangeText={setBody}
            maxLength={2000}
            multiline
            placeholder="Yaşı, ne zamandır sürdüğü, yediği mama, fark ettiğin başka değişiklikler…"
            style={{ minHeight: 120 }}
          />
          {pet ? (
            <Pressable onPress={addPetInfo} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6, marginBottom: 18 }}>
              <Icon name="add-circle-outline" size={18} color={t.primary} />
              <Text variant="caption" tone="primary">
                {pet.name} kartındaki bilgileri ekle
              </Text>
            </Pressable>
          ) : null}

          <Text variant="caption" tone="muted" style={{ marginBottom: 8 }}>
            Fotoğraf (isteğe bağlı)
          </Text>
          {photo ? (
            <View style={{ alignSelf: 'flex-start', marginBottom: 18 }}>
              <Image source={{ uri: photo }} style={{ width: 120, height: 120, borderRadius: radius.md }} />
              <View style={{ position: 'absolute', top: 6, right: 6 }}>
                <IconButton icon="close" onPress={() => setPhoto(null)} accessibilityLabel="Fotoğrafı kaldır" size={30} />
              </View>
            </View>
          ) : (
            <Pressable
              onPress={pickPhoto}
              accessibilityRole="button"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: t.borderStrong,
                borderRadius: radius.md,
                padding: 14,
                marginBottom: 18,
              }}
            >
              <Icon name="image-outline" size={22} color={t.textMuted} />
              <Text variant="callout" tone="muted">
                Görmek yardımcı olabilir: tüy, göz, deri, dışkı…
              </Text>
            </Pressable>
          )}

          {!vet ? (
            <Field label="Görünecek adın" value={name} onChangeText={setName} maxLength={30} placeholder="Pati dostu" hint="Gerçek adını yazmak zorunda değilsin." />
          ) : null}

          {error ? (
            <Text variant="callout" tone="danger" style={{ marginBottom: 12 }}>
              {error}
            </Text>
          ) : null}

          <Button title="Soruyu paylaş" size="lg" full disabled={!canSend} loading={saving} onPress={() => submit()} />
          <Text variant="caption" tone="subtle" center style={{ marginTop: 12 }}>
            Yanıtlar muayenenin yerini tutmaz. Sorun herkese açık görünür.
          </Text>
        </Screen>
      </KeyboardAvoidingView>

      <RulesSheet
        visible={rules}
        onClose={() => setRules(false)}
        onAccept={async () => {
          await acceptRules();
          setRules(false);
          submit(true);
        }}
      />
    </Screen>
  );
}
