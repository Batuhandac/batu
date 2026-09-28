// Dost sayfasında "Veterinerin": kodla kliniğe bağlama ve klinikten gelen kayıtlar.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Share } from 'react-native';
import { Text, Card, Button, Section, Sheet, IconBadge, useToast } from '@/components/ds';
import { useTheme, radius } from '@/lib/theme';
import { formatDate } from '@/lib/utils/dates';
import { createPetLink, fetchVetRecords, loadVetLinks, refreshVetLinks, syncVetRecords, type VetLink } from '@/lib/data/vetLink';
import type { VetRecord } from '@/lib/data/vetRecords';
import type { Pet } from '@/types';

export function VetLinkSection({ pet, onChanged }: { pet: Pet; onChanged: () => void }) {
  const t = useTheme();
  const toast = useToast((s) => s.show);
  const [links, setLinks] = useState<VetLink[]>([]);
  const [records, setRecords] = useState<VetRecord[]>([]);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linked = links.filter((l) => l.clinic_id);

  const refresh = useCallback(async () => {
    setLinks(await loadVetLinks(pet.id));
    const all = await refreshVetLinks().catch(() => null);
    if (!all) return;
    const mine = all.filter((l) => l.pet_id === pet.id);
    setLinks(mine);
    const added = await syncVetRecords().catch(() => []);
    const forPet = added.filter((a) => a.pet_id === pet.id);
    if (forPet.length) {
      toast(`${forPet[0].clinic_name} ${forPet.length} kayıt ekledi: ${forPet.map((a) => a.title).join(', ')}`, 'medkit');
      onChanged();
    }
    const first = mine.find((l) => l.clinic_id);
    if (first) setRecords(await fetchVetRecords(first).catch(() => []));
  }, [pet.id, toast, onChanged]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getCode = async () => {
    setBusy(true);
    setError(null);
    const r = await createPetLink(pet);
    setBusy(false);
    if ('code' in r) setCode(r.code);
    else setError(r.error);
  };

  return (
    <Section title="Veterinerin">
      <Card style={{ gap: 12 }}>
        {linked.length > 0 ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconBadge name="medkit" size={40} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{linked.map((l) => l.clinic_name).join(', ')}</Text>
                <Text variant="caption" tone="muted">
                  Aşı ve muayene kayıtları buraya kendiliğinden gelir, sonraki tarihler takvime eklenir.
                </Text>
              </View>
            </View>
            {records.slice(0, 5).map((r) => (
              <View key={r.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
                  {r.title}
                </Text>
                <Text variant="caption" tone="muted">
                  {formatDate(r.date)}
                  {r.next_due ? ` · sonraki ${formatDate(r.next_due, false)}` : ''}
                </Text>
              </View>
            ))}
            <Button title="Başka bir veterinere de bağla" variant="ghost" size="sm" onPress={getCode} loading={busy} style={{ alignSelf: 'flex-start', marginLeft: -8 }} />
          </>
        ) : (
          <>
            <Text variant="body">
              Veterinerin Patiport hekim panelini kullanıyorsa, yaptığı aşılar ve muayene notları {pet.name} için buraya gelir; sonraki aşının
              hatırlatması kendiliğinden kurulur.
            </Text>
            <Button title="Veterinerime bağla" icon="link" onPress={getCode} loading={busy} />
          </>
        )}
        {error ? (
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        ) : null}
      </Card>

      <Sheet visible={!!code} onClose={() => setCode(null)} title="Veterinerine bu kodu söyle">
        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          <View style={{ alignItems: 'center', paddingVertical: 20, borderRadius: radius.lg, backgroundColor: t.surface }}>
            <Text variant="display" selectable style={{ fontSize: 44, lineHeight: 52, letterSpacing: 8 }} accessibilityLabel={code?.split('').join(' ')}>
              {code}
            </Text>
            <Text variant="caption" tone="muted" style={{ marginTop: 6 }}>
              24 saat geçerli
            </Text>
          </View>
          <Text variant="callout" tone="muted">
            Veterinerin kodu Patiport hekim paneline yazınca {pet.name} kliniğin hastası olur. Bunun için adı, türü, ırkı, yaşı, kilosu, çip
            numarası ve alerjileri kliniğin görebileceği şekilde gönderilir.
          </Text>
          <Button
            title="Kodu paylaş"
            icon="share-outline"
            variant="secondary"
            full
            onPress={() => Share.share({ message: `${pet.name} için Patiport kodu: ${code}` }).catch(() => {})}
          />
          <Button
            title="Tamam"
            full
            onPress={() => {
              setCode(null);
              refresh();
            }}
          />
        </View>
      </Sheet>
    </Section>
  );
}
