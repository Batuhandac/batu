import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import { type, useTheme, type TypeVariant, type Theme } from '@/lib/theme';

type Tone = 'default' | 'muted' | 'subtle' | 'primary' | 'sos' | 'open' | 'inverse' | 'danger' | 'honey';

function toneColor(t: Theme, tone: Tone): string {
  switch (tone) {
    case 'muted':
      return t.textMuted;
    case 'subtle':
      return t.textSubtle;
    case 'primary':
      return t.primary;
    case 'sos':
      return t.sos;
    case 'open':
      return t.open;
    case 'inverse':
      return t.onPrimary;
    case 'danger':
      return t.danger;
    case 'honey':
      return t.honey;
    default:
      return t.text;
  }
}

export interface DSTextProps extends TextProps {
  variant?: TypeVariant;
  tone?: Tone;
  color?: string;
  center?: boolean;
}

/** Türkçe büyük harf: "iyi günler" → "İYİ GÜNLER" (toUpperCase "IYI" üretir). */
export function trUpper(s: string): string {
  return s.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();
}

export function Text({ variant = 'body', tone = 'default', color, center, style, children, ...rest }: DSTextProps) {
  const t = useTheme();
  const content = variant === 'overline' && typeof children === 'string' ? trUpper(children) : children;
  return (
    <RNText
      {...rest}
      children={content}
      style={[type[variant], { color: color ?? toneColor(t, tone) }, center && { textAlign: 'center' }, style]}
    />
  );
}
