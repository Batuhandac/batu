import React from 'react';
import { View, Pressable, Modal, ScrollView, type ViewStyle, type StyleProp } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { useTheme, radius, shadow } from '@/lib/theme';
import { Text } from './Text';
import { Icon, IconBadge, type IconName } from './Icon';
import { IconButton } from './Button';

export function Screen({
  children,
  scroll,
  edges = ['top'],
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={edges}>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[{ paddingBottom: 40 }, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
  padded = true,
  onPress,
  tone = 'surface',
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  onPress?: () => void;
  tone?: 'surface' | 'primary' | 'sos' | 'honey' | 'alt';
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  const bg =
    tone === 'primary' ? t.primarySoft : tone === 'sos' ? t.sosSoft : tone === 'honey' ? t.honeySoft : tone === 'alt' ? t.surfaceAlt : t.surface;
  const base: ViewStyle = {
    backgroundColor: bg,
    borderRadius: radius.lg,
    borderWidth: tone === 'surface' ? 1 : 0,
    borderColor: t.border,
    padding: padded ? 16 : 0,
    ...(tone === 'surface' ? shadow(t, 1) : {}),
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }, style]}
    >
      {children}
    </Pressable>
  );
}

export function Header({
  title,
  subtitle,
  onBack,
  right,
  large = true,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  large?: boolean;
}) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
      {(onBack || right) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: large ? 12 : 0 }}>
          {onBack ? <IconButton icon="chevron-back" onPress={onBack} accessibilityLabel="Geri" size={40} /> : <View />}
          {right}
        </View>
      )}
      <Text variant={large ? 'title' : 'headline'}>{title}</Text>
      {subtitle ? (
        <Text variant="callout" tone="muted" style={{ marginTop: 4 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function Section({
  title,
  action,
  onAction,
  children,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ marginTop: 28, paddingHorizontal: 20 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text variant="headline">{title}</Text>
        {action ? (
          <Pressable onPress={onAction} hitSlop={10}>
            <Text variant="callout" tone="primary">
              {action}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
  iconColor,
  iconBg,
  last,
  danger,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  last?: boolean;
  danger?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: pressed ? t.surfaceAlt : 'transparent',
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.border,
      })}
    >
      {icon ? (
        <IconBadge
          name={icon}
          size={36}
          color={iconColor ?? (danger ? t.danger : t.primary)}
          background={iconBg ?? (danger ? t.dangerSoft : t.primarySoft)}
        />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" tone={danger ? 'danger' : 'default'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted" style={{ marginTop: 1 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron-forward" size={18} color={t.textSubtle} /> : null)}
    </Pressable>
  );
}

export function Group({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View
      style={[
        { backgroundColor: t.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: t.border, overflow: 'hidden', ...shadow(t, 1) },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: IconName;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 28 }}>
      <IconBadge name={icon} size={64} background={t.surfaceAlt} color={t.textMuted} />
      <Text variant="headline" center style={{ marginTop: 16 }}>
        {title}
      </Text>
      {text ? (
        <Text variant="callout" tone="muted" center style={{ marginTop: 6 }}>
          {text}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: 18, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

/** Alttan açılan sayfa (modal). */
export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: t.overlay }} onPress={onClose} accessibilityLabel="Kapat" />
      <View
        style={{
          backgroundColor: t.bg,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 16) + 8,
          maxHeight: '85%',
        }}
      >
        <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: t.borderStrong, marginBottom: 12 }} />
        {title ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 }}>
            <Text variant="headline">{title}</Text>
            <IconButton icon="close" onPress={onClose} accessibilityLabel="Kapat" size={36} variant="plain" />
          </View>
        ) : null}
        {children}
      </View>
    </Modal>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[{ height: 1, backgroundColor: t.border }, style]} />;
}

/** Baş harfli yuvarlak avatar (pet, klinik). */
export function Avatar({ label, size = 48, color, background }: { label: string; size?: number; color?: string; background?: string }) {
  const t = useTheme();
  const initial = label.trim().charAt(0).toLocaleUpperCase('tr-TR') || '?';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.36,
        backgroundColor: background ?? t.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="title" color={color ?? t.primary} style={{ fontSize: size * 0.42, lineHeight: size * 0.52 }}>
        {initial}
      </Text>
    </View>
  );
}
