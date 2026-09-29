// Hasta kartında tahsilat (test modu): tutar → POS'a gönder → canlı sonuç.
// POS ekranı /panel/pos (başka sekme ya da telefon). Banka çekimi ve e-SMM yok.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Text, Button, Card, Field, Badge, Icon } from '@/components/ds';
import { useTheme, radius } from '@/lib/theme';
import { formatTL, parseTL } from '@/lib/pos/money';
import { createTestSale, listPatientSales, resolveSale, watchSale, MAX_SALE_KURUS, type Sale } from '@/lib/pos/sales';
import type { Patient } from '@/lib/data/vetRecords';
import type { VetProfile } from '@/lib/auth';

/** Test POS ekranını yeni sekmede açar (web); uygulamada aynı yığında. */
export function openTestPos() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const base = (Constants.expoConfig?.experiments as { baseUrl?: string } | undefined)?.baseUrl ?? '';
    window.open(`${window.location.origin}${base}/panel/pos`, 'patiport-test-pos');
  } else {
    router.push('/panel/pos');
  }
}

const when = (ms: number | null) =>
  ms ? new Date(ms).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

export function PosCard({ vet, patient, suggestion }: { vet: VetProfile; patient: Patient; suggestion: string | null }) {
  const t = useTheme();
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState(suggestion ?? 'Muayene');
  const [saleId, setSaleId] = useState<string | null>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [past, setPast] = useState<Sale[]>([]);

  const loadPast = useCallback(() => {
    listPatientSales(vet.clinic_id, patient.id)
      .then(setPast)
      .catch(() => {});
  }, [vet.clinic_id, patient.id]);
  useEffect(loadPast, [loadPast]);
  useEffect(() => {
    if (suggestion && !saleId) setDesc(suggestion);
  }, [suggestion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!saleId) return;
    return watchSale(vet.clinic_id, saleId, (s) => {
      setSale(s);
      if (s && s.status !== 'pending') loadPast();
    });
  }, [vet.clinic_id, saleId, loadPast]);

  const kurus = parseTL(amount);
  const send = async () => {
    if (!kurus) return setError('Tutarı yazın (ör. 850 ya da 1.250,50).');
    if (kurus > MAX_SALE_KURUS) return setError('Tutar çok yüksek.');
    setBusy(true);
    setError(null);
    try {
      const id = await createTestSale(vet, { amount_kurus: kurus, description: desc, patient_id: patient.id, patient_name: patient.name });
      setSale(null);
      setSaleId(id);
    } catch {
      setError('Gönderilemedi. Bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  };
  const reset = () => {
    setSaleId(null);
    setSale(null);
    setAmount('');
  };

  const status = saleId ? sale?.status ?? 'pending' : null;

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text variant="headline">Tahsilat</Text>
        <Badge label="Test modu" tone="honey" />
      </View>

      {!saleId ? (
        <>
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            <View style={{ flexGrow: 1, flexBasis: 140 }}>
              <Field label="Tutar (TL)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="850" onSubmitEditing={send} />
            </View>
            <View style={{ flexGrow: 2, flexBasis: 200 }}>
              <Field label="Açıklama" value={desc} onChangeText={setDesc} placeholder="Muayene, aşı…" />
            </View>
          </View>
          {error ? (
            <Text variant="caption" tone="danger">
              {error}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button title={kurus ? `${formatTL(kurus)} POS'a gönder` : "POS'a gönder"} icon="card-outline" loading={busy} disabled={!kurus} onPress={send} />
            <Button title="Test POS'u aç" variant="ghost" size="sm" icon="open-outline" onPress={openTestPos} />
          </View>
          <Text variant="caption" tone="subtle">
            Test modunda tutar, başka bir sekmede ya da telefonda açtığınız sanal POS ekranına gider. Bankadan çekim yapılmaz, e-SMM kesilmez.
          </Text>
        </>
      ) : status === 'pending' ? (
        <View style={{ gap: 10 }}>
          <View style={{ padding: 14, borderRadius: radius.md, backgroundColor: t.surfaceAlt, gap: 4 }}>
            <Text variant="caption" tone="muted">
              POS'ta bekleniyor
            </Text>
            <Text variant="display" style={{ fontSize: 30, lineHeight: 38 }}>
              {kurus ? formatTL(kurus) : ''}
            </Text>
            <Text variant="callout" tone="muted">
              {desc}
            </Text>
          </View>
          <Text variant="callout">Kartı test POS ekranında okutun ya da reddedin; sonuç burada kendiliğinden görünür.</Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Button title="Test POS'u aç" icon="open-outline" onPress={openTestPos} />
            <Button
              title="İptal"
              variant="ghost"
              onPress={async () => {
                if (sale) await resolveSale(vet, sale, 'cancelled').catch(() => {});
                else reset();
              }}
            />
          </View>
        </View>
      ) : status === 'approved' && sale ? (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="checkmark-circle" size={22} color={t.open} />
            <Text variant="bodyStrong" color={t.open}>
              Ödeme alındı (test)
            </Text>
          </View>
          <Receipt sale={sale} clinicName={vet.clinic_name} ownerName={patient.owner_name} />
          <Button title="Yeni tahsilat" variant="secondary" onPress={reset} style={{ alignSelf: 'flex-start' }} />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="close-circle" size={22} color={t.danger} />
            <Text variant="bodyStrong" color={t.danger}>
              {status === 'declined' ? 'Kart reddedildi (test)' : 'İşlem iptal edildi'}
            </Text>
          </View>
          <Button title="Tekrar dene" variant="secondary" onPress={() => setSaleId(null)} style={{ alignSelf: 'flex-start' }} />
        </View>
      )}

      {past.length > 0 ? (
        <View style={{ marginTop: 4, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 10, gap: 6 }}>
          <Text variant="caption" tone="muted">
            Son tahsilatlar
          </Text>
          {past.slice(0, 5).map((s) => (
            <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <Text variant="callout" numberOfLines={1} style={{ flex: 1 }}>
                {s.description}
              </Text>
              <Text variant="callout" tone={s.status === 'approved' ? undefined : 'muted'}>
                {formatTL(s.amount_kurus)} · {s.status === 'approved' ? 'alındı' : s.status === 'pending' ? 'bekliyor' : s.status === 'declined' ? 'reddedildi' : 'iptal'}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

/** Makbuz taslağı: yalnızca önizleme; test modunda resmî belge kesilmez. */
function Receipt({ sale, clinicName, ownerName }: { sale: Sale; clinicName: string; ownerName: string | null }) {
  const t = useTheme();
  const row = (k: string, v: string) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text variant="caption" tone="muted">
        {k}
      </Text>
      <Text variant="caption" style={{ textAlign: 'right', flexShrink: 1 }}>
        {v}
      </Text>
    </View>
  );
  return (
    <View style={{ padding: 14, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: t.borderStrong, gap: 6 }}>
      <Text variant="bodyStrong">Makbuz taslağı</Text>
      {row('Klinik', clinicName)}
      {row('Hasta sahibi', ownerName ?? '-')}
      {row('Hizmet', sale.description)}
      {row('Tutar', formatTL(sale.amount_kurus))}
      {row('Kart', `**** ${sale.card_last4 ?? '----'} (test)`)}
      {row('Onay kodu', sale.auth_code ?? '-')}
      {row('Tarih', when(sale.resolved_ms ?? sale.created_ms))}
      <Text variant="caption" tone="subtle" style={{ marginTop: 4 }}>
        Test modunda banka çekimi ve e-SMM yapılmaz; bu bir önizlemedir.
      </Text>
    </View>
  );
}
