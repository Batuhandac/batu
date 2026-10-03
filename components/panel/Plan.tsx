// Kliniğin paketi: erken erişim, kurucu klinik ve güvenceler (lib/pos/plan.ts).
import React, { useEffect, useState } from 'react';
import { View, Pressable, Linking } from 'react-native';
import { router } from 'expo-router';
import { Text, Card, Badge } from '@/components/ds';
import { useTheme, radius } from '@/lib/theme';
import { formatDate } from '@/lib/utils/dates';
import { LINKS } from '@/lib/links';
import { earlyDaysLeft, loadPlan, type ClinicPlan } from '@/lib/pos/plan';

export function usePlan(clinicId: string): ClinicPlan | null {
  const [plan, setPlan] = useState<ClinicPlan | null>(null);
  useEffect(() => {
    let live = true;
    loadPlan(clinicId).then((p) => live && setPlan(p));
    return () => {
      live = false;
    };
  }, [clinicId]);
  return plan;
}

function leftLabel(days: number) {
  return days > 0 ? `${days} gün kaldı` : 'Bugün son gün';
}

/** Ana sayfadaki ince şerit: erken erişim ve kurucu klinik. */
export function PlanStrip({ clinicId }: { clinicId: string }) {
  const t = useTheme();
  const plan = usePlan(clinicId);
  if (!plan) return null;
  const days = earlyDaysLeft(plan);
  if (days == null && !plan.founder && plan.plan !== 'pro') return null;
  return (
    <Pressable
      onPress={() => router.push('/panel/ayarlar')}
      accessibilityRole="link"
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 10,
        marginTop: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: radius.md,
        backgroundColor: pressed || hovered ? t.surfaceAlt : t.primarySoft,
      })}
    >
      {plan.plan === 'pro' ? <Badge label="Pro" tone="primary" /> : days != null ? <Badge label={`Erken erişim · ${leftLabel(days)}`} tone="primary" /> : null}
      {plan.founder ? <Badge label={`Kurucu klinik${plan.founder_no ? ` · ${plan.founder_no}. sıra` : ''}`} tone="honey" /> : null}
      <Text variant="caption" tone="muted" style={{ flexShrink: 1 }}>
        {days != null && plan.early_until
          ? `Tahsilat ve e-belge dahil her şey ${formatDate(plan.early_until)} tarihine kadar ücretsiz.`
          : 'Paket ayrıntıları Ayarlar sayfasında.'}
      </Text>
    </Pressable>
  );
}

/** Ayarlar sayfasındaki paket kartı: ne ücretsiz, ne zamana kadar, hangi güvenceler. */
export function PlanCard({ clinicId }: { clinicId: string }) {
  const t = useTheme();
  const plan = usePlan(clinicId);
  if (!plan) return null;
  const days = earlyDaysLeft(plan);
  const title = plan.plan === 'pro' ? 'Pro' : days != null ? 'Erken erişim' : 'Ücretsiz paket';
  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <Text variant="headline">Paketiniz: {title}</Text>
        {days != null ? <Badge label={leftLabel(days)} tone="primary" /> : null}
        {plan.founder ? <Badge label={`Kurucu klinik${plan.founder_no ? ` · ${plan.founder_no}. sıra` : ''}`} tone="honey" /> : null}
      </View>
      <View style={{ gap: 6 }}>
        <Line text="Hasta kartları, kayıtlar, sahibe hatırlatma ve onaylı profil her zaman ücretsiz." />
        {days != null && plan.early_until ? (
          <Line text={`Kartla ve nakit tahsilat, e-SMM ve e-Arşiv ${formatDate(plan.early_until)} tarihine kadar ücretsiz.`} />
        ) : null}
        {plan.founder && plan.price_locked_until ? (
          <Line text={`Kurucu klinik olarak ücretli paket geldiğinde fiyatınız ${formatDate(plan.price_locked_until)} tarihine kadar sabit kalır.`} />
        ) : null}
        <Line text="Fiyat en az 30 gün önce duyurulur. Ücretli pakete geçmezseniz ücretsiz pakette kalırsınız; kayıtlarınız silinmez." />
        <Line text="Kartla ödemelerde iyzico komisyonu iyzico ile sizin aranızdadır." />
      </View>
      <Pressable onPress={() => Linking.openURL(LINKS.support)} accessibilityRole="link" style={{ borderTopWidth: 1, borderTopColor: t.border, paddingTop: 10 }}>
        <Text variant="caption" tone="primary" style={{ fontWeight: '700' }}>
          Sorularınız için destek sayfası
        </Text>
      </Pressable>
    </Card>
  );
}

function Line({ text }: { text: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.primary, marginTop: 8 }} />
      <Text variant="callout" style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}
