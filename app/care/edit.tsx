import React, { useEffect, useState } from 'react';
import { View, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Header, Text, Field, Button, Chip, Segmented, DateField, Icon, useToast } from '@/components/ds';
import { PetAvatar } from '@/components/pets/PetAvatar';
import { useTheme } from '@/lib/theme';
import { loadPets } from '@/lib/data/localStore';
import { CARE_KINDS, REPEAT_OPTIONS, kindMeta, loadCare, saveCareItem, removeCareItem, completeCare, type CareKind } from '@/lib/data/care';
import { formatDate, todayISO, addDays } from '@/lib/utils/dates';
import { track } from '@/lib/analytics';
import type { Pet } from '@/types';

const QUICK = [
  { label: 'Bugün', days: 0 },
  { label: '1 hafta sonra', days: 7 },
  { label: '1 ay sonra', days: 30 },
  { label: '3 ay sonra', days: 90 },
  { label: '1 yıl sonra', days: 365 },
];

export default function CareEditScreen() {
  const t = useTheme();
  const toast = useToast((s) => s.show);
  const params = useLocalSearchParams<{ petId?: string; id?: string; kind?: CareKind }>();
  const [pets, setPets] = useState<Pet[]>([]);
  const [petId, setPetId] = useState<string | null>(params.petId ?? null);
  const [kind, setKind] = useState<CareKind>(params.kind ?? 'vaccine');
  const [title, setTitle] = useState(kindMeta(params.kind ?? 'vaccine').label);
  const [titleEdited, setTitleEdited] = useState(false);
  const [due, setDue] = useState<string | null>(addDays(todayISO(), 30));
  const [repeat, setRepeat] = useState<number | null>(kindMeta(params.kind ?? 'vaccine').repeat);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = !!params.id;

  useEffect(() => {
    loadPets().then((list) => {
      setPets(list);
      if (!petId && list[0]) setPetId((list.find((p) => p.is_primary) ?? list[0]).id);
    });
    if (params.id) {
      loadCare().then((all) => {
        const c = all.find((x) => x.id === params.id);
        if (!c) return;
        setPetId(c.pet_id);
        setKind(c.kind);
        setTitle(c.title);
        setTitleEdited(true);
        setDue(c.due);
        setRepeat(c.repeat_days);
        setNote(c.note ?? '');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickKind = (k: CareKind) => {
    setKind(k);
    const m = kindMeta(k);
    if (!titleEdited) setTitle(m.label);
    setRepeat(m.repeat);
  };

  const pet = pets.find((p) => p.id === petId) ?? null;
  const repeatKey = REPEAT_OPTIONS.find((r) => r.days === repeat)?.key ?? (repeat ? 'custom' : 'none');
  const canSave = !!petId && !!due && title.trim().length > 0 && !saving;

  const save = async () => {
    if (!petId || !due) return;
    setSaving(true);
    await saveCareItem({ id: params.id, pet_id: petId, kind, title, due, repeat_days: repeat, note });
    setSaving(false);
    track('care_saved', { kind, repeat: repeat ?? 0 });
    toast(`${pet?.name ?? 'Dostun'} için ${formatDate(due, false)} tarihine kaydedildi`, 'calendar');
    router.back();
  };

  const markDone = async () => {
    if (!params.id) return;
    const next = await completeCare(params.id);
    toast(next ? `Aferin, yapıldı. Sonraki: ${formatDate(next.due, false)}` : 'Aferin, yapıldı.', 'paw');
    router.back();
  };

  const remove = () =>
    Alert.alert('Silinsin mi?', 'Bu hatırlatma ve bildirimi silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          if (params.id) await removeCareItem(params.id);
          router.back();
        },
      },
    ]);

  if (pets.length === 0) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header title="Bakım ekle" onBack={() => router.back()} />
        <View style={{ paddingHorizontal: 20 }}>
          <Text variant="body" tone="muted">
            Önce dostunu ekle; sonra aşı ve parazit günlerini hatırlatalım.
          </Text>
          <Button title="Dost ekle" icon="add" full onPress={() => router.replace('/pets/create')} style={{ marginTop: 20 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen scroll edges={[]}>
          <Header title={editing ? 'Bakımı düzenle' : 'Bakım ekle'} subtitle="Bir gün önce ve gününde hatırlatırız." onBack={() => router.back()} />
          <View style={{ paddingHorizontal: 20 }}>
            {pets.length > 1 ? (
              <>
                <Text variant="caption" tone="muted" style={{ marginBottom: 8 }}>
                  Kimin için?
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
                  {pets.map((p) => {
                    const on = p.id === petId;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => setPetId(p.id)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          paddingLeft: 4,
                          paddingRight: 14,
                          height: 44,
                          borderRadius: 22,
                          borderWidth: 1.5,
                          borderColor: on ? t.primary : 'transparent',
                          backgroundColor: t.surface,
                        }}
                      >
                        <PetAvatar pet={p} size={34} />
                        <Text variant="callout" color={on ? t.primary : t.text}>
                          {p.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            <Text variant="caption" tone="muted" style={{ marginBottom: 8 }}>
              Ne zaman ne yapılacak?
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {CARE_KINDS.map((k) => (
                <Chip key={k.key} label={k.label} icon={k.icon} active={kind === k.key} onPress={() => pickKind(k.key)} />
              ))}
            </View>
            {kindMeta(kind).hint ? (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, marginTop: 4 }}>
                <Icon name="information-circle-outline" size={16} color={t.textSubtle} />
                <Text variant="caption" tone="subtle" style={{ flex: 1 }}>
                  {kindMeta(kind).hint}
                </Text>
              </View>
            ) : (
              <View style={{ height: 12 }} />
            )}

            <Field
              label="Başlık"
              value={title}
              onChangeText={(v) => {
                setTitle(v);
                setTitleEdited(true);
              }}
              maxLength={60}
            />
            <DateField label="Tarih" value={due} onChange={setDue} quick={QUICK} />
            <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>
              Tekrar
            </Text>
            <Segmented
              options={REPEAT_OPTIONS.map((r) => ({ key: r.key, label: r.label }))}
              value={repeatKey === 'custom' ? null : repeatKey}
              onChange={(k) => setRepeat(REPEAT_OPTIONS.find((r) => r.key === k)?.days ?? null)}
            />
            <Field label="Not (isteğe bağlı)" value={note} onChangeText={setNote} maxLength={200} placeholder="Ör. Ürün adı, doz, klinik" />

            <Button title="Kaydet" size="lg" full disabled={!canSave} loading={saving} onPress={save} />
            {editing ? (
              <>
                <Button title="Yapıldı olarak işaretle" variant="secondary" icon="checkmark" full onPress={markDone} style={{ marginTop: 10 }} />
                <Pressable onPress={remove} accessibilityRole="button" hitSlop={10} style={{ alignSelf: 'center', marginTop: 16, padding: 8 }}>
                  <Text variant="callout" tone="danger">
                    Sil
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </Screen>
      </KeyboardAvoidingView>
    </Screen>
  );
}
