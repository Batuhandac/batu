import React from 'react';
import { Tabs } from 'expo-router';
import { Icon, type IconName } from '@/components/ds';
import { useTheme, hairline, fonts } from '@/lib/theme';

function tabIcon(active: IconName, idle: IconName) {
  return ({ focused, color }: { focused: boolean; color: string }) => (
    <Icon name={focused ? active : idle} size={25} color={color} />
  );
}

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textSubtle,
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: 11, lineHeight: 14 },
        tabBarStyle: { backgroundColor: t.dark ? '#24201D' : '#F9F9F9', borderTopColor: t.border, borderTopWidth: hairline },
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Ana sayfa', tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tabs.Screen name="nearby/index" options={{ title: 'Klinikler', tabBarIcon: tabIcon('location', 'location-outline') }} />
      <Tabs.Screen name="community" options={{ title: 'Topluluk', tabBarIcon: tabIcon('chatbubbles', 'chatbubbles-outline') }} />
      <Tabs.Screen name="pets/index" options={{ title: 'Dostlarım', tabBarIcon: tabIcon('paw', 'paw-outline') }} />
      <Tabs.Screen name="settings" options={{ title: 'Ayarlar', tabBarIcon: tabIcon('settings', 'settings-outline') }} />
    </Tabs>
  );
}
