// Hekim paneli ayarları: kartla ödeme için kliniğin kendi iyzico hesabı ve e-SMM /
// e-Arşiv için Paraşüt bağlantısı. Anahtarlar ödeme sunucusunda şifreli saklanır;
// panel yalnızca bağlantı özetini (ortam, anahtarın son 4 hanesi, firma adı) görür.
import React, { useEffect, useState } from 'react';
import { View, Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import { Text, Button, Card, Field, Segmented, SwitchRow, Badge } from '@/components/ds';
import { PanelGate, PanelPage, useWide } from '@/components/panel/Shell';
import { PlanCard } from '@/components/panel/Plan';
import { useTheme, radius } from '@/lib/theme';
import {
  beginParasut,
  connectIyzico,
  disconnectProvider,
  loadClinicSettings,
  onlinePayEnabled,
  payServerFeatures,
  saveClinicSettings,
  watchClinicPay,
  DEFAULT_SETTINGS,
  type ClinicPay,
  type ClinicSettings,
  type ConnectError,
} from '@/lib/pos/sales';
import type { VetProfile } from '@/lib/auth';

export default function SettingsPage() {
  return <PanelGate>{(vet) => <Settings vet={vet} />}</PanelGate>;
}

const CONNECT_ERRORS: Record<ConnectError, string> = {
  offline: 'Ödeme sunucusuna ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
  auth: 'Oturumunuz yenilenmeli. Sayfayı yenileyip tekrar deneyin.',
  forbidden: 'Bu klinik adına ayar yapma yetkiniz görünmüyor.',
  invalid_keys: 'iyzico bu anahtarları kabul etmedi. Kopyalarken eksik ya da fazla karakter kalmış olabilir.',
  vault: 'Ödeme sunucusu henüz hazır değil; biraz sonra tekrar deneyin.',
  parasut_not_configured: 'Paraşüt bağlantısı henüz açılmadı.',
  server: 'Bir sorun oldu. Biraz sonra tekrar deneyin.',
};

const dateOf = (ms: number) => (ms ? new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

function confirmAsk(message: string, onYes: () => void) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.confirm(message)) onYes();
    return;
  }
  Alert.alert('Emin misiniz?', message, [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Evet', style: 'destructive', onPress: onYes },
  ]);
}

function settingsUrl(): string {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return '';
  const base = (Constants.expoConfig?.experiments as { baseUrl?: string } | undefined)?.baseUrl ?? '';
  return `${window.location.origin}${base}/panel/ayarlar`;
}

function Settings({ vet }: { vet: VetProfile }) {
  const wide = useWide();
  const [pay, setPay] = useState<ClinicPay | null>(null);
  const [features, setFeatures] = useState<{ vault: boolean; parasut: boolean } | null>(null);
  const [banner, setBanner] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => watchClinicPay(vet.clinic_id, setPay), [vet.clinic_id]);
  useEffect(() => {
    payServerFeatures().then(setFeatures);
  }, []);
  // Paraşüt'ten dönüş: ?parasut=ok | error&reason=…
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    const r = q.get('parasut');
    if (!r) return;
    setBanner(r === 'ok' ? { ok: true, text: 'Paraşüt bağlandı.' } : { ok: false, text: `Paraşüt bağlanamadı: ${q.get('reason') || 'bilinmeyen hata'}` });
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  return (
    <PanelPage>
      <View style={{ paddingVertical: 24, gap: 18 }}>
        <View style={{ gap: 4 }}>
          <Text variant="title">Ayarlar</Text>
          <Text variant="callout" tone="muted">
            Paketiniz, kartla ödemenin hangi hesaba geçeceği ve makbuzun nasıl kesileceği.
          </Text>
        </View>
        {banner ? <Notice ok={banner.ok} text={banner.text} /> : null}
        <PlanCard clinicId={vet.clinic_id} />
        {!onlinePayEnabled ? (
          <Card>
            <Text variant="callout" tone="muted">
              Ödeme sunucusu bu kurulumda yapılandırılmamış; bağlantı ayarları kullanılamıyor.
            </Text>
          </Card>
        ) : (
          <View style={{ flexDirection: wide ? 'row' : 'column', gap: 18, alignItems: 'flex-start' }}>
            <View style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%', gap: 18 }}>
              <IyzicoCard vet={vet} pay={pay} vaultReady={features?.vault ?? true} />
            </View>
            <View style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%', gap: 18 }}>
              <ParasutCard vet={vet} pay={pay} available={features?.parasut ?? false} vaultReady={features?.vault ?? true} />
            </View>
          </View>
        )}
      </View>
    </PanelPage>
  );
}

function Notice({ ok, text }: { ok: boolean; text: string }) {
  const t = useTheme();
  return (
    <View style={{ padding: 14, borderRadius: radius.md, backgroundColor: ok ? t.primarySoft : t.surfaceAlt }}>
      <Text variant="callout" color={ok ? t.primary : t.danger}>
        {text}
      </Text>
    </View>
  );
}

function IyzicoCard({ vet, pay, vaultReady }: { vet: VetProfile; pay: ClinicPay | null; vaultReady: boolean }) {
  const t = useTheme();
  const [editing, setEditing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const linked = pay?.iyzico ?? null;
  const showForm = !linked || editing;

  const connect = async () => {
    if (!apiKey.trim() || !secretKey.trim()) return setMsg({ ok: false, text: 'İki anahtarı da yapıştırın.' });
    setBusy(true);
    setMsg(null);
    const r = await connectIyzico(vet.clinic_id, apiKey, secretKey);
    setBusy(false);
    if ('error' in r) {
      setMsg({ ok: false, text: r.message && r.error === 'invalid_keys' ? `${CONNECT_ERRORS[r.error]} (iyzico: ${r.message})` : CONNECT_ERRORS[r.error] });
      return;
    }
    setApiKey('');
    setSecretKey('');
    setEditing(false);
    setMsg({ ok: true, text: r.env === 'live' ? 'Bağlandı. Kartla ödemeler artık doğrudan iyzico hesabınıza geçecek.' : 'Deneme hesabınız bağlandı. Gerçek ödeme için canlı anahtarlarınızla yeniden bağlayın.' });
  };
  const remove = () =>
    confirmAsk('iyzico bağlantısı kaldırılsın mı? Kartla ödemeler Patiport deneme hesabına döner.', async () => {
      setBusy(true);
      const ok = await disconnectProvider(vet.clinic_id, 'iyzico');
      setBusy(false);
      setMsg(ok ? { ok: true, text: 'Bağlantı kaldırıldı.' } : { ok: false, text: CONNECT_ERRORS.server });
    });

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text variant="headline">Kartla ödeme: iyzico</Text>
        {linked ? <Badge label={linked.env === 'live' ? 'Bağlı · Canlı' : 'Bağlı · Deneme'} tone={linked.env === 'live' ? 'open' : 'honey'} /> : <Badge label="Bağlı değil" />}
      </View>
      <Text variant="callout" tone="muted">
        Kendi iyzico üye işyeri hesabınızı bağlayın; hasta sahibinin kartla ödediği para doğrudan sizin hesabınıza geçer. Anahtarlarınız şifrelenip
        yalnızca ödeme sunucusunda saklanır, panelde bir daha görünmez.
      </Text>

      {linked && !editing ? (
        <View style={{ padding: 14, borderRadius: radius.md, backgroundColor: t.surfaceAlt, gap: 4 }}>
          <Text variant="callout">API anahtarı ••••{linked.key_hint}</Text>
          <Text variant="caption" tone="muted">
            {linked.env === 'live' ? 'Canlı hesap: gerçek ödemeler' : 'Deneme hesabı: para çekilmez'}
            {linked.connected_ms ? ` · ${dateOf(linked.connected_ms)} tarihinde bağlandı` : ''}
          </Text>
        </View>
      ) : null}

      {showForm ? (
        !vaultReady ? (
          <Text variant="callout" tone="muted">
            Kendi hesabınızı bağlama birazdan açılacak.
          </Text>
        ) : (
          <View>
            <Text variant="caption" tone="muted" style={{ marginBottom: 10 }}>
              iyzico üye işyeri paneli → Ayarlar → Firma Ayarları → API Anahtarları. "sandbox-" ile başlayan anahtarlar deneme ortamında çalışır.
            </Text>
            <Field label="API anahtarı" value={apiKey} onChangeText={setApiKey} autoCapitalize="none" autoCorrect={false} placeholder="Yapıştırın" />
            <Field label="Güvenlik anahtarı" value={secretKey} onChangeText={setSecretKey} autoCapitalize="none" autoCorrect={false} secureTextEntry placeholder="Yapıştırın" />
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              <Button title="Bağla ve dene" icon="link-outline" loading={busy} onPress={connect} />
              {editing ? <Button title="Vazgeç" variant="ghost" onPress={() => setEditing(false)} /> : null}
            </View>
          </View>
        )
      ) : (
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Button title="Anahtarları değiştir" variant="secondary" size="sm" onPress={() => setEditing(true)} />
          <Button title="Bağlantıyı kaldır" variant="ghost" size="sm" loading={busy} onPress={remove} />
        </View>
      )}
      {msg ? (
        <Text variant="caption" tone={msg.ok ? undefined : 'danger'} color={msg.ok ? t.open : undefined}>
          {msg.text}
        </Text>
      ) : null}
    </Card>
  );
}

const VAT_OPTIONS = [
  { key: '20', label: '%20' },
  { key: '10', label: '%10' },
  { key: '1', label: '%1' },
  { key: '0', label: '%0' },
] as const;

function ParasutCard({ vet, pay, available, vaultReady }: { vet: VetProfile; pay: ClinicPay | null; available: boolean; vaultReady: boolean }) {
  const t = useTheme();
  const linked = pay?.parasut ?? null;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState<ClinicSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadClinicSettings(vet.clinic_id)
      .then(setForm)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [vet.clinic_id]);

  const connect = async () => {
    setBusy(true);
    setMsg(null);
    const r = await beginParasut(vet.clinic_id, settingsUrl());
    if ('error' in r) {
      setBusy(false);
      setMsg({ ok: false, text: CONNECT_ERRORS[r.error] });
      return;
    }
    // Paraşüt'ün kendi giriş sayfası; izin verilince Ayarlar'a geri dönülür
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.href = r.url;
  };
  const remove = () =>
    confirmAsk('Paraşüt bağlantısı kaldırılsın mı? Yeni tahsilatlar için belge kesilmez.', async () => {
      setBusy(true);
      const ok = await disconnectProvider(vet.clinic_id, 'parasut');
      setBusy(false);
      setMsg(ok ? { ok: true, text: 'Bağlantı kaldırıldı.' } : { ok: false, text: CONNECT_ERRORS.server });
    });
  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await saveClinicSettings(vet, form);
      setMsg({ ok: true, text: 'Kaydedildi.' });
    } catch {
      setMsg({ ok: false, text: 'Kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text variant="headline">Fatura ve makbuz: Paraşüt</Text>
        {!available ? (
          <Badge label="Yakında" tone="honey" />
        ) : linked ? (
          <Badge label={linked.status === 'reauth' ? 'Yeniden bağlanın' : 'Bağlı'} tone={linked.status === 'reauth' ? 'honey' : 'open'} />
        ) : (
          <Badge label="Bağlı değil" />
        )}
      </View>
      <Text variant="callout" tone="muted">
        Nakit ve kartla tahsilatlarda e-SMM (muayenehane) ya da e-Arşiv fatura (şirket) Paraşüt hesabınızdan kesilir ve tahsilatın makbuzunda görünür.
        Paraşüt şifreniz bize gelmez; bağlanırken Paraşüt'ün kendi sayfasında izin verirsiniz. Deneme ödemelerine belge kesilmez.
      </Text>

      {!available ? (
        <Text variant="callout" tone="muted">
          Paraşüt bağlantısı Patiport'un Paraşüt uygulama izni tamamlanınca açılacak. Aşağıdaki ayarları şimdiden kaydedebilirsiniz.
        </Text>
      ) : linked ? (
        <View style={{ padding: 14, borderRadius: radius.md, backgroundColor: t.surfaceAlt, gap: 4 }}>
          <Text variant="callout">{linked.company_name}</Text>
          <Text variant="caption" tone="muted">
            {linked.status === 'reauth' ? 'Paraşüt oturumu sona erdi; belge kesmek için yeniden bağlayın.' : `Paraşüt firma no ${linked.company_id}`}
            {linked.connected_ms ? ` · ${dateOf(linked.connected_ms)} tarihinde bağlandı` : ''}
          </Text>
        </View>
      ) : null}

      {available ? (
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          {!linked || linked.status === 'reauth' ? (
            <Button title={linked ? 'Yeniden bağlan' : "Paraşüt'e bağlan"} icon="link-outline" loading={busy} disabled={!vaultReady} onPress={connect} />
          ) : null}
          {linked ? <Button title="Bağlantıyı kaldır" variant="ghost" size="sm" loading={busy} onPress={remove} /> : null}
        </View>
      ) : null}

      {loaded ? (
        <View style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 14 }}>
          <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>
            Belge türü
          </Text>
          <Segmented
            options={[
              { key: 'e_smm', label: 'e-SMM' },
              { key: 'e_archive', label: 'e-Arşiv fatura' },
            ]}
            value={form.edoc_type}
            onChange={(k) => setForm({ ...form, edoc_type: k })}
          />
          <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>
            KDV oranı (tutarlar KDV dahil girilir)
          </Text>
          <Segmented options={VAT_OPTIONS.map((o) => ({ ...o }))} value={String(form.vat_rate)} onChange={(k) => setForm({ ...form, vat_rate: Number(k) as ClinicSettings['vat_rate'] })} />
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            <View style={{ flexGrow: 1, flexBasis: 140 }}>
              <Field label="İl" value={form.edoc_city} onChangeText={(v) => setForm({ ...form, edoc_city: v })} placeholder="Ankara" />
            </View>
            <View style={{ flexGrow: 1, flexBasis: 140 }}>
              <Field label="İlçe" value={form.edoc_district} onChangeText={(v) => setForm({ ...form, edoc_district: v })} placeholder="Çankaya" />
            </View>
          </View>
          <SwitchRow label="Tahsilat alınınca kendiliğinden kes" hint="Kapalıysa makbuzdaki düğmeyle elle kesersiniz." value={form.edoc_auto} onValueChange={(v) => setForm({ ...form, edoc_auto: v })} />
          <Text variant="caption" tone="subtle" style={{ marginVertical: 8 }}>
            Belge türü ve KDV oranı için mali müşavirinize danışın. Hasta sahibinin kimlik numarası bilinmediğinde nihai tüketici numarası kullanılır.
          </Text>
          <Button title="Kaydet" variant="secondary" loading={busy} onPress={save} style={{ alignSelf: 'flex-start' }} />
        </View>
      ) : null}
      {msg ? (
        <Text variant="caption" tone={msg.ok ? undefined : 'danger'} color={msg.ok ? t.open : undefined}>
          {msg.text}
        </Text>
      ) : null}
    </Card>
  );
}
