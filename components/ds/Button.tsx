import React from 'react';
import { Pressable, View, ActivityIndicator, type ViewStyle } from 'react-native';
import { useTheme, radius, type Theme } from '@/lib/theme';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'sos' | 'secondary' | 'ghost' | 'danger' | 'soft';
type Size = 'lg' | 'md' | 'sm';

function colors(t: Theme, v: Variant, pressed: boolean) {
  switch (v) {
    case 'primary':
      return { bg: pressed ? t.primaryPressed : t.primary, fg: t.onPrimary, border: 'transparent' };
    case 'sos':
      return { bg: pressed ? t.sosPressed : t.sos, fg: t.onSos, border: 'transparent' };
    case 'danger':
      return { bg: pressed ? t.dangerSoft : 'transparent', fg: t.danger, border: t.danger };
    case 'soft':
      return { bg: t.primarySoft, fg: t.primary, border: 'transparent' };
    case 'ghost':
      return { bg: pressed ? t.surfaceAlt : 'transparent', fg: t.primary, border: 'transparent' };
    default:
      return { bg: pressed ? t.surfaceAlt : t.surface, fg: t.text, border: t.border };
  }
}

const SIZES: Record<Size, { h: number; px: number; icon: number }> = {
  lg: { h: 58, px: 22, icon: 22 },
  md: { h: 48, px: 18, icon: 19 },
  sm: { h: 38, px: 14, icon: 16 },
};

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  subtitle?: string;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  subtitle,
  loading,
  disabled,
  full,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const t = useTheme();
  const s = SIZES[size];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!(disabled || loading) }}
      style={({ pressed }) => {
        const c = colors(t, variant, pressed);
        return [
          {
            minHeight: subtitle ? s.h + 18 : s.h,
            paddingHorizontal: s.px,
            borderRadius: size === 'sm' ? radius.pill : radius.md,
            backgroundColor: c.bg,
            borderWidth: variant === 'secondary' || variant === 'danger' ? 1 : 0,
            borderColor: c.border,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: full ? 'stretch' : 'auto',
            opacity: disabled ? 0.45 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
          style,
        ];
      }}
    >
      {({ pressed }) => {
        const c = colors(t, variant, pressed);
        return loading ? (
          <ActivityIndicator color={c.fg} />
        ) : (
          <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {icon ? <Icon name={icon} size={s.icon} color={c.fg} /> : null}
              <Text variant="button" color={c.fg} style={size === 'lg' ? { fontSize: 18 } : size === 'sm' ? { fontSize: 14 } : undefined}>
                {title}
              </Text>
            </View>
            {subtitle ? (
              <Text variant="caption" color={c.fg} style={{ opacity: 0.85, marginTop: 2 }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        );
      }}
    </Pressable>
  );
}

/** Yuvarlak ikon butonu (geri, favori, ara). */
export function IconButton({
  icon,
  onPress,
  variant = 'secondary',
  size = 44,
  accessibilityLabel,
  color,
}: {
  icon: IconName;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'soft' | 'sos' | 'plain';
  size?: number;
  accessibilityLabel: string;
  color?: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => {
        const bg =
          variant === 'primary'
            ? pressed ? t.primaryPressed : t.primary
            : variant === 'sos'
            ? pressed ? t.sosPressed : t.sos
            : variant === 'soft'
            ? t.primarySoft
            : variant === 'plain'
            ? 'transparent'
            : pressed ? t.surfaceAlt : t.surface;
        return {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: t.border,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.94 : 1 }],
        };
      }}
    >
      <Icon
        name={icon}
        size={Math.round(size * 0.45)}
        color={
          color ??
          (variant === 'primary' ? t.onPrimary : variant === 'sos' ? t.onSos : variant === 'soft' ? t.primary : t.text)
        }
      />
    </Pressable>
  );
}
