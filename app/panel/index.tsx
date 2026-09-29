import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Pressable, Linking, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Text, Button, Card, Field, Segmented, SearchField, Badge, Icon } from '@/components/ds';
import { PetFace } from '@/components/art';
import { PanelGate, PanelPage, useWide } from '@/components/panel/Shell';
import { InterestCard } from '@/components/panel/Interest';
import { DueBadge, PatientForm, speciesLabel } from '@/components/panel/Forms';
import { useTheme, radius } from '@/lib/theme';
import { formatDate } from '@/lib/utils/dates';
import { petAge } from '@/lib/utils/pets';
import { trFold } from '@/lib/data/query';
import { createPatient, createPatientFromLink, listPatients, lookupLink } from '@/lib/data/panel';
import { dueSoon, reminderText, waNumber, type LinkPreview, type Patient } from '@/lib/data/vetRecords';
import type { VetProfile } from '@/lib/auth';

export default function PanelHome() {
  return <PanelGate>{(vet) => <Dashboard vet={vet} />}</PanelGate>;
}

function Dashboard({ vet }: { vet: VetProfile }) {
  const wide = useWide();
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      setPatients(await listPatients(vet.clinic_id));
      setError(null);
    } catch {
      setError('Hastalar yüklenemedi. Bağlantını kontrol edip sayfayı yenile.');
      setPatients([]);
    }
  }, [vet.clinic_id]);
  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const q = trFold(query);
    if (!patients || !q) return patients ?? [];
    return patients.filter((p) => trFold([p.name, p.owner_name, p.owner_phone, p.chip_no, p.breed].filter(Boolean).join(' ')).includes(q));
  }, [patients, query]);
  const soon = useMemo(() => dueSoon(patients ?? [], 7), [patients]);

  const list = (
    <View style={{ flex: wide ? 1.5 : undefined, minWidth: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text variant="title">Hastalar</Text>
        {!adding ? <Button title="Hasta ekle" icon="add" size="sm" onPress={() => setAdding(true)} /> : null}
      </View>
      {adding ? (
        <AddPatient
          vet={vet}
          onDone={(id) => {
            setAdding(false);
            if (id) router.push(`/panel/hasta/${id}`);
          }}
        />
      ) : null}
      <SearchField value={query} onChangeText={setQuery} placeholder="Ad, sahip, telefon ya da çip no" />
      <View style={{ marginTop: 12 }}>
        {patients == null ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : error ? (
          <Text variant="body" tone="danger">
            {error}
          </Text>
        ) : shown.length === 0 ? (
          <EmptyPatients hasAny={(patients?.length ?? 0) > 0} />
        ) : (
          <Card padded={false}>
            {shown.map((p, i) => (
              <PatientRow key={p.id} p={p} last={i === shown.length - 1} />
            ))}
          </Card>
        )}
      </View>
    </View>
  );

  const upcoming = (
    <View style={{ flex: wide ? 1 : undefined, minWidth: 0 }}>
      <Text variant="title" style={{ marginBottom: 12 }}>
        Bu hafta
      </Text>
      <Card padded={false}>
        {soon.length === 0 ? (
          <View style={{ padding: 16 }}>
            <Text variant="callout" tone="muted">
              Önümüzdeki 7 günde aşısı ya da kontrolü gelen hasta yok.
            </Text>
          </View>
        ) : (
          soon.map((p, i) => <DueRow key={p.id} p={p} vet={vet} last={i === soon.length - 1} />)
        )}
      </Card>
      <Text variant="caption" tone="subtle" style={{ marginTop: 8 }}>
        Uygulamayla bağlı hastaların sahiplerine bir gün önce ve gününde telefonlarında hatırlatma gider. Diğerlerine WhatsApp ile yazabilirsin.
      </Text>
      <View style={{ marginTop: 24 }}>
        <InterestCard uid={vet.uid} clinicName={vet.clinic_name} compact />
      </View>
    </View>
  );

  return (
    <PanelPage>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 28 : 32, marginTop: 24, alignItems: 'flex-start' }}>
        {wide ? (
          <>
            {list}
            {upcoming}
          </>
        ) : (
          <>
            {upcoming}
            {list}
          </>
        )}
      </View>
    </PanelPage>
  );
}

function PatientRow({ p, last }: { p: Patient; last: boolean }) {
  const t = useTheme();
  const age = petAge({ birth_date: p.birth_date, age_years: null });
  const meta = [speciesLabel(p.species), p.breed, age].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={() => router.push(`/panel/hasta/${p.id}`)}
      accessibilityRole="link"
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.border,
        backgroundColor: pressed || hovered ? t.surfaceAlt : 'transparent',
      })}
    >
      <PetFace species={p.species} seed={p.id} size={40} background="auto" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {p.name}
          </Text>
          {p.owner_uid ? <Badge label="Uygulamada" tone="primary" icon="phone-portrait-outline" /> : null}
        </View>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {[meta, p.owner_name].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {p.next_due ? <DueBadge date={p.next_due} title={p.next_due_title} /> : null}
      <Icon name="chevron-forward" size={16} color={t.textSubtle} />
    </Pressable>
  );
}

function DueRow({ p, vet, last }: { p: Patient; vet: VetProfile; last: boolean }) {
  const t = useTheme();
  const wa = waNumber(p.owner_phone);
  const text = reminderText(p, vet.clinic_name, formatDate(p.next_due!));
  return (
    <View style={{ padding: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.border, gap: 6 }}>
      <Pressable onPress={() => router.push(`/panel/hasta/${p.id}`)} accessibilityRole="link">
        <Text variant="bodyStrong">{p.name}</Text>
      </Pressable>
      <DueBadge date={p.next_due!} title={p.next_due_title} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
        {p.owner_uid ? (
          <Text variant="caption" tone="muted">
            Sahibinin telefonunda hatırlatma kurulu.
          </Text>
        ) : null}
        {wa ? (
          <Button
            title="WhatsApp ile hatırlat"
            icon="logo-whatsapp"
            size="sm"
            variant="secondary"
            onPress={() => Linking.openURL(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`)}
          />
        ) : !p.owner_uid ? (
          <Text variant="caption" tone="subtle">
            Telefon numarası yok.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function EmptyPatients({ hasAny }: { hasAny: boolean }) {
  const t = useTheme();
  if (hasAny) {
    return (
      <Text variant="callout" tone="muted">
        Aramaya uyan hasta yok.
      </Text>
    );
  }
  return (
    <View style={{ padding: 20, borderRadius: radius.lg, backgroundColor: t.surface, gap: 10 }}>
      <Text variant="headline">İlk hastanı ekle</Text>
      <Text variant="body" tone="muted">
        Sahibi Patiport kullanıyorsa dostunun sayfasındaki "Veterinerime bağla" ile 6 haneli bir kod alır. Kodu "Hasta ekle" → "Kodla" bölümüne
        yaz: dostun bilgileri gelir, eklediğin aşılar sahibin takvimine düşer ve zamanı gelince telefonuna hatırlatma gider.
      </Text>
      <Text variant="body" tone="muted">
        Uygulaması olmayan sahipler için "Elle" ekle; hatırlatmayı WhatsApp ile gönderirsin.
      </Text>
    </View>
  );
}

function AddPatient({ vet, onDone }: { vet: VetProfile; onDone: (id: string | null) => void }) {
  const [mode, setMode] = useState<'code' | 'manual'>('code');
  return (
    <Card style={{ marginBottom: 16 }}>
      <Segmented
        options={[
          { key: 'code', label: 'Kodla (uygulamadan)' },
          { key: 'manual', label: 'Elle' },
        ]}
        value={mode}
        onChange={setMode}
      />
      {mode === 'code' ? (
        <CodeLink vet={vet} onDone={onDone} />
      ) : (
        <PatientForm submitLabel="Hastayı ekle" onCancel={() => onDone(null)} onSubmit={async (input) => onDone(await createPatient(vet, input))} />
      )}
    </Card>
  );
}

const LOOKUP_ERRORS = {
  format: 'Kod 6 karakter olmalı (ör. K7M2QX).',
  notfound: 'Bu kod bulunamadı ya da süresi doldu. Sahibinden uygulamada yeni kod almasını iste.',
  linked: 'Bu kod başka bir kliniğe bağlanmış. Sahibinden yeni kod almasını iste.',
};

function CodeLink({ vet, onDone }: { vet: VetProfile; onDone: (id: string | null) => void }) {
  const t = useTheme();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<LinkPreview | null>(null);

  const find = async () => {
    setBusy(true);
    setError(null);
    const r = await lookupLink(code);
    setBusy(false);
    if (r.ok) setLink(r.link);
    else setError(LOOKUP_ERRORS[r.reason]);
  };
  const add = async () => {
    if (!link) return;
    setBusy(true);
    try {
      onDone(await createPatientFromLink(vet, link));
    } catch {
      setError('Eklenemedi. Kodun süresi dolmuş olabilir; sahibinden yeni kod iste.');
      setBusy(false);
    }
  };

  if (link) {
    const p = link.pet;
    return (
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <PetFace species={p.species} seed={link.pet_local_id} size={56} background="auto" />
          <View style={{ flex: 1 }}>
            <Text variant="headline">{p.name}</Text>
            <Text variant="caption" tone="muted">
              {[speciesLabel(p.species), p.breed, petAge({ birth_date: p.birth_date ?? null, age_years: null }), p.weight_kg ? `${String(p.weight_kg).replace('.', ',')} kg` : null]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            {link.owner_name ? (
              <Text variant="caption" tone="muted">
                Sahibi: {link.owner_name}
              </Text>
            ) : null}
          </View>
        </View>
        {p.allergies ? (
          <Text variant="callout" color={t.sos}>
            Alerji: {p.allergies}
          </Text>
        ) : null}
        {error ? (
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Hastalarıma ekle" loading={busy} onPress={add} />
          <Button title="Vazgeç" variant="ghost" onPress={() => setLink(null)} />
        </View>
      </View>
    );
  }
  return (
    <View>
      <Field
        label="Sahibin paylaştığı kod"
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase())}
        autoCapitalize="characters"
        maxLength={8}
        placeholder="K7M2QX"
        onSubmitEditing={find}
        hint="Sahip, dostunun sayfasında Veterinerime bağla'ya dokununca görür. 24 saat geçerli."
      />
      {error ? (
        <Text variant="caption" tone="danger" style={{ marginBottom: 10 }}>
          {error}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Kodu bul" loading={busy} disabled={code.trim().length < 6} onPress={find} />
        <Button title="Vazgeç" variant="ghost" onPress={() => onDone(null)} />
      </View>
    </View>
  );
}
