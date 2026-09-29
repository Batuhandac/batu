// Hasta kartında tahsilat: tutar → yöntem → canlı sonuç.
//  - Test POS: tutar panelin sanal terminaline gider (/panel/pos, başka sekme ya da telefon).
//  - iyzico (deneme): ödeme sunucusu iyzico'nun gerçek ödeme sayfasını açar; hasta sahibi
//    QR'ı telefonuyla okutup kartla öder. Deneme ortamında para sahtedir.
// İkisinde de banka çekimi ve e-SMM yok.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Linking, Platform, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Text, Button, Card, Field, Badge, Icon, Chip } from '@/components/ds';
import { useTheme, radius } from '@/lib/theme';
import { formatTL, parseTL } from '@/lib/pos/money';
import {
  createSale,
  listPatientSales,
  onlinePayEnabled,
  resolveSale,
  startOnlinePayment,
  watchSale,
  MAX_SALE_KURUS,
  type Sale,
  type SaleMode,
} from '@/lib/pos/sales';
import { waNumber, type Patient } from '@/lib/data/vetRecords';
import type { VetProfile } from '@/lib/auth';
import { QrCode } from './QrCode';

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

const START_ERRORS: Record<string, string> = {
  offline: 'Ödeme sunucusuna ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
  auth: 'Oturumunuz yenilenmeli. Sayfayı yenileyip tekrar deneyin.',
  forbidden: 'Bu klinik adına ödeme başlatma yetkiniz görünmüyor.',
  iyzico: 'iyzico ödeme sayfasını açmadı.',
  server: 'Ödeme sayfası açılamadı. Biraz sonra tekrar deneyin.',
};

export function PosCard({ vet, patient, suggestion }: { vet: VetProfile; patient: Patient; suggestion: string | null }) {
  const t = useTheme();
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState(suggestion ?? 'Muayene');
  const [method, setMethod] = useState<SaleMode>('test');
  const [saleId, setSaleId] = useState<string | null>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
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

  const begin = async (id: string) => {
    setStartError(null);
    const r = await startOnlinePayment(vet.clinic_id, id);
    if ('error' in r) setStartError(r.message ? `${START_ERRORS[r.error]} (${r.message})` : START_ERRORS[r.error]);
  };

  const send = async () => {
    if (!kurus) return setError('Tutarı yazın (ör. 850 ya da 1.250,50).');
    if (kurus > MAX_SALE_KURUS) return setError('Tutar çok yüksek.');
    setBusy(true);
    setError(null);
    try {
      const id = await createSale(vet, { amount_kurus: kurus, description: desc, patient_id: patient.id, patient_name: patient.name }, method);
      setSale(null);
      setSaleId(id);
      if (method === 'iyzico_test') await begin(id);
    } catch {
      setError('Gönderilemedi. Bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  };
  const reset = () => {
    setSaleId(null);
    setSale(null);
    setStartError(null);
    setAmount('');
  };
  const cancel = async () => {
    if (sale) await resolveSale(vet, sale, 'cancelled').catch(() => {});
    else reset();
  };

  const status = saleId ? sale?.status ?? 'pending' : null;
  const mode: SaleMode = sale?.mode ?? method;

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text variant="headline">Tahsilat</Text>
        <Badge label={mode === 'iyzico_test' ? 'iyzico deneme' : 'Test modu'} tone="honey" />
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
          {onlinePayEnabled ? (
            <View style={{ gap: 8 }}>
              <Text variant="caption" tone="muted">
                Nasıl ödenecek?
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Chip label="Sanal POS (test)" icon="card-outline" active={method === 'test'} onPress={() => setMethod('test')} onSurface />
                <Chip label="Telefondan kartla (iyzico)" icon="qr-code-outline" active={method === 'iyzico_test'} onPress={() => setMethod('iyzico_test')} onSurface />
              </View>
            </View>
          ) : null}
          {error ? (
            <Text variant="caption" tone="danger">
              {error}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {method === 'iyzico_test' ? (
              <Button title={kurus ? `${formatTL(kurus)} için ödeme sayfası aç` : 'Ödeme sayfası aç'} icon="qr-code-outline" loading={busy} disabled={!kurus} onPress={send} />
            ) : (
              <>
                <Button title={kurus ? `${formatTL(kurus)} POS'a gönder` : "POS'a gönder"} icon="card-outline" loading={busy} disabled={!kurus} onPress={send} />
                <Button title="Test POS'u aç" variant="ghost" size="sm" icon="open-outline" onPress={openTestPos} />
              </>
            )}
          </View>
          <Text variant="caption" tone="subtle">
            {method === 'iyzico_test'
              ? 'iyzico deneme ortamı: gerçek ödeme sayfası ve 3D Secure adımı açılır, deneme kartıyla ödenir; kimseden para çekilmez, e-SMM kesilmez.'
              : 'Test modunda tutar, başka bir sekmede ya da telefonda açtığınız sanal POS ekranına gider. Bankadan çekim yapılmaz, e-SMM kesilmez.'}
          </Text>
        </>
      ) : status === 'pending' && mode === 'iyzico_test' ? (
        <OnlinePending
          sale={sale}
          kurus={kurus}
          desc={desc}
          startError={startError}
          ownerPhone={patient.owner_phone}
          clinicName={vet.clinic_name}
          onRetry={() => saleId && begin(saleId)}
          onCancel={cancel}
        />
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
            <Button title="İptal" variant="ghost" onPress={cancel} />
          </View>
        </View>
      ) : status === 'approved' && sale ? (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="checkmark-circle" size={22} color={t.open} />
            <Text variant="bodyStrong" color={t.open}>
              {sale.mode === 'iyzico_test' ? 'Ödeme alındı (iyzico deneme)' : 'Ödeme alındı (test)'}
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
              {status === 'declined' ? (sale?.mode === 'iyzico_test' ? 'Ödeme tamamlanmadı' : 'Kart reddedildi (test)') : 'İşlem iptal edildi'}
            </Text>
          </View>
          {status === 'declined' && sale?.fail_reason ? (
            <Text variant="callout" tone="muted">
              {sale.fail_reason}
            </Text>
          ) : null}
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
                {formatTL(s.amount_kurus)} · {s.status === 'approved' ? 'alındı' : s.status === 'pending' ? 'bekliyor' : s.status === 'declined' ? 'olmadı' : 'iptal'}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

/** iyzico ödeme sayfası hazır: QR, bağlantı, deneme kartı bilgisi. */
function OnlinePending({
  sale,
  kurus,
  desc,
  startError,
  ownerPhone,
  clinicName,
  onRetry,
  onCancel,
}: {
  sale: Sale | null;
  kurus: number | null;
  desc: string;
  startError: string | null;
  ownerPhone: string | null;
  clinicName: string;
  onRetry: () => void;
  onCancel: () => void;
}) {
  const t = useTheme();
  const [copied, setCopied] = useState(false);
  const url = sale?.pay_url ?? null;
  const amount = sale ? formatTL(sale.amount_kurus) : kurus ? formatTL(kurus) : '';
  const minutes = sale?.pay_expires_ms ? Math.max(0, Math.round((sale.pay_expires_ms - Date.now()) / 60000)) : null;

  if (!url) {
    return (
      <View style={{ gap: 10 }}>
        {startError ? (
          <>
            <Text variant="callout" tone="danger">
              {startError}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              <Button title="Tekrar dene" onPress={onRetry} />
              <Button title="İptal" variant="ghost" onPress={onCancel} />
            </View>
          </>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
            <ActivityIndicator color={t.primary} />
            <Text variant="callout">Ödeme sayfası hazırlanıyor…</Text>
          </View>
        )}
      </View>
    );
  }

  const wa = waNumber(ownerPhone);
  const message = `${clinicName} ödeme bağlantısı (${amount}, ${desc}): ${url}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* pano izni yoksa sessiz geç */
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <View style={{ padding: 6, borderRadius: radius.md, backgroundColor: '#ffffff', borderWidth: 1, borderColor: t.border }}>
          <QrCode value={url} size={168} />
        </View>
        <View style={{ flex: 1, minWidth: 180, gap: 4 }}>
          <Text variant="caption" tone="muted">
            Ödeme bekleniyor
          </Text>
          <Text variant="display" style={{ fontSize: 30, lineHeight: 38 }}>
            {amount}
          </Text>
          <Text variant="callout">Hasta sahibi QR'ı telefon kamerasıyla okutup kartla ödesin. Sonuç burada kendiliğinden görünür.</Text>
          {minutes !== null ? (
            <Text variant="caption" tone="subtle">
              Bağlantı yaklaşık {minutes} dakika geçerli.
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Button title="Bu cihazda aç" size="sm" icon="open-outline" onPress={() => Linking.openURL(url)} />
        <Button
          title="WhatsApp ile gönder"
          size="sm"
          variant="secondary"
          icon="logo-whatsapp"
          onPress={() => Linking.openURL(`https://wa.me/${wa ?? ''}?text=${encodeURIComponent(message)}`)}
        />
        {Platform.OS === 'web' ? <Button title={copied ? 'Kopyalandı' : 'Bağlantıyı kopyala'} size="sm" variant="ghost" icon="copy-outline" onPress={copy} /> : null}
        <Button title="İptal" size="sm" variant="ghost" onPress={onCancel} />
      </View>
      <View style={{ padding: 12, borderRadius: radius.md, backgroundColor: t.honeySoft, gap: 2 }}>
        <Text variant="caption" style={{ fontWeight: '800' }}>
          Deneme kartı
        </Text>
        <Text variant="caption">5528 7900 0000 0008 · SKT 12/30 · CVC 123 · SMS şifresi sorulursa 123456</Text>
        <Text variant="caption" tone="muted">
          Reddedilen ödemeyi denemek için: 4129 1111 1111 1111. Deneme ortamında kimseden para çekilmez.
        </Text>
      </View>
    </View>
  );
}

/** Makbuz taslağı: yalnızca önizleme; resmî belge kesilmez. */
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
  const online = sale.mode === 'iyzico_test';
  return (
    <View style={{ padding: 14, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: t.borderStrong, gap: 6 }}>
      <Text variant="bodyStrong">Makbuz taslağı</Text>
      {row('Klinik', clinicName)}
      {row('Hasta sahibi', ownerName ?? '-')}
      {row('Hizmet', sale.description)}
      {row('Tutar', formatTL(sale.amount_kurus))}
      {row('Kart', `${sale.card_brand ? `${cardBrand(sale.card_brand)} ` : ''}**** ${sale.card_last4 ?? '----'}`)}
      {online && sale.payment_id ? row('iyzico ödeme no', sale.payment_id) : null}
      {row('Onay kodu', sale.auth_code ?? '-')}
      {row('Tarih', when(sale.resolved_ms ?? sale.created_ms))}
      <Text variant="caption" tone="subtle" style={{ marginTop: 4 }}>
        {online
          ? 'iyzico deneme ortamı: kimseden para çekilmedi, e-SMM kesilmedi. Bu bir önizlemedir.'
          : 'Test modunda banka çekimi ve e-SMM yapılmaz; bu bir önizlemedir.'}
      </Text>
    </View>
  );
}

function cardBrand(b: string): string {
  return ({ MASTER_CARD: 'Mastercard', VISA: 'Visa', AMERICAN_EXPRESS: 'Amex', TROY: 'Troy' } as Record<string, string>)[b] ?? b;
}
