import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'sos' | 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, fullWidth }: Props) {
  const base = 'rounded-2xl items-center justify-center py-4 px-6';
  const variants = {
    sos: 'bg-red-sos',
    primary: 'bg-green-open',
    secondary: 'bg-card border border-border',
    ghost: 'bg-transparent border border-border',
  };
  const textVariants = {
    sos: 'text-white font-bold text-lg',
    primary: 'text-white font-semibold text-base',
    secondary: 'text-white font-semibold text-base',
    ghost: 'text-gray-label text-base',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className={textVariants[variant]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
