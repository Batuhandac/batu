import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

export default function MainLayout() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Redirect href="/(auth)/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="⬜" label="Ana Sayfa" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="collection/index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="🗂" label="Koleksiyon" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.scanBtn, focused && styles.scanBtnActive]}>
              <Text style={styles.scanIcon}>📷</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="trade/index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="🔄" label="Takas" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="⚙️" label="Ayarlar" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="collection/[id]" options={{ href: undefined }} />
      <Tabs.Screen name="settings.config" options={{ href: undefined }} />
    </Tabs>
  );
}

function TabIcon({
  emoji,
  label,
  color,
  focused,
}: {
  emoji: string;
  label: string;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
      {focused && <View style={styles.dot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    gap: 4,
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  scanBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    borderWidth: 3,
    borderColor: colors.bg,
  },
  scanBtnActive: {
    backgroundColor: colors.primary,
  },
  scanIcon: {
    fontSize: 24,
  },
});
