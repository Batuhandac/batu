import React from 'react';
import { View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, Icon, IconBadge, Badge } from '@/components/ds';
import { useTheme } from '@/lib/theme';
import { kindMeta, REPEAT_OPTIONS, type CareItem } from '@/lib/data/care';
import { dueLabel } from '@/lib/utils/dates';

export function CareRow({
  item,
  petName,
  onPress,
  onDone,
  last,
}: {
  item: CareItem;
  petName?: string;
  onPress?: () => void;
  onDone: () => void;
  last?: boolean;
}) {
  const t = useTheme();
  const meta = kindMeta(item.kind);
  const due = dueLabel(item.due);
  const repeat = REPEAT_OPTIONS.find((r) => r.days === item.repeat_days && r.days != null)?.label;
  const sub = [petName, repeat].filter(Boolean).join(' · ');
  const iconColor = due.tone === 'sos' ? t.sos : due.tone === 'honey' ? t.honey : t.primary;
  const iconBg = due.tone === 'sos' ? t.sosSoft : due.tone === 'honey' ? t.honeySoft : t.primarySoft;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${due.label}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: pressed ? t.surfaceAlt : 'transparent',
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.border,
      })}
    >
      <IconBadge name={meta.icon} size={40} color={iconColor} background={iconBg} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {item.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
          <Badge label={due.label} tone={due.tone} />
          {sub ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {sub}
            </Text>
          ) : null}
        </View>
      </View>
      <Pressable
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          onDone();
        }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${item.title} yapıldı olarak işaretle`}
        style={({ pressed }) => ({
          width: 38,
          height: 38,
          borderRadius: 19,
          borderWidth: 2,
          borderColor: t.primary,
          backgroundColor: pressed ? t.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        {({ pressed }) => <Icon name="checkmark" size={20} color={pressed ? t.onPrimary : t.primary} />}
      </Pressable>
    </Pressable>
  );
}
