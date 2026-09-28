import React from 'react';
import { Stack } from 'expo-router';

// Hekim paneli (web): /panel. Uygulamadaki sekmelerden bağımsız, geniş ekran için.
export default function PanelLayout() {
  return <Stack screenOptions={{ headerShown: false, title: 'Patiport · Hekim paneli' }} />;
}
