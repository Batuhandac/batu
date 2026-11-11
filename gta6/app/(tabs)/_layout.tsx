import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { STRINGS } from '@/constants/i18n';
import { useSettings } from '@/stores/settingsStore';

export default function TabsLayout() {
  const lang = useSettings((s) => s.lang);
  const tab = (name: keyof typeof STRINGS.tabs, code: string) => ({
    title: STRINGS.tabs[name][lang],
    tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <TabIcon code={code} color={color} focused={focused} />,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen name="index" options={tab('home', 'VI')} />
      <Tabs.Screen name="cheats" options={tab('cheats', 'CODE')} />
      <Tabs.Screen name="missions" options={tab('missions', 'MISN')} />
      <Tabs.Screen name="meta" options={tab('meta', 'META')} />
      <Tabs.Screen name="map" options={tab('map', 'MAP')} />
    </Tabs>
  );
}

function TabIcon({ code, color, focused }: { code: string; color: string; focused: boolean }) {
  return (
    <View style={[styles.icon, focused && styles.iconActive]}>
      <Text style={[styles.code, { color }]}>{code}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 86 : 66,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  label: { fontSize: 10, fontWeight: '700' },
  icon: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  iconActive: { backgroundColor: colors.primaryMuted },
  code: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
});
