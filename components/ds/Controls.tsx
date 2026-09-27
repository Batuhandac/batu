import React from 'react';
import { View, Pressable, TextInput, Switch, type TextInputProps } from 'react-native';
import { useTheme, radius, type, type Theme } from '@/lib/theme';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';

export function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        height: 36,
        borderRadius: radius.pill,
        backgroundColor: active ? t.primary : pressed ? t.surfaceAlt : t.surface,
        borderWidth: 1,
        borderColor: active ? t.primary : t.border,
      })}
    >
      {icon ? <Icon name={icon} size={15} color={active ? t.onPrimary : t.textMuted} /> : null}
      <Text variant="caption" color={active ? t.onPrimary : t.text}>
        {label}
      </Text>
    </Pressable>
  );
}

export type BadgeTone = 'open' | 'closed' | 'unknown' | 'sos' | 'primary' | 'neutral' | 'honey';

function badgeColors(t: Theme, tone: BadgeTone) {
  switch (tone) {
    case 'open':
      return { fg: t.open, bg: t.openSoft };
    case 'closed':
      return { fg: t.closed, bg: t.closedSoft };
    case 'unknown':
      return { fg: t.unknown, bg: t.unknownSoft };
    case 'sos':
      return { fg: t.sos, bg: t.sosSoft };
    case 'primary':
      return { fg: t.primary, bg: t.primarySoft };
    case 'honey':
      return { fg: t.honey, bg: t.honeySoft };
    default:
      return { fg: t.textMuted, bg: t.surfaceAlt };
  }
}

export function Badge({ label, tone = 'neutral', icon, dot }: { label: string; tone?: BadgeTone; icon?: IconName; dot?: boolean }) {
  const t = useTheme();
  const c = badgeColors(t, tone);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: radius.pill,
        backgroundColor: c.bg,
        alignSelf: 'flex-start',
      }}
    >
      {dot ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.fg }} /> : null}
      {icon ? <Icon name={icon} size={13} color={c.fg} /> : null}
      <Text variant="caption" color={c.fg} style={{ fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}

export function Field({
  label,
  hint,
  error,
  multiline,
  style,
  ...input
}: TextInputProps & { label: string; hint?: string; error?: string }) {
  const t = useTheme();
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        {...input}
        multiline={multiline}
        placeholderTextColor={t.textSubtle}
        onFocus={(e) => {
          setFocused(true);
          input.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          input.onBlur?.(e);
        }}
        style={[
          type.body,
          {
            color: t.text,
            backgroundColor: t.surface,
            borderWidth: 1.5,
            borderColor: error ? t.danger : focused ? t.primary : t.border,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            paddingVertical: 12,
            minHeight: multiline ? 88 : 50,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          style,
        ]}
      />
      {error ? (
        <Text variant="caption" tone="danger" style={{ marginTop: 4 }}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="subtle" style={{ marginTop: 4 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function SwitchRow({
  label,
  hint,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: radius.md,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 12,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{label}</Text>
        {hint ? (
          <Text variant="caption" tone="muted">
            {hint}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: t.primary, false: t.borderStrong }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export function Checkbox({ checked, onPress, children }: { checked: boolean; onPress: () => void; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 7,
          borderWidth: 2,
          marginTop: 1,
          borderColor: checked ? t.primary : t.borderStrong,
          backgroundColor: checked ? t.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? <Icon name="checkmark" size={16} color={t.onPrimary} /> : null}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}

/** Seçenek butonları (tek seçim). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string; icon?: IconName }[];
  value: T | null;
  onChange: (k: T) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={{
              flex: 1,
              minHeight: 48,
              paddingVertical: 10,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: on ? t.primary : t.border,
              backgroundColor: on ? t.primarySoft : t.surface,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            {o.icon ? <Icon name={o.icon} size={18} color={on ? t.primary : t.textMuted} /> : null}
            <Text variant="caption" color={on ? t.primary : t.text}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
