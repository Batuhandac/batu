// Hekim paneli formları: hasta kartı ve kayıt (aşı, parazit, kilo, not).
import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text, Button, Field, Segmented, Chip, Badge } from '@/components/ds';
import { useTheme } from '@/lib/theme';
import { daysUntil, formatDate, formatTRDate, parseTRDate, todayISO } from '@/lib/utils/dates';
import { RECORD_KINDS, recordKindLabel, suggestNextDue, type Patient, type RecordKind } from '@/lib/data/vetRecords';
import type { PatientInput, RecordInput } from '@/lib/data/panel';

export const SPECIES: { key: 'dog' | 'cat' | 'other'; label: string }[] = [
  { key: 'dog', label: 'Köpek' },
  { key: 'cat', label: 'Kedi' },
  { key: 'other', label: 'Diğer' },
];
export const speciesLabel = (s: string) => SPECIES.find((x) => x.key === s)?.label ?? 'Diğer';

const SEX = [
  { key: 'female', label: 'Dişi' },
  { key: 'male', label: 'Erkek' },
] as const;

function Row({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12 }}>{children}</View>;
}
function Col({ children, min = 200 }: { children: React.ReactNode; min?: number }) {
  return <View style={{ flexGrow: 1, flexBasis: min, minWidth: 0 }}>{children}</View>;
}

const num = (s: string) => {
  const n = Number(s.replace(',', '.'));
  return s.trim() && Number.isFinite(n) && n > 0 ? n : null;
};

export function PatientForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Patient>;
  submitLabel: string;
  onSubmit: (input: PatientInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [species, setSpecies] = useState<'dog' | 'cat' | 'other'>((initial?.species as 'dog') ?? 'dog');
  const [breed, setBreed] = useState(initial?.breed ?? '');
  const [sex, setSex] = useState<string | null>(initial?.sex ?? null);
  const [birth, setBirth] = useState(initial?.birth_date ? formatTRDate(initial.birth_date) : '');
  const [chip, setChip] = useState(initial?.chip_no ?? '');
  const [weight, setWeight] = useState(initial?.weight_kg ? String(initial.weight_kg).replace('.', ',') : '');
  const [allergies, setAllergies] = useState(initial?.allergies ?? '');
  const [ownerName, setOwnerName] = useState(initial?.owner_name ?? '');
  const [ownerPhone, setOwnerPhone] = useState(initial?.owner_phone ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const birthISO = birth.trim() ? parseTRDate(birth) : null;
  const submit = async () => {
    if (!name.trim()) return setError('Dostun adını yaz.');
    if (birth.trim() && !birthISO) return setError('Doğum tarihini GG.AA.YYYY biçiminde yaz.');
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        name,
        species,
        breed,
        sex,
        birth_date: birthISO,
        chip_no: chip,
        weight_kg: num(weight),
        allergies,
        owner_name: ownerName,
        owner_phone: ownerPhone,
        note,
      });
    } catch {
      setError('Kaydedilemedi. Bağlantını kontrol edip tekrar dene.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <Row>
        <Col>
          <Field label="Adı" value={name} onChangeText={setName} placeholder="Boncuk" />
        </Col>
        <Col>
          <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>
            Türü
          </Text>
          <Segmented options={SPECIES} value={species} onChange={setSpecies} />
        </Col>
      </Row>
      <Row>
        <Col>
          <Field label="Irkı" value={breed} onChangeText={setBreed} placeholder="Tekir, Golden…" />
        </Col>
        <Col>
          <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>
            Cinsiyeti
          </Text>
          <Segmented options={[...SEX]} value={sex as 'female' | 'male' | null} onChange={(k) => setSex(k === sex ? null : k)} />
        </Col>
      </Row>
      <Row>
        <Col min={150}>
          <Field label="Doğum tarihi" value={birth} onChangeText={setBirth} placeholder="GG.AA.YYYY" />
        </Col>
        <Col min={150}>
          <Field label="Kilo (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="4,2" />
        </Col>
        <Col min={150}>
          <Field label="Çip numarası" value={chip} onChangeText={setChip} keyboardType="number-pad" />
        </Col>
      </Row>
      <Field label="Alerjiler" value={allergies} onChangeText={setAllergies} placeholder="Yoksa boş bırak" />
      <Row>
        <Col>
          <Field label="Sahibinin adı" value={ownerName} onChangeText={setOwnerName} />
        </Col>
        <Col>
          <Field label="Sahibinin telefonu" value={ownerPhone} onChangeText={setOwnerPhone} keyboardType="phone-pad" placeholder="05xx xxx xx xx" hint="WhatsApp hatırlatması için" />
        </Col>
      </Row>
      <Field label="Not" value={note} onChangeText={setNote} multiline />
      {error ? (
        <Text variant="caption" tone="danger" style={{ marginBottom: 10 }}>
          {error}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title={submitLabel} loading={busy} onPress={submit} />
        {onCancel ? <Button title="Vazgeç" variant="ghost" onPress={onCancel} /> : null}
      </View>
    </View>
  );
}

export function RecordForm({ onSubmit }: { onSubmit: (r: RecordInput) => Promise<void> }) {
  const t = useTheme();
  const [kind, setKind] = useState<RecordKind>('vaccine');
  const [title, setTitle] = useState(recordKindLabel('vaccine'));
  const [titleTouched, setTitleTouched] = useState(false);
  const [date, setDate] = useState(formatTRDate(todayISO()));
  const [next, setNext] = useState(formatTRDate(suggestNextDue('vaccine', todayISO())!));
  const [nextTouched, setNextTouched] = useState(false);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const dateISO = parseTRDate(date);
  const hasNext = kind !== 'weight' && kind !== 'note';

  const pickKind = (k: RecordKind) => {
    setKind(k);
    if (!titleTouched) setTitle(recordKindLabel(k));
    if (!nextTouched) {
      const s = dateISO ? suggestNextDue(k, dateISO) : null;
      setNext(s ? formatTRDate(s) : '');
    }
  };
  const changeDate = (v: string) => {
    setDate(v);
    const iso = parseTRDate(v);
    if (iso && !nextTouched) {
      const s = suggestNextDue(kind, iso);
      setNext(s ? formatTRDate(s) : '');
    }
  };

  const submit = async () => {
    if (!dateISO) return setError('Tarihi GG.AA.YYYY biçiminde yaz.');
    const nextISO = hasNext && next.trim() ? parseTRDate(next) : null;
    if (hasNext && next.trim() && !nextISO) return setError('Sonraki tarihi GG.AA.YYYY biçiminde yaz.');
    if (nextISO && nextISO <= dateISO) return setError('Sonraki tarih, yapılan tarihten sonra olmalı.');
    const kg = num(weight);
    if (kind === 'weight' && !kg) return setError('Kiloyu yaz.');
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ kind, title: title.trim() || recordKindLabel(kind), date: dateISO, next_due: nextISO, note, weight_kg: kg });
      setSaved(`${title.trim() || recordKindLabel(kind)} kaydedildi.`);
      setNote('');
      setWeight('');
      setTimeout(() => setSaved(null), 3000);
    } catch {
      setError('Kaydedilemedi. Bağlantını kontrol edip tekrar dene.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {RECORD_KINDS.map((k) => (
          <Chip key={k.key} label={k.label} active={kind === k.key} onPress={() => pickKind(k.key)} onSurface />
        ))}
      </View>
      <Row>
        <Col>
          <Field
            label="Başlık"
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              setTitleTouched(true);
            }}
            hint="Aşının ya da ilacın adı da olabilir"
          />
        </Col>
        <Col min={150}>
          <Field label="Tarih" value={date} onChangeText={changeDate} placeholder="GG.AA.YYYY" />
        </Col>
        {hasNext ? (
          <Col min={150}>
            <Field
              label="Sonraki"
              value={next}
              onChangeText={(v) => {
                setNext(v);
                setNextTouched(true);
              }}
              placeholder="GG.AA.YYYY"
              hint="Sahibine bu tarihte hatırlatılır"
            />
          </Col>
        ) : null}
        <Col min={120}>
          <Field label="Kilo (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder={kind === 'weight' ? 'Zorunlu' : 'İsteğe bağlı'} />
        </Col>
      </Row>
      <Field label="Not" value={note} onChangeText={setNote} multiline placeholder="Uygulanan ürün, doz, bulgular…" />
      {error ? (
        <Text variant="caption" tone="danger" style={{ marginBottom: 10 }}>
          {error}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Button title="Kaydı ekle" icon="add" loading={busy} onPress={submit} />
        {saved ? (
          <Text variant="callout" color={t.open}>
            {saved}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** İki adımlı silme: web'de Alert olmadığı için satır içinde onay ister. */
export function ConfirmButton({ label, confirmLabel, onConfirm }: { label: string; confirmLabel: string; onConfirm: () => void }) {
  const t = useTheme();
  const [armed, setArmed] = useState(false);
  return (
    <Pressable
      onPress={() => (armed ? onConfirm() : setArmed(true))}
      onBlur={() => setArmed(false)}
      accessibilityRole="button"
      hitSlop={8}
    >
      <Text variant="caption" color={armed ? t.danger : t.textSubtle} style={{ fontWeight: '700' }}>
        {armed ? confirmLabel : label}
      </Text>
    </Pressable>
  );
}

/** Sıradaki aşı/kontrol etiketi: gecikmiş kırmızı, 7 gün içinde sarı. */
export function DueBadge({ date, title }: { date: string; title: string | null }) {
  const d = daysUntil(date);
  const tone = d < 0 ? 'sos' : d <= 7 ? 'honey' : 'neutral';
  const when = d < 0 ? `${-d} gün gecikti` : d === 0 ? 'Bugün' : d === 1 ? 'Yarın' : d <= 7 ? `${d} gün sonra` : formatDate(date);
  return <Badge label={title ? `${title} · ${when}` : when} tone={tone} dot />;
}
