import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

export default function MainLayout() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Redirect href="/(auth)" />;

  return (
    <Tabs
      initialRouteName="collection/index"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="collection/index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon code="COLL" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="feed/index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon code="FEED" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.scanBtn, focused && styles.scanBtnActive]}>
              <Text style={[styles.scanIcon, focused && styles.scanIconActive]}>SCAN</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="trade/index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon code="DEAL" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon code="PROF" color={color} focused={focused} />
          ),
        }}
      />

      {/* Hidden routes */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="browse/index" options={{ href: null }} />
      <Tabs.Screen name="browse/[setCode]" options={{ href: null }} />
      <Tabs.Screen name="collection/[id]" options={{ href: null }} />
      <Tabs.Screen name="ops/index" options={{ href: null }} />
      <Tabs.Screen name="deck/index" options={{ href: null }} />
      <Tabs.Screen name="sell/index" options={{ href: null }} />
      <Tabs.Screen name="pokedex/index" options={{ href: null }} />
      <Tabs.Screen name="badges/index" options={{ href: null }} />
      <Tabs.Screen name="stats/index" options={{ href: null }} />
      <Tabs.Screen name="friends/index" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({ code, color, focused }: { code: string; color: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabCode, { color }, focused && styles.tabCodeActive]}>{code}</Text>
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
    justifyContent: 'center',
    gap: 4,
  },
  tabCode: {
    fontSize: 9,
    fontWeight: '900',
    opacity: 0.74,
    letterSpacing: 0.4,
  },
  tabCodeActive: {
    opacity: 1,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  scanBtn: {
    width: 54,
    height: 54,
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
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scanIconActive: {
    color: colors.onPrimary,
  },
});
