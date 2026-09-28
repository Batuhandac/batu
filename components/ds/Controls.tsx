import React from 'react';
import { View, Pressable, TextInput, Switch, type TextInputProps } from 'react-native';
import { useTheme, radius, type, hairline, type Theme } from '@/lib/theme';
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
        backgroundColor: active ? t.primary : t.surface,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {icon ? <Icon name={icon} size={15} color={active ? t.onPrimary : t.textMuted} /> : null}
      <Text variant="callout" color={active ? t.onPrimary : t.text} style={{ fontSize: 15, fontWeight: '600' }}>
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

/** Durum etiketi: renkli kısa metin, istenirse önünde nokta. Arka plan yok. */
export function Badge({ label, tone = 'neutral', icon, dot }: { label: string; tone?: BadgeTone; icon?: IconName; dot?: boolean }) {
  const t = useTheme();
  const c = badgeColors(t, tone);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' }}>
      {dot ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.fg }} /> : null}
      {icon ? <Icon name={icon} size={14} color={c.fg} /> : null}
      <Text variant="caption" color={c.fg} style={{ fontWeight: '600' }}>
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
            borderWidth: 1,
            borderColor: error ? t.danger : focused ? t.primary : t.dark ? t.surface : t.border,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            paddingVertical: 12,
            minHeight: multiline ? 88 : 48,
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

/** Hap biçimli arama kutusu: solda büyüteç, yazı varken sağda temizle. */
export function SearchField({
  value,
  onChangeText,
  placeholder,
  loading,
}: {
  value: string;
  onChangeText: (s: string) => void;
  placeholder: string;
  loading?: boolean;
}) {
  const t = useTheme();
  const [focused, setFocused] = React.useState(false);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 46,
        paddingLeft: 14,
        paddingRight: 6,
        borderRadius: radius.pill,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: focused ? t.primary : t.dark ? t.surface : t.border,
      }}
    >
      <Icon name="search" size={18} color={t.textSubtle} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.textSubtle}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="never"
        accessibilityLabel={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[type.body, { flex: 1, color: t.text, paddingVertical: 0, height: 44, outlineWidth: 0 }]}
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Aramayı temizle"
          style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name={loading ? 'ellipsis-horizontal' : 'close-circle'} size={20} color={t.textSubtle} />
        </Pressable>
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
        borderRadius: radius.lg,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="body">{label}</Text>
        {hint ? (
          <Text variant="caption" tone="muted" style={{ marginTop: 1 }}>
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
          borderRadius: 12,
          borderWidth: 1.5,
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

/** Seçenek düğmeleri (tek seçim), iOS bölümlü kontrolü gibi. */
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
    <View style={{ flexDirection: 'row', padding: 3, borderRadius: radius.pill, backgroundColor: t.surfaceAlt, marginBottom: 16 }}>
      {options.map((o, i) => {
        const on = o.key === value;
        const prevOn = i > 0 && options[i - 1].key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={{
              flex: 1,
              minHeight: o.icon ? 52 : 36,
              paddingVertical: 6,
              paddingHorizontal: 4,
              borderRadius: radius.pill,
              backgroundColor: on ? (t.dark ? t.borderStrong : t.surface) : 'transparent',
              borderLeftWidth: i === 0 || on || prevOn ? 0 : hairline,
              borderLeftColor: t.borderStrong,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              ...(on && !t.dark ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 } : null),
            }}
          >
            {o.icon ? <Icon name={o.icon} size={18} color={on ? t.text : t.textMuted} /> : null}
            <Text variant="caption" color={t.text} style={{ fontSize: 14.5, fontWeight: on ? '700' : '500' }} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
