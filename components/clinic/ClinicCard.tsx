import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Card, Text, Icon, Badge, IconButton } from '@/components/ds';
import { useTheme } from '@/lib/theme';
import { callClinic } from '@/lib/utils/call';
import { clinicStatus, formatDistance } from '@/lib/utils/status';
import type { Clinic } from '@/types';

export { formatDistance };

export function ClinicCard({ clinic }: { clinic: Clinic }) {
  const t = useTheme();
  const s = clinicStatus(clinic);
  const meta = [clinic.distance_km > 0 ? formatDistance(clinic.distance_km) : null, clinic.district].filter(Boolean).join(' · ');

  return (
    <Card
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        router.push(`/clinic/${clinic.id}`);
      }}
      accessibilityLabel={`${clinic.name}, ${s.label}${meta ? ', ' + meta : ''}`}
      style={{ marginHorizontal: 20, marginBottom: 10 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
              {clinic.name}
            </Text>
            {clinic.is_verified ? <Icon name="shield-checkmark" size={16} color={t.primary} /> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
            {meta ? (
              <Text variant="caption" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
                {meta}
              </Text>
            ) : null}
            {clinic.rating != null && clinic.rating > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Icon name="star" size={12} color={t.honey} />
                <Text variant="caption" tone="muted">
                  {clinic.rating.toFixed(1).replace('.', ',')}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 4, marginTop: 6 }}>
            <Badge label={s.label} tone={s.tone} dot />
            {s.closingSoon ? <Badge label={s.closingSoon} tone="honey" icon="time-outline" /> : null}
            {clinic.accepts_emergency && !clinic.is_24_7 ? <Badge label="Acil kabul" tone="sos" /> : null}
            {clinic.source === 'community' ? <Badge label="Kullanıcı ekledi" tone="neutral" /> : null}
          </View>
        </View>

        {clinic.phone || clinic.emergency_phone ? (
          <IconButton
            icon="call"
            variant={s.tone === 'open' ? 'primary' : 'secondary'}
            color={s.tone === 'open' ? t.onPrimary : t.primary}
            size={44}
            onPress={() => callClinic(clinic.phone ? clinic : { ...clinic, phone: clinic.emergency_phone! }, 'list')}
            accessibilityLabel={`${clinic.name} ara`}
          />
        ) : (
          <Icon name="chevron-forward" size={20} color={t.textSubtle} />
        )}
      </View>
    </Card>
  );
}
