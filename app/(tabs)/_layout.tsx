import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/ds';
import { useTheme, fonts } from '@/lib/theme';

function tabIcon(active: IconName, idle: IconName) {
  return ({ focused, color }: { focused: boolean; color: string }) => (
    <Icon name={focused ? active : idle} size={24} color={color} />
  );
}

export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textSubtle,
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.border,
          borderTopWidth: 1,
          height: 64 + Math.max(insets.bottom, 10),
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
        },
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Ana sayfa', tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tabs.Screen name="nearby/index" options={{ title: 'Klinikler', tabBarIcon: tabIcon('list', 'list-outline') }} />
      <Tabs.Screen name="map" options={{ title: 'Harita', tabBarIcon: tabIcon('map', 'map-outline') }} />
      <Tabs.Screen name="pets/index" options={{ title: 'Dostlarım', tabBarIcon: tabIcon('paw', 'paw-outline') }} />
      <Tabs.Screen name="settings" options={{ title: 'Ayarlar', tabBarIcon: tabIcon('settings', 'settings-outline') }} />
    </Tabs>
  );
}
