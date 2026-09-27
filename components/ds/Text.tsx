import React from 'react';
import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { type, useTheme, fontFor, type TypeVariant, type Theme } from '@/lib/theme';

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
  const flat: TextStyle = StyleSheet.flatten<TextStyle>([type[variant], { color: color ?? toneColor(t, tone) }, center && { textAlign: 'center' }, style]);
  // İç içe Text'te aile üst metinden gelir; kalınlık istenmişse doğru kesime çevir
  if (flat.fontWeight != null) {
    flat.fontFamily = fontFor(flat.fontFamily, flat.fontWeight);
    delete flat.fontWeight;
  }
  return <RNText {...rest} children={content} style={flat} />;
}
