import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '@/constants/theme';
import { STRINGS } from '@/constants/i18n';
import { useSettings } from '@/stores/settingsStore';

type IconName = keyof typeof Ionicons.glyphMap;

export default function TabsLayout() {
  const lang = useSettings((s) => s.lang);
  const tab = (name: keyof typeof STRINGS.tabs, on: IconName, off: IconName) => ({
    title: STRINGS.tabs[name][lang],
    tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <Ionicons name={focused ? on : off} size={22} color={color} />,
  });
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textFaint, tabBarLabelStyle: styles.label, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="index" options={tab('home', 'flame', 'flame-outline')} />
      <Tabs.Screen name="cheats" options={tab('cheats', 'game-controller', 'game-controller-outline')} />
      <Tabs.Screen name="missions" options={tab('missions', 'trophy', 'trophy-outline')} />
      <Tabs.Screen name="meta" options={tab('meta', 'flash', 'flash-outline')} />
      <Tabs.Screen name="map" options={tab('map', 'map', 'map-outline')} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: '#0B0813', borderTopWidth: 1, borderTopColor: '#1C1629', elevation: 0, shadowOpacity: 0, height: Platform.OS === 'ios' ? 86 : 66, paddingBottom: Platform.OS === 'ios' ? 26 : 8, paddingTop: 8 },
  label: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.4 },
});
