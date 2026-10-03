// Hasta kartında tahsilat: tutar → yöntem → canlı sonuç → makbuz (ve e-SMM).
//  - Kartla: kliniğin kendi iyzico hesabı bağlıysa para doğrudan oraya; değilse
//    Patiport'un iyzico deneme hesabı (para sahte). Hasta sahibi QR'ı telefonla okutur.
//  - Nakit: hekim "alındı" yapar.
//  - Sanal POS (test): panelin test terminali.
// Paraşüt bağlıysa nakit ve canlı kart tahsilatı için e-SMM / e-Arşiv kesilir.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Linking, Platform, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Text, Button, Card, Field, Badge, Icon, Chip } from '@/components/ds';
import { useTheme, radius } from '@/lib/theme';
import { formatTL, parseTL } from '@/lib/pos/money';
import {
  checkOnlinePayment,
  createSale,
  edocPdf,
  issueEdoc,
  listPatientSales,
  onlinePayEnabled,
  recordCashSale,
  resolveSale,
  startOnlinePayment,
  watchClinicPay,
  watchSale,
  MAX_SALE_KURUS,
  type ClinicPay,
  type Sale,
  type SaleMode,
} from '@/lib/pos/sales';
import { waNumber, type Patient } from '@/lib/data/vetRecords';
import type { VetProfile } from '@/lib/auth';
import { QrCode } from './QrCode';
import { usePlan } from './Plan';
import { proAccess } from '@/lib/pos/plan';

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
  not_connected: 'Kliniğin iyzico hesabı bağlı değil. Ayarlar\'dan bağlayın.',
  server: 'Ödeme sayfası açılamadı. Biraz sonra tekrar deneyin.',
};

const MODE_BADGE: Record<SaleMode, string> = { iyzico: 'iyzico', iyzico_test: 'iyzico deneme', cash: 'Nakit', test: 'Test modu' };
const isOnline = (m: SaleMode) => m === 'iyzico' || m === 'iyzico_test';
/** Deneme ödemesi mi (para sahte)? */
const isSandboxSale = (s: Sale) => s.mode === 'test' || s.mode === 'iyzico_test' || (s.mode === 'iyzico' && s.pay_env !== 'live');

export function PosCard({ vet, patient, suggestion }: { vet: VetProfile; patient: Patient; suggestion: string | null }) {
  const t = useTheme();
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState(suggestion ?? 'Muayene');
  const [pay, setPay] = useState<ClinicPay>({ iyzico: null, parasut: null });
  useEffect(() => watchClinicPay(vet.clinic_id, setPay), [vet.clinic_id]);
  // Kartla: kendi hesap bağlıysa o, değilse Patiport'un deneme hesabı
  const cardMode: SaleMode | null = pay.iyzico ? 'iyzico' : onlinePayEnabled ? 'iyzico_test' : null;
  const [picked, setPicked] = useState<'card' | 'cash' | 'test' | null>(null);
  const choice = picked ?? (cardMode ? 'card' : 'cash');
  const method: SaleMode = choice === 'card' && cardMode ? cardMode : choice === 'test' ? 'test' : 'cash';
  const [saleId, setSaleId] = useState<string | null>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [past, setPast] = useState<Sale[]>([]);

  const resumed = useRef(false);
  const loadPast = useCallback(() => {
    listPatientSales(vet.clinic_id, patient.id)
      .then((list) => {
        setPast(list);
        // Sayfa yenilendiyse bekleyen tahsilata kaldığı yerden devam et
        if (!resumed.current) {
          resumed.current = true;
          const open = list.find((x) => x.status === 'pending');
          if (open) {
            setSaleId((cur) => cur ?? open.id);
            if (isOnline(open.mode) && open.pay_url) checkOnlinePayment(vet.clinic_id, open.id).catch(() => {});
          }
        }
      })
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
  // Ücretli özellik kilidi (lib/pos/plan.ts, şimdilik kapalı)
  const plan = usePlan(vet.clinic_id);
  const locked = plan != null && !proAccess(plan) && !saleId;

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
      const input = { amount_kurus: kurus, description: desc, patient_id: patient.id, patient_name: patient.name };
      if (method === 'cash') {
        const id = await recordCashSale(vet, input);
        setSale(null);
        setSaleId(id);
        // Paraşüt bağlı ve "kendiliğinden kes" açıksa e-SMM kesilir; sonuç makbuzda görünür
        if (pay.parasut) issueEdoc(vet.clinic_id, id, true).catch(() => {});
        return;
      }
      const id = await createSale(vet, input, method);
      setSale(null);
      setSaleId(id);
      if (isOnline(method)) await begin(id);
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
        <Badge
          label={mode === 'iyzico' && (sale ? sale.pay_env === 'live' : pay.iyzico?.env === 'live') ? 'Canlı' : MODE_BADGE[mode]}
          tone={mode === 'cash' || (mode === 'iyzico' && (sale ? sale.pay_env === 'live' : pay.iyzico?.env === 'live')) ? 'open' : 'honey'}
        />
      </View>

      {locked ? (
        <View style={{ gap: 10 }}>
          <Text variant="callout" tone="muted">
            Erken erişim sona erdi; tahsilat ve e-belge ücretli pakette. Hasta kayıtlarınız ve hatırlatmalar ücretsiz devam ediyor.
          </Text>
          <Button title="Paketi gör" size="sm" variant="secondary" onPress={() => router.push('/panel/ayarlar')} />
        </View>
      ) : !saleId ? (
        <>
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            <View style={{ flexGrow: 1, flexBasis: 140 }}>
              <Field label="Tutar (TL)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="850" onSubmitEditing={send} />
            </View>
            <View style={{ flexGrow: 2, flexBasis: 200 }}>
              <Field label="Açıklama" value={desc} onChangeText={setDesc} placeholder="Muayene, aşı…" />
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Text variant="caption" tone="muted">
              Nasıl ödenecek?
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {cardMode ? (
                <Chip
                  label={pay.iyzico ? (pay.iyzico.env === 'live' ? 'Kartla (QR / bağlantı)' : 'Kartla (iyzico deneme)') : 'Kartla (Patiport deneme)'}
                  icon="qr-code-outline"
                  active={choice === 'card'}
                  onPress={() => setPicked('card')}
                  onSurface
                />
              ) : null}
              <Chip label="Nakit" icon="cash-outline" active={choice === 'cash'} onPress={() => setPicked('cash')} onSurface />
              <Chip label="Sanal POS (test)" icon="card-outline" active={choice === 'test'} onPress={() => setPicked('test')} onSurface />
            </View>
          </View>
          {error ? (
            <Text variant="caption" tone="danger">
              {error}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {isOnline(method) ? (
              <Button title={kurus ? `${formatTL(kurus)} için ödeme sayfası aç` : 'Ödeme sayfası aç'} icon="qr-code-outline" loading={busy} disabled={!kurus} onPress={send} />
            ) : method === 'cash' ? (
              <Button title={kurus ? `${formatTL(kurus)} nakit alındı` : 'Nakit alındı'} icon="cash-outline" loading={busy} disabled={!kurus} onPress={send} />
            ) : (
              <>
                <Button title={kurus ? `${formatTL(kurus)} POS'a gönder` : "POS'a gönder"} icon="card-outline" loading={busy} disabled={!kurus} onPress={send} />
                <Button title="Test POS'u aç" variant="ghost" size="sm" icon="open-outline" onPress={openTestPos} />
              </>
            )}
          </View>
          <Text variant="caption" tone="subtle">
            {method === 'iyzico'
              ? pay.iyzico?.env === 'live'
                ? 'Para doğrudan kliniğinizin iyzico hesabına geçer. Hasta sahibi QR\'ı okutup kartla öder (3D Secure dahil).'
                : 'iyzico deneme hesabınız bağlı: gerçek ödeme sayfası açılır, deneme kartıyla ödenir; para çekilmez.'
              : method === 'iyzico_test'
                ? 'Patiport\'un iyzico deneme hesabı: gerçek ödeme sayfası açılır, deneme kartıyla ödenir; para çekilmez. Kendi hesabınızı Ayarlar\'dan bağlayın.'
                : method === 'cash'
                  ? pay.parasut
                    ? 'Nakit tahsilat kaydedilir; Paraşüt bağlı olduğu için makbuz ayarlarınıza göre kesilir.'
                    : 'Nakit tahsilat kaydedilir. Paraşüt\'ü Ayarlar\'dan bağlarsanız e-SMM kendiliğinden kesilir.'
                  : 'Test modunda tutar, başka bir sekmede ya da telefonda açtığınız sanal POS ekranına gider. Bankadan çekim yapılmaz.'}
          </Text>
          {!pay.iyzico && onlinePayEnabled ? (
            <Button title="Kendi iyzico hesabımı bağla" variant="ghost" size="sm" icon="settings-outline" onPress={() => router.push('/panel/ayarlar')} style={{ alignSelf: 'flex-start' }} />
          ) : null}
        </>
      ) : status === 'pending' && isOnline(mode) ? (
        <OnlinePending
          sale={sale}
          kurus={kurus}
          desc={desc}
          startError={startError}
          ownerPhone={patient.owner_phone}
          clinicName={vet.clinic_name}
          onRetry={() => saleId && begin(saleId)}
          onCheck={async () => {
            if (!saleId) return null;
            const r = await checkOnlinePayment(vet.clinic_id, saleId);
            if ('error' in r) return START_ERRORS[r.error];
            return r.status === 'pending' ? 'Ödeme henüz tamamlanmadı. Sahibi ödedikten sonra tekrar bakın.' : null;
          }}
          onCancel={cancel}
        />
      ) : status === 'pending' ? (
        <View style={{ gap: 10 }}>
          <View style={{ padding: 14, borderRadius: radius.md, backgroundColor: t.surfaceAlt, gap: 4 }}>
            <Text variant="caption" tone="muted">
              POS'ta bekleniyor
            </Text>
            <Text variant="display" style={{ fontSize: 30, lineHeight: 38 }}>
              {sale ? formatTL(sale.amount_kurus) : kurus ? formatTL(kurus) : ''}
            </Text>
            <Text variant="callout" tone="muted">
              {sale?.description ?? desc}
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
              {sale.mode === 'cash' ? 'Nakit alındı' : sale.mode === 'test' ? 'Ödeme alındı (test)' : isSandboxSale(sale) ? 'Ödeme alındı (iyzico deneme)' : 'Ödeme alındı'}
            </Text>
          </View>
          <Receipt sale={sale} clinicName={vet.clinic_name} ownerName={patient.owner_name} />
          <EdocStatus sale={sale} clinicId={vet.clinic_id} parasut={pay.parasut} />
          <Button title="Yeni tahsilat" variant="secondary" onPress={reset} style={{ alignSelf: 'flex-start' }} />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="close-circle" size={22} color={t.danger} />
            <Text variant="bodyStrong" color={t.danger}>
              {status === 'declined' ? (sale && isOnline(sale.mode) ? 'Ödeme tamamlanmadı' : 'Kart reddedildi (test)') : 'İşlem iptal edildi'}
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
  onCheck,
  onCancel,
}: {
  sale: Sale | null;
  kurus: number | null;
  desc: string;
  startError: string | null;
  ownerPhone: string | null;
  clinicName: string;
  onRetry: () => void;
  onCheck: () => Promise<string | null>;
  onCancel: () => void;
}) {
  const t = useTheme();
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState<string | null>(null);
  const runCheck = async () => {
    setChecking(true);
    setCheckMsg(null);
    setCheckMsg(await onCheck().catch(() => START_ERRORS.server));
    setChecking(false);
  };
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
        <Button title="Durumu kontrol et" size="sm" variant="ghost" icon="refresh-outline" loading={checking} onPress={runCheck} />
        <Button title="İptal" size="sm" variant="ghost" onPress={onCancel} />
      </View>
      {checkMsg ? (
        <Text variant="caption" tone="muted">
          {checkMsg}
        </Text>
      ) : null}
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
  const online = isOnline(sale.mode);
  const sandbox = isSandboxSale(sale);
  return (
    <View style={{ padding: 14, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: t.borderStrong, gap: 6 }}>
      <Text variant="bodyStrong">{sandbox ? 'Makbuz taslağı' : 'Tahsilat özeti'}</Text>
      {row('Klinik', clinicName)}
      {row('Hasta sahibi', ownerName ?? '-')}
      {row('Hizmet', sale.description)}
      {row('Tutar', formatTL(sale.amount_kurus))}
      {sale.mode === 'cash' ? row('Ödeme', 'Nakit') : row('Kart', `${sale.card_brand ? `${cardBrand(sale.card_brand)} ` : ''}**** ${sale.card_last4 ?? '----'}`)}
      {online && sale.payment_id ? row('iyzico ödeme no', sale.payment_id) : null}
      {sale.mode !== 'cash' ? row('Onay kodu', sale.auth_code ?? '-') : null}
      {row('Tarih', when(sale.resolved_ms ?? sale.created_ms))}
      <Text variant="caption" tone="subtle" style={{ marginTop: 4 }}>
        {sandbox
          ? 'Deneme ödemesi: kimseden para çekilmedi, resmî belge kesilmez. Bu bir önizlemedir.'
          : sale.edoc_status === 'issued'
            ? 'Resmî belge Paraşüt üzerinden kesildi; bu sayfa özetidir.'
            : 'Bu bir makbuz özetidir; resmî belge değildir.'}
      </Text>
    </View>
  );
}

function cardBrand(b: string): string {
  return ({ MASTER_CARD: 'Mastercard', VISA: 'Visa', AMERICAN_EXPRESS: 'Amex', TROY: 'Troy' } as Record<string, string>)[b] ?? b;
}

/** Makbuzun altında e-SMM / e-Arşiv durumu: kesildi (PDF), kesiliyor, kesilemedi, kes. */
function EdocStatus({ sale, clinicId, parasut }: { sale: Sale; clinicId: string; parasut: ClinicPay['parasut'] }) {
  const t = useTheme();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  if (isSandboxSale(sale)) return null;
  const label = sale.edoc_type === 'e_archive' ? 'e-Arşiv fatura' : sale.edoc_type === 'e_invoice' ? 'e-Fatura' : 'e-SMM';

  const issue = async () => {
    setBusy(true);
    setMsg(null);
    const r = await issueEdoc(clinicId, sale.id);
    setBusy(false);
    if (r.error === 'not_connected') setMsg('Paraşüt bağlı değil. Ayarlar\'dan bağlayın.');
    else if (r.error) setMsg('Kesilemedi. Biraz sonra tekrar deneyin.');
  };
  const openPdf = async () => {
    setBusy(true);
    setMsg(null);
    const r = await edocPdf(clinicId, sale.id);
    setBusy(false);
    if (r.url) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(r.url, '_blank');
      else Linking.openURL(r.url);
    } else setMsg(r.pending ? 'Belge hazırlanıyor; birazdan tekrar deneyin.' : 'Belge açılamadı. Biraz sonra tekrar deneyin.');
  };

  let body: React.ReactNode;
  if (sale.edoc_status === 'issued') {
    body = (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Icon name="document-text-outline" size={18} color={t.open} />
        <Text variant="callout" color={t.open} style={{ flex: 1 }}>
          {label} kesildi{sale.edoc_number ? ` · No ${sale.edoc_number}` : ''}
        </Text>
        <Button title="Belgeyi aç" size="sm" variant="secondary" loading={busy} onPress={openPdf} />
      </View>
    );
  } else if (sale.edoc_status === 'issuing') {
    body = (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <ActivityIndicator color={t.primary} />
        <Text variant="callout">Belge Paraşüt'te kesiliyor…</Text>
      </View>
    );
  } else if (sale.edoc_status === 'failed') {
    body = (
      <View style={{ gap: 6 }}>
        <Text variant="callout" tone="danger">
          Belge kesilemedi{sale.edoc_error ? `: ${sale.edoc_error}` : '.'}
        </Text>
        <Button title="Tekrar dene" size="sm" variant="secondary" loading={busy} onPress={issue} style={{ alignSelf: 'flex-start' }} />
      </View>
    );
  } else if (parasut) {
    body = <Button title="e-SMM / e-Arşiv kes" size="sm" icon="document-text-outline" loading={busy} onPress={issue} style={{ alignSelf: 'flex-start' }} />;
  } else {
    body = (
      <Text variant="caption" tone="muted">
        Paraşüt'ü Ayarlar'dan bağlarsanız e-SMM ya da e-Arşiv bu tahsilat için kendiliğinden kesilir.
      </Text>
    );
  }
  return (
    <View style={{ gap: 6 }}>
      {body}
      {msg ? (
        <Text variant="caption" tone="muted">
          {msg}
        </Text>
      ) : null}
    </View>
  );
}
