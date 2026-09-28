import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, Button, Card, Badge } from '@/components/ds';
import { PetFace } from '@/components/art';
import { PanelGate, PanelPage, useWide } from '@/components/panel/Shell';
import { ConfirmButton, DueBadge, PatientForm, RecordForm, speciesLabel } from '@/components/panel/Forms';
import { useTheme } from '@/lib/theme';
import { formatDate } from '@/lib/utils/dates';
import { petAge } from '@/lib/utils/pets';
import { addRecord, deletePatient, deleteRecord, getPatient, listRecords, updatePatient } from '@/lib/data/panel';
import { recordKindLabel, reminderText, waNumber, type Patient, type VetRecord } from '@/lib/data/vetRecords';
import type { VetProfile } from '@/lib/auth';

export default function PatientPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PanelGate>{(vet) => <PatientView vet={vet} id={String(id)} />}</PanelGate>;
}

function PatientView({ vet, id }: { vet: VetProfile; id: string }) {
  const t = useTheme();
  const wide = useWide();
  const [patient, setPatient] = useState<Patient | null | undefined>(undefined);
  const [records, setRecords] = useState<VetRecord[]>([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, r] = await Promise.all([getPatient(vet.clinic_id, id), listRecords(vet.clinic_id, id)]);
      setPatient(p);
      setRecords(r);
    } catch {
      setError('Hasta yüklenemedi. Bağlantını kontrol edip sayfayı yenile.');
      setPatient(null);
    }
  }, [vet.clinic_id, id]);
  useEffect(() => {
    load();
  }, [load]);

  const back = <Button title="Hastalar" icon="chevron-back" variant="ghost" size="sm" onPress={() => router.replace('/panel')} style={{ alignSelf: 'flex-start', marginTop: 12, marginLeft: -8 }} />;

  if (patient === undefined) {
    return (
      <PanelPage>
        {back}
        <ActivityIndicator style={{ marginTop: 40 }} />
      </PanelPage>
    );
  }
  if (!patient) {
    return (
      <PanelPage>
        {back}
        <Text variant="body" tone={error ? 'danger' : 'muted'} style={{ marginTop: 20 }}>
          {error ?? 'Bu hasta bulunamadı.'}
        </Text>
      </PanelPage>
    );
  }

  const p = patient;
  const age = petAge({ birth_date: p.birth_date, age_years: null });
  const wa = waNumber(p.owner_phone);

  const info = (
    <Card style={{ gap: 10 }}>
      {editing ? (
        <PatientForm
          initial={p}
          submitLabel="Kaydet"
          onCancel={() => setEditing(false)}
          onSubmit={async (input) => {
            await updatePatient(vet, p, input);
            setEditing(false);
            await load();
          }}
        />
      ) : (
        <>
          <Fact label="Tür" value={[speciesLabel(p.species), p.breed].filter(Boolean).join(', ')} />
          <Fact label="Yaş" value={age ? `${age}${p.birth_date ? ` (${formatDate(p.birth_date)})` : ''}` : null} />
          <Fact label="Cinsiyet" value={p.sex === 'female' ? 'Dişi' : p.sex === 'male' ? 'Erkek' : null} />
          <Fact label="Kilo" value={p.weight_kg ? `${String(p.weight_kg).replace('.', ',')} kg` : null} />
          <Fact label="Çip" value={p.chip_no} />
          <Fact label="Alerji" value={p.allergies} danger />
          <Fact label="Sahibi" value={[p.owner_name, p.owner_phone].filter(Boolean).join(' · ') || null} />
          <Fact label="Not" value={p.note} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
            <Button title="Düzenle" icon="create-outline" size="sm" variant="secondary" onPress={() => setEditing(true)} />
            {wa && p.next_due ? (
              <Button
                title="WhatsApp ile hatırlat"
                icon="logo-whatsapp"
                size="sm"
                variant="secondary"
                onPress={() => Linking.openURL(`https://wa.me/${wa}?text=${encodeURIComponent(reminderText(p, vet.clinic_name, formatDate(p.next_due!)))}`)}
              />
            ) : null}
          </View>
          <View style={{ marginTop: 6 }}>
            <ConfirmButton
              label="Hasta kartını sil"
              confirmLabel="Kart ve tüm kayıtlar silinsin mi? Onaylamak için tekrar dokun"
              onConfirm={async () => {
                await deletePatient(vet, p).catch(() => {});
                router.replace('/panel');
              }}
            />
          </View>
        </>
      )}
    </Card>
  );

  const history = (
    <View style={{ gap: 12 }}>
      <Card>
        <Text variant="headline" style={{ marginBottom: 12 }}>
          Kayıt ekle
        </Text>
        <RecordForm
          onSubmit={async (input) => {
            const r = await addRecord(vet, p, input, records);
            setRecords((prev) => [r, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
            const fresh = await getPatient(vet.clinic_id, p.id).catch(() => null);
            if (fresh) setPatient(fresh);
          }}
        />
        {p.owner_uid ? (
          <Text variant="caption" tone="subtle" style={{ marginTop: 10 }}>
            Sahibi uygulamayı açınca kayıt dostunun takvimine düşer; sonraki tarih için bir gün önce ve gününde hatırlatma kurulur.
          </Text>
        ) : null}
      </Card>
      <Text variant="headline" style={{ marginTop: 8 }}>
        Geçmiş
      </Text>
      {records.length === 0 ? (
        <Text variant="callout" tone="muted">
          Henüz kayıt yok.
        </Text>
      ) : (
        <Card padded={false}>
          {records.map((r, i) => (
            <View key={r.id} style={{ padding: 14, gap: 4, borderBottomWidth: i === records.length - 1 ? 0 : 1, borderBottomColor: t.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <Text variant="bodyStrong" style={{ flexShrink: 1 }}>
                  {r.title}
                </Text>
                <Text variant="caption" tone="muted">
                  {formatDate(r.date)}
                </Text>
              </View>
              <Text variant="caption" tone="muted">
                {[recordKindLabel(r.kind), r.weight_kg ? `${String(r.weight_kg).replace('.', ',')} kg` : null, r.next_due ? `Sonraki: ${formatDate(r.next_due)}` : null, r.vet_name]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              {r.note ? <Text variant="callout">{r.note}</Text> : null}
              <View style={{ alignSelf: 'flex-end' }}>
                <ConfirmButton
                  label="Sil"
                  confirmLabel="Silmek için tekrar dokun"
                  onConfirm={async () => {
                    await deleteRecord(vet, p, r, records).catch(() => {});
                    await load();
                  }}
                />
              </View>
            </View>
          ))}
        </Card>
      )}
    </View>
  );

  return (
    <PanelPage>
      {back}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8, marginBottom: 20 }}>
        <PetFace species={p.species} seed={p.id} size={64} background="auto" />
        <View style={{ flex: 1 }}>
          <Text variant="display" style={{ fontSize: 30, lineHeight: 38 }}>
            {p.name}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
            {p.owner_uid ? <Badge label="Sahibinin uygulamasına bağlı" tone="primary" icon="phone-portrait-outline" /> : <Badge label="Elle eklendi" />}
            {p.next_due ? <DueBadge date={p.next_due} title={p.next_due_title} /> : null}
          </View>
        </View>
      </View>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 24, alignItems: 'flex-start' }}>
        <View style={{ flex: wide ? 1 : undefined, alignSelf: 'stretch', minWidth: 0 }}>{info}</View>
        <View style={{ flex: wide ? 1.6 : undefined, alignSelf: 'stretch', minWidth: 0 }}>{history}</View>
      </View>
    </PanelPage>
  );
}

function Fact({ label, value, danger }: { label: string; value: string | null | undefined; danger?: boolean }) {
  const t = useTheme();
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Text variant="callout" tone="muted" style={{ width: 72 }}>
        {label}
      </Text>
      <Text variant="callout" color={danger ? t.sos : t.text} style={{ flex: 1, fontWeight: danger ? '700' : '500' }}>
        {value}
      </Text>
    </View>
  );
}
