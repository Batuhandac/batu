import React from 'react';
import { Pressable, View, ActivityIndicator, type ViewStyle } from 'react-native';
import { useTheme, radius, type Theme } from '@/lib/theme';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'sos' | 'secondary' | 'ghost' | 'danger' | 'soft';
type Size = 'lg' | 'md' | 'sm';

// Dolgulu (ana iş), gri (ikincil), yazı (üçüncül). Çerçeve kullanılmaz.
function colors(t: Theme, v: Variant, pressed: boolean) {
  switch (v) {
    case 'primary':
      return { bg: pressed ? t.primaryPressed : t.primary, fg: t.onPrimary };
    case 'sos':
      return { bg: pressed ? t.sosPressed : t.sos, fg: t.onSos };
    case 'danger':
      return { bg: t.dangerSoft, fg: t.danger };
    case 'soft':
      return { bg: t.primarySoft, fg: t.primary };
    case 'ghost':
      return { bg: 'transparent', fg: t.primary };
    default:
      return { bg: t.surfaceAlt, fg: t.text };
  }
}

const SIZES: Record<Size, { h: number; px: number; icon: number; font: number }> = {
  lg: { h: 54, px: 20, icon: 21, font: 17 },
  md: { h: 46, px: 16, icon: 19, font: 16 },
  sm: { h: 34, px: 12, icon: 16, font: 15 },
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
            borderRadius: size === 'sm' ? radius.sm : radius.lg,
            backgroundColor: c.bg,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: full ? 'stretch' : 'auto',
            opacity: disabled ? 0.4 : pressed && variant !== 'primary' && variant !== 'sos' ? 0.6 : 1,
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
              <Text variant="button" color={c.fg} style={{ fontSize: s.font }}>
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
            : t.surfaceAlt;
        return {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.6 : 1,
        };
      }}
    >
      <Icon
        name={icon}
        size={Math.round(size * 0.45)}
        color={
          color ??
          (variant === 'primary' ? t.onPrimary : variant === 'sos' ? t.onSos : variant === 'soft' || variant === 'plain' ? t.primary : t.text)
        }
      />
    </Pressable>
  );
}
