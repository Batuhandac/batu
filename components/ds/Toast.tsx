// Kısa, kendiliğinden kaybolan bilgi mesajı ("Yapıldı · sonraki 27 Ekim").
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { useTheme, radius, shadow, palette } from '@/lib/theme';

interface ToastState {
  message: string | null;
  icon: IconName;
  key: number;
  show: (message: string, icon?: IconName) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  icon: 'checkmark-circle',
  key: 0,
  show: (message, icon = 'checkmark-circle') => set((s) => ({ message, icon, key: s.key + 1 })),
  hide: () => set({ message: null }),
}));

export function ToastHost() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { message, icon, key, hide } = useToast();
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(hide, 2800);
    return () => clearTimeout(id);
  }, [key, message, hide]);
  if (!message) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 90, alignItems: 'center' }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          maxWidth: 480,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: radius.lg,
          backgroundColor: t.dark ? t.surfaceAlt : t.text,
          ...shadow(t, 2),
        }}
      >
        <Icon name={icon} size={20} color={palette.pine[400]} />
        <Text variant="callout" color={t.dark ? t.text : t.bg} style={{ flexShrink: 1 }}>
          {message}
        </Text>
      </View>
    </View>
  );
}
