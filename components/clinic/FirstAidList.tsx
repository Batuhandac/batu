import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text, Icon, IconBadge } from '@/components/ds';
import { useTheme, radius } from '@/lib/theme';
import { FIRST_AID, NEVER_HUMAN_MEDS } from '@/lib/content/firstAid';

/** "Veterinere ulaşana kadar" — açılır kapanır ilk yardım rehberi. */
export function FirstAidList({ initiallyOpen }: { initiallyOpen?: string }) {
  const t = useTheme();
  const [open, setOpen] = useState<string | null>(initiallyOpen ?? null);

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: t.sosSoft, marginBottom: 12 }}>
        <Icon name="close-circle" size={20} color={t.sos} />
        <Text variant="callout" color={t.sos} style={{ flex: 1 }}>
          {NEVER_HUMAN_MEDS}
        </Text>
      </View>
      {FIRST_AID.map((g) => {
        const expanded = open === g.key;
        return (
          <View
            key={g.key}
            style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: radius.md, marginBottom: 8, overflow: 'hidden' }}
          >
            <Pressable
              onPress={() => setOpen(expanded ? null : g.key)}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                backgroundColor: pressed ? t.surfaceAlt : 'transparent',
              })}
            >
              <IconBadge name={g.icon} size={36} />
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {g.title}
              </Text>
              <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={t.textSubtle} />
            </Pressable>
            {expanded && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>
                {g.steps.map((s) => (
                  <View key={s} style={{ flexDirection: 'row', gap: 10 }}>
                    <Icon name="checkmark-circle" size={18} color={t.open} />
                    <Text variant="callout" style={{ flex: 1 }}>
                      {s}
                    </Text>
                  </View>
                ))}
                {g.avoid.map((s) => (
                  <View key={s} style={{ flexDirection: 'row', gap: 10 }}>
                    <Icon name="close-circle" size={18} color={t.sos} />
                    <Text variant="callout" style={{ flex: 1 }}>
                      {s}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
