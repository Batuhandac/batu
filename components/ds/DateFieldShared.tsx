import React from 'react';
import { View } from 'react-native';
import { Chip } from './Controls';
import { addDays, todayISO } from '@/lib/utils/dates';

export interface DateFieldProps {
  label: string;
  value: string | null; // YYYY-MM-DD
  onChange: (v: string | null) => void;
  quick?: { label: string; days: number }[];
  hint?: string;
  maximumToday?: boolean; // doğum tarihi gibi geçmiş tarihler
  optional?: boolean;
}

export function QuickDates({ quick, value, onChange }: { quick: { label: string; days: number }[]; value: string | null; onChange: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
      {quick.map((q) => {
        const iso = addDays(todayISO(), q.days);
        return <Chip key={q.label} label={q.label} active={value === iso} onPress={() => onChange(iso)} />;
      })}
    </View>
  );
}
