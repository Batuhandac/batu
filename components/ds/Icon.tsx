import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/lib/theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color?: string }) {
  const t = useTheme();
  return <Ionicons name={name} size={size} color={color ?? t.text} />;
}

/**
 * Satır ve kart başındaki ikon. Varsayılan hâli arka plansız sade ikondur;
 * arka plan yalnızca avatar gibi dolu bir işaret gerektiğinde verilir.
 */
export function IconBadge({
  name,
  color,
  background,
  size = 40,
  iconSize,
  style,
}: {
  name: IconName;
  color?: string;
  background?: string;
  size?: number;
  iconSize?: number;
  style?: ViewStyle;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: background ? size / 2 : 0,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: background ?? 'transparent',
        },
        style,
      ]}
    >
      <Ionicons name={name} size={iconSize ?? Math.round(size * (background ? 0.5 : 0.62))} color={color ?? t.primary} />
    </View>
  );
}
