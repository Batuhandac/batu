// Web ve yedek: GG.AA.YYYY metin alanı + hızlı seçimler. iOS/Android'de
// DateField.native.tsx yerel takvimi kullanır.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Field } from './Controls';
import { QuickDates, type DateFieldProps } from './DateFieldShared';
import { formatTRDate, parseTRDate } from '@/lib/utils/dates';

export type { DateFieldProps } from './DateFieldShared';

export function DateField({ label, value, onChange, quick, hint }: DateFieldProps) {
  const [text, setText] = useState(value ? formatTRDate(value) : '');
  useEffect(() => {
    setText(value ? formatTRDate(value) : '');
  }, [value]);
  return (
    <View style={{ marginBottom: 16 }}>
      <Field
        label={label}
        value={text}
        onChangeText={(v) => {
          setText(v);
          const iso = parseTRDate(v);
          if (iso) onChange(iso);
          else if (!v.trim()) onChange(null);
        }}
        placeholder="GG.AA.YYYY"
        keyboardType="numbers-and-punctuation"
        hint={hint}
        style={{ marginBottom: 0 }}
      />
      {quick ? <QuickDates quick={quick} value={value} onChange={onChange} /> : null}
    </View>
  );
}
