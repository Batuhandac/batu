import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { Text, Card, Button, Sheet, Field } from '@/components/ds';
import { useTheme } from '@/lib/theme';
import { addWeight, type WeightEntry } from '@/lib/data/care';
import { formatDate } from '@/lib/utils/dates';

const kgText = (n: number) => `${String(Math.round(n * 10) / 10).replace('.', ',')} kg`;

function Sparkline({ data, width, height }: { data: WeightEntry[]; width: number; height: number }) {
  const t = useTheme();
  if (data.length < 2) return null;
  const min = Math.min(...data.map((d) => d.kg));
  const max = Math.max(...data.map((d) => d.kg));
  const span = max - min || 1;
  const pts = data.map((d, i) => {
    const x = 6 + (i * (width - 12)) / (data.length - 1);
    const y = 6 + (1 - (d.kg - min) / span) * (height - 12);
    return [x, y] as const;
  });
  const last = pts[pts.length - 1];
  return (
    <Svg width={width} height={height} accessibilityLabel="Kilo grafiği">
      <Polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={t.primary} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={last[0]} cy={last[1]} r={5} fill={t.primary} />
    </Svg>
  );
}

export function WeightCard({ petId, petName, entries, onChanged }: { petId: string; petName: string; entries: WeightEntry[]; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const last = entries[entries.length - 1];
  const prev = entries[entries.length - 2];
  const delta = last && prev ? last.kg - prev.kg : null;
  const kg = parseFloat(value.replace(',', '.'));
  const valid = Number.isFinite(kg) && kg > 0 && kg < 150;

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    await addWeight(petId, Math.round(kg * 100) / 100);
    setSaving(false);
    setOpen(false);
    setValue('');
    onChanged();
  };

  return (
    <Card>
      {last ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text variant="display" style={{ fontSize: 30 }}>
              {kgText(last.kg)}
            </Text>
            <Text variant="caption" tone="muted">
              {delta != null && Math.abs(delta) >= 0.05
                ? `${delta > 0 ? '+' : '−'}${kgText(Math.abs(delta))} · ${formatDate(prev.date, false)} tarihine göre`
                : `Son tartı: ${formatDate(last.date, false)}`}
            </Text>
          </View>
          <Sparkline data={entries.slice(-12)} width={120} height={48} />
        </View>
      ) : (
        <Text variant="callout" tone="muted">
          Düzenli tartmak, sağlık sorunlarını erken fark etmeni sağlar. {petName} için ilk kiloyu ekle.
        </Text>
      )}
      <Button title="Kilo ekle" variant="soft" icon="add" size="sm" onPress={() => setOpen(true)} style={{ alignSelf: 'flex-start', marginTop: 12 }} />
      <Sheet visible={open} onClose={() => setOpen(false)} title="Kilo ekle">
        <View style={{ paddingHorizontal: 20 }}>
          <Field label={`${petName} kaç kilo? (kg)`} value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder={last ? String(last.kg).replace('.', ',') : '4,2'} autoFocus />
          <Button title="Kaydet" full loading={saving} disabled={!valid} onPress={save} />
        </View>
      </Sheet>
    </Card>
  );
}
