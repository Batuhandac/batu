// iOS/Android: yerel tarih seçici (iOS'ta satır içi "compact" takvim düğmesi).
import React, { useState } from 'react';
import { View, Platform, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from './Text';
import { Icon } from './Icon';
import { QuickDates, type DateFieldProps } from './DateFieldShared';
import { useTheme, radius } from '@/lib/theme';
import { formatDate, fromISODate, toISODate, todayISO } from '@/lib/utils/dates';

export type { DateFieldProps } from './DateFieldShared';

export function DateField({ label, value, onChange, quick, hint, maximumToday, optional }: DateFieldProps) {
  const t = useTheme();
  const [androidOpen, setAndroidOpen] = useState(false);
  const date = fromISODate(value ?? todayISO());

  return (
    <View style={{ marginBottom: 16 }}>
      <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 50,
          paddingHorizontal: 14,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: t.border,
          backgroundColor: t.surface,
        }}
      >
        {value == null ? (
          <Pressable
            onPress={() => {
              onChange(todayISO());
              if (Platform.OS === 'android') setAndroidOpen(true);
            }}
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingVertical: 12 }}
          >
            <Icon name="calendar-outline" size={18} color={t.primary} />
            <Text variant="body" tone="subtle">
              Tarih seç
            </Text>
          </Pressable>
        ) : Platform.OS === 'ios' ? (
          <>
            <Text variant="body" style={{ flex: 1 }}>
              {formatDate(value)}
            </Text>
            <DateTimePicker
              value={date}
              mode="date"
              display="compact"
              locale="tr-TR"
              maximumDate={maximumToday ? new Date() : undefined}
              accentColor={t.primary}
              themeVariant={t.dark ? 'dark' : 'light'}
              onChange={(_, d) => d && onChange(toISODate(d))}
            />
          </>
        ) : (
          <Pressable onPress={() => setAndroidOpen(true)} accessibilityRole="button" style={{ flex: 1, paddingVertical: 12 }}>
            <Text variant="body">{formatDate(value)}</Text>
          </Pressable>
        )}
        {optional && value != null ? (
          <Pressable onPress={() => onChange(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Tarihi temizle" style={{ marginLeft: 8 }}>
            <Icon name="close-circle" size={20} color={t.textSubtle} />
          </Pressable>
        ) : null}
      </View>
      {Platform.OS === 'android' && androidOpen ? (
        <DateTimePicker
          value={date}
          mode="date"
          maximumDate={maximumToday ? new Date() : undefined}
          onChange={(e, d) => {
            setAndroidOpen(false);
            if (e.type === 'set' && d) onChange(toISODate(d));
          }}
        />
      ) : null}
      {hint ? (
        <Text variant="caption" tone="subtle" style={{ marginTop: 4 }}>
          {hint}
        </Text>
      ) : null}
      {quick ? <QuickDates quick={quick} value={value} onChange={onChange} /> : null}
    </View>
  );
}
