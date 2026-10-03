// Tahsilat (POS + e-SMM) bekleme listesi ve kısa anket. Cevaplar hangi yazarkasa
// markası ve e-SMM yoluyla başlayacağımızı belirler (docs/HEKIM_YOL_HARITASI.md).
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text, Button, Card, Field, Chip } from '@/components/ds';
import { useTheme } from '@/lib/theme';
import { ESMM_WAYS, POS_BRANDS, WANTS, loadVetInterest, saveVetInterest, type Want } from '@/lib/data/vetInterest';

function Choice({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text variant="caption" tone="muted" style={{ marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((o) => (
          <Chip key={o} label={o} active={value === o} onPress={() => onChange(value === o ? null : o)} onSurface />
        ))}
      </View>
    </View>
  );
}

export function InterestCard({ uid, clinicName, compact }: { uid: string; clinicName: string | null; compact?: boolean }) {
  const t = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [joined, setJoined] = useState(false);
  const [open, setOpen] = useState(!compact);
  const [software, setSoftware] = useState('');
  const [pos, setPos] = useState<string | null>(null);
  const [esmm, setEsmm] = useState<string | null>(null);
  const [wants, setWants] = useState<Want[]>(['tahsilat']);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    loadVetInterest(uid)
      .then((d) => {
        if (d) {
          setJoined(true);
          setSoftware(d.current_software ?? '');
          setPos(d.pos_brand);
          setEsmm(d.esmm_way);
          setWants(d.wants ?? []);
          setNote(d.note ?? '');
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [uid]);

  const toggle = (k: Want) => setWants((w) => (w.includes(k) ? w.filter((x) => x !== k) : [...w, k]));

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await saveVetInterest(uid, { clinic_name: clinicName, current_software: software, pos_brand: pos, esmm_way: esmm, wants, note });
      setJoined(true);
      setMsg({ ok: true, text: 'Teşekkürler. POS bağlantısı hazır olunca ilk sizinle deneyeceğiz.' });
      if (compact) setOpen(false);
    } catch {
      setMsg({ ok: false, text: 'Kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ gap: 4 }}>
      <Text variant="headline">Yazarkasa POS bağlantısı</Text>
      <Text variant="callout" tone="muted" style={{ marginBottom: 10 }}>
        Kartla ve nakit tahsilat panelde hazır. Sırada kliniğinizdeki yazarkasa POS cihazına bağlanmak var; hangi cihazla başlayacağımızı
        sizin cevaplarınız belirleyecek.
      </Text>
      {!loaded ? null : !open ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Text variant="callout" color={joined ? t.open : undefined}>
            {joined ? 'Bekleme listesindesiniz.' : 'Bir dakikalık dört soru.'}
          </Text>
          <Button title={joined ? 'Cevaplarımı düzenle' : 'Bekleme listesine katıl'} size="sm" variant={joined ? 'ghost' : 'primary'} onPress={() => setOpen(true)} />
        </View>
      ) : (
        <>
          <Field label="Şu an kullandığınız klinik programı" value={software} onChangeText={setSoftware} placeholder="Yoksa boş bırakın" />
          <Choice label="Kartla ödemeyi hangi cihazla alıyorsunuz?" options={POS_BRANDS} value={pos} onChange={setPos} />
          <Choice label="e-SMM / e-Arşiv'i nasıl kesiyorsunuz?" options={ESMM_WAYS} value={esmm} onChange={setEsmm} />
          <View style={{ marginBottom: 14 }}>
            <Text variant="caption" tone="muted" style={{ marginBottom: 8 }}>
              En çok hangisi işinize yarar?
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {WANTS.map((w) => (
                <Chip key={w.key} label={w.label} active={wants.includes(w.key)} onPress={() => toggle(w.key)} onSurface />
              ))}
            </View>
          </View>
          <Field label="Eklemek istediğiniz (isteğe bağlı)" value={note} onChangeText={setNote} multiline placeholder="Programınızda en çok neye takılıyorsunuz?" />
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Button title={joined ? 'Kaydet' : 'Bekleme listesine katıl'} loading={busy} onPress={save} />
            {compact ? <Button title="Vazgeç" variant="ghost" onPress={() => setOpen(false)} /> : null}
          </View>
        </>
      )}
      {msg ? (
        <Text variant="caption" tone={msg.ok ? undefined : 'danger'} color={msg.ok ? t.open : undefined} style={{ marginTop: 8 }}>
          {msg.text}
        </Text>
      ) : null}
    </Card>
  );
}
