import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  className?: string;
}

export function Screen({ children, scroll = false, className = '' }: Props) {
  if (scroll) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <ScrollView className={`flex-1 ${className}`} contentContainerClassName="pb-8">
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className={`flex-1 ${className}`}>{children}</View>
    </SafeAreaView>
  );
}
