// Test POS: panelden gönderilen tutarın düştüğü sanal kart terminali. Başka bir
// sekmede ya da telefonda aynı hekim hesabıyla açılır. "Kartı okut" onaylar,
// "Reddet" reddeder; sonuç panelde anında görünür. Banka çekimi ve e-SMM yok.
import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Text, Icon, LogoMark } from '@/components/ds';
import { PanelGate } from '@/components/panel/Shell';
import { formatTL } from '@/lib/pos/money';
import { resolveSale, watchPendingSales, type Sale } from '@/lib/pos/sales';
import type { VetProfile } from '@/lib/auth';

// Terminal ekranı tema bağımsız: gerçek POS'lar gibi koyu zemin, net rakamlar
const C = {
  body: '#15130f',
  screen: '#1f2a24',
  glass: '#26352d',
  text: '#eef5f0',
  muted: '#9fb5a8',
  ok: '#5cc79c',
  bad: '#f08a7e',
  key: '#2e3b33',
};

type Phase = { kind: 'idle' } | { kind: 'processing'; sale: Sale } | { kind: 'done'; sale: Sale; ok: boolean };

export default function TestPosPage() {
  return <PanelGate>{(vet) => <Terminal vet={vet} />}</PanelGate>;
}

function Terminal({ vet }: { vet: VetProfile }) {
  const [pending, setPending] = useState<Sale[] | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

  useEffect(() => watchPendingSales(vet.clinic_id, setPending), [vet.clinic_id]);

  const current = phase.kind === 'idle' ? pending?.[0] ?? null : phase.sale;

  const act = async (sale: Sale, ok: boolean) => {
    setPhase({ kind: 'processing', sale });
    // Gerçek terminal gibi kısa bir bekleme; sonuç belgeye yazılır
    await new Promise((r) => setTimeout(r, ok ? 1400 : 700));
    try {
      await resolveSale(vet, sale, ok ? 'approved' : 'declined');
      setPhase({ kind: 'done', sale, ok });
    } catch {
      setPhase({ kind: 'done', sale, ok: false });
    }
    setTimeout(() => setPhase({ kind: 'idle' }), 2600);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0d0c0a' }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <View style={{ width: '100%', maxWidth: 380, backgroundColor: C.body, borderRadius: 36, padding: 18, gap: 16, borderWidth: 1, borderColor: '#2b2822' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <LogoMark size={26} />
          <Text variant="bodyStrong" color={C.text} style={{ flex: 1 }}>
            Patiport Test POS
          </Text>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#3a2f14' }}>
            <Text variant="caption" color="#f2c45a" style={{ fontWeight: '800' }}>
              TEST
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: C.screen, borderRadius: 22, minHeight: 280, padding: 22, justifyContent: 'center', gap: 10 }}>
          {pending === null ? (
            <ActivityIndicator color={C.ok} />
          ) : !current ? (
            <View style={{ alignItems: 'center', gap: 10 }}>
              <Icon name="card-outline" size={40} color={C.muted} />
              <Text variant="headline" color={C.text} center>
                Tutar bekleniyor
              </Text>
              <Text variant="callout" color={C.muted} center>
                Panelde hasta kartından "POS'a gönder"e basın; tutar burada görünür.
              </Text>
            </View>
          ) : phase.kind === 'processing' ? (
            <View style={{ alignItems: 'center', gap: 12 }}>
              <ActivityIndicator color={C.ok} size="large" />
              <Text variant="headline" color={C.text}>
                İşleniyor…
              </Text>
            </View>
          ) : phase.kind === 'done' ? (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Icon name={phase.ok ? 'checkmark-circle' : 'close-circle'} size={56} color={phase.ok ? C.ok : C.bad} />
              <Text variant="title" color={phase.ok ? C.ok : C.bad}>
                {phase.ok ? 'ONAYLANDI' : 'REDDEDİLDİ'}
              </Text>
              <Text variant="headline" color={C.text}>
                {formatTL(phase.sale.amount_kurus)}
              </Text>
            </View>
          ) : (
            <>
              <Text variant="caption" color={C.muted}>
                {current.patient_name ? `${current.description} · ${current.patient_name}` : current.description}
              </Text>
              <Text variant="display" color={C.text} style={{ fontSize: 44, lineHeight: 52 }}>
                {formatTL(current.amount_kurus)}
              </Text>
              <Text variant="callout" color={C.muted}>
                Kartı okutun ya da temassız yaklaştırın.
              </Text>
              {pending && pending.length > 1 ? (
                <Text variant="caption" color={C.muted}>
                  Sırada {pending.length - 1} işlem daha var.
                </Text>
              ) : null}
            </>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Key label="Reddet" color={C.bad} disabled={!current || phase.kind !== 'idle'} onPress={() => current && act(current, false)} />
          <Key label="Kartı okut" color={C.ok} primary disabled={!current || phase.kind !== 'idle'} onPress={() => current && act(current, true)} />
        </View>
        <Text variant="caption" color={C.muted} center>
          Test modu: bankadan çekim yapılmaz, e-SMM kesilmez.
        </Text>
      </View>
    </ScrollView>
  );
}

function Key({ label, color, primary, disabled, onPress }: { label: string; color: string; primary?: boolean; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flex: primary ? 1.4 : 1,
        height: 64,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: primary ? color : C.key,
        opacity: disabled ? 0.35 : pressed ? 0.8 : 1,
      })}
    >
      <Text variant="bodyStrong" color={primary ? '#10261c' : color} style={{ fontSize: 18 }}>
        {label}
      </Text>
    </Pressable>
  );
}
