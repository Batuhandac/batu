import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fontSize, radius, spacing } from '@/constants/theme';

export interface DropdownOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  onChange: (value: string) => void;
}

export function Dropdown({
  options,
  value,
  placeholder = 'Seç...',
  icon,
  onChange,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
        onPress={() => setOpen(true)}
      >
        {icon && <View style={styles.triggerIcon}>{icon}</View>}
        <Text style={[styles.triggerLabel, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.option, opt.value === value && styles.optionSelected]}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.icon && <View style={styles.optionIcon}>{opt.icon}</View>}
                  <Text
                    style={[
                      styles.optionLabel,
                      opt.value === value && styles.optionLabelSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {opt.value === value && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    flex: 1,
  },
  pressed: { opacity: 0.7 },
  triggerIcon: {},
  triggerLabel: {
    flex: 1,
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  placeholder: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 18,
    lineHeight: 18,
    marginTop: -4,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: 400,
    paddingVertical: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  optionSelected: {
    backgroundColor: colors.primaryMuted,
  },
  optionIcon: {},
  optionLabel: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
  },
  optionLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  check: {
    color: colors.primary,
    fontSize: fontSize.md,
  },
});
