import React from 'react';
import { View, Pressable, Modal, ScrollView, type ViewStyle, type StyleProp } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { useTheme, radius, hairline } from '@/lib/theme';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { IconButton } from './Button';
import { PetFace, type FaceMood } from '@/components/art';

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
  const base: ViewStyle = { backgroundColor: bg, borderRadius: radius.lg, padding: padded ? 16 : 0 };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && { opacity: 0.7 }, style]}
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
  backLabel = 'Geri',
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  large?: boolean;
  backLabel?: string;
}) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 }}>
      {(onBack || right) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, marginBottom: large && title ? 4 : 0 }}>
          {onBack ? (
            <BackButton onPress={onBack} label={backLabel} />
          ) : (
            <View />
          )}
          {right}
        </View>
      )}
      {title ? <Text variant={large ? 'title' : 'headline'}>{title}</Text> : null}
      {subtitle ? (
        <Text variant="callout" tone="muted" style={{ marginTop: 4 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/** iOS gezinme çubuğundaki gibi "‹ Geri" bağlantısı. */
export function BackButton({ onPress, label = 'Geri' }: { onPress: () => void; label?: string }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={label || 'Geri'}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', marginLeft: -8, minHeight: 44, opacity: pressed ? 0.5 : 1 })}
    >
      <Icon name="chevron-back" size={26} color={t.primary} />
      {label ? (
        <Text variant="body" tone="primary">
          {label}
        </Text>
      ) : null}
    </Pressable>
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
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text variant="headline">{title}</Text>
        {action ? (
          <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
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
  last,
  danger,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  iconColor?: string;
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
        paddingLeft: 16,
        backgroundColor: pressed ? t.surfaceAlt : 'transparent',
      })}
    >
      {icon ? (
        <View style={{ width: 28, marginRight: 12, alignItems: 'center' }}>
          <Icon name={icon} size={22} color={iconColor ?? (danger ? t.danger : t.primary)} />
        </View>
      ) : null}
      {/* Ayırıcı çizgi ikondan sonra başlar (iOS listeleri gibi) */}
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight: 52,
          paddingVertical: 11,
          paddingRight: 16,
          borderBottomWidth: last ? 0 : hairline,
          borderBottomColor: t.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text variant="body" tone={danger ? 'danger' : 'default'}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" tone="muted" style={{ marginTop: 1 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ?? (onPress ? <Icon name="chevron-forward" size={17} color={t.textSubtle} /> : null)}
      </View>
    </Pressable>
  );
}

export function Group({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View
      style={[
        { backgroundColor: t.surface, borderRadius: radius.lg, overflow: 'hidden' },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function EmptyState({
  icon,
  mascot,
  title,
  text,
  action,
}: {
  icon?: IconName;
  /** İkon yerine sevimli bir maskot (günlük ekranlarda; hata ekranlarında ikon kullan) */
  mascot?: { species: 'cat' | 'dog' | 'other'; mood?: FaceMood; fur?: string };
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 28 }}>
      {mascot ? (
        <PetFace species={mascot.species} mood={mascot.mood} fur={mascot.fur} seed={title} size={112} background="auto" />
      ) : icon ? (
        <Icon name={icon} size={44} color={t.textSubtle} />
      ) : null}
      <Text variant="headline" center style={{ marginTop: 14 }}>
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
          overflow: 'hidden',
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 16) + 8,
          maxHeight: '85%',
        }}
      >
        <View style={{ alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: t.borderStrong, marginBottom: 12 }} />
        {title ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 }}>
            <Text variant="headline">{title}</Text>
            <IconButton icon="close" onPress={onClose} accessibilityLabel="Kapat" size={30} variant="secondary" color={t.textMuted} />
          </View>
        ) : null}
        {children}
      </View>
    </Modal>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[{ height: hairline, backgroundColor: t.border }, style]} />;
}

/** Baş harfli yuvarlak avatar (pet, kişi, klinik). */
export function Avatar({ label, size = 48, color, background }: { label: string; size?: number; color?: string; background?: string }) {
  const t = useTheme();
  const initial = label.trim().charAt(0).toLocaleUpperCase('tr-TR') || '?';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: background ?? t.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="headline" color={color ?? t.textMuted} style={{ fontSize: size * 0.42, lineHeight: size * 0.52 }}>
        {initial}
      </Text>
    </View>
  );
}
