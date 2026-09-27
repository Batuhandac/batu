import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/lib/theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color?: string }) {
  const t = useTheme();
  return <Ionicons name={name} size={size} color={color ?? t.text} />;
}

/** Yumuşak renkli daire içinde ikon — liste ve kartlarda görsel çapa. */
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
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: background ?? t.primarySoft,
        },
        style,
      ]}
    >
      <Ionicons name={name} size={iconSize ?? Math.round(size * 0.5)} color={color ?? t.primary} />
    </View>
  );
}
