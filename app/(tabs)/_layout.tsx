import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  if (focused) {
    return (
      <View
        style={{
          backgroundColor: '#ff7f1c',
          borderRadius: 999,
          paddingHorizontal: 16,
          paddingVertical: 6,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          marginBottom: 2,
        }}
      >
        <Text style={{ fontSize: 15 }}>{emoji}</Text>
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{label}</Text>
      </View>
    );
  }
  return (
    <View style={{ alignItems: 'center', paddingBottom: 2 }}>
      <Text style={{ fontSize: 20, opacity: 0.45 }}>{emoji}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'rgba(31,31,33,0.96)',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          paddingBottom: 0,
          paddingTop: 0,
          height: 72,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Ana Sayfa" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="nearby/index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📍" label="Yakın" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" label="Harita" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pets/index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🐾" label="Petlerim" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" label="Ayarlar" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
