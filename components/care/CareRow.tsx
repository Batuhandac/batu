import React from 'react';
import { View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, Icon } from '@/components/ds';
import { useTheme, hairline } from '@/lib/theme';
import { REPEAT_OPTIONS, type CareItem } from '@/lib/data/care';
import { dueLabel } from '@/lib/utils/dates';

/**
 * Bakım satırı. Soldaki yuvarlak "yapıldı" düğmesine basınca pati damgası basılır;
 * satırın kendisine dokununca düzenleme açılır.
 */
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
  const due = dueLabel(item.due);
  const repeat = REPEAT_OPTIONS.find((r) => r.days === item.repeat_days && r.days != null)?.label;
  const sub = [petName, repeat].filter(Boolean).join(' · ');
  const dueColor = due.tone === 'sos' ? t.sos : due.tone === 'honey' ? t.honey : due.tone === 'primary' ? t.primary : t.textMuted;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${due.label}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingLeft: 14, backgroundColor: pressed ? t.surfaceAlt : 'transparent' })}
    >
      <Pressable
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          onDone();
        }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`${item.title} yapıldı olarak işaretle`}
        style={({ pressed }) => ({
          width: 30,
          height: 30,
          borderRadius: 15,
          borderWidth: 1.5,
          borderColor: pressed ? t.primary : t.borderStrong,
          backgroundColor: pressed ? t.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        })}
      >
        {({ pressed }) => <Icon name="paw" size={15} color={pressed ? t.onPrimary : t.border} />}
      </Pressable>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 11,
          paddingRight: 14,
          minHeight: 56,
          borderBottomWidth: last ? 0 : hairline,
          borderBottomColor: t.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text variant="body" numberOfLines={1}>
            {item.title}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1} style={{ marginTop: 1 }}>
            <Text variant="caption" color={dueColor} style={{ fontWeight: due.tone === 'neutral' ? '400' : '600' }}>
              {due.label}
            </Text>
            {sub ? ` · ${sub}` : ''}
          </Text>
        </View>
        <Icon name="chevron-forward" size={17} color={t.textSubtle} />
      </View>
    </Pressable>
  );
}
