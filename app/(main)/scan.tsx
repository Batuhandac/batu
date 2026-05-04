import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScannerOverlay } from '@/components/scanner/ScannerOverlay';
import { ScanResultSheet } from '@/components/scanner/ScanResultSheet';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { useScanStore } from '@/stores/scanStore';
import { Condition } from '@/types';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const { user, profile } = useAuthStore();
  const { phase, results, activeIndex, error, scan, setActiveIndex, reset, clearError } = useScanStore();
  const { addCard } = useCollectionStore();

  const result = results[activeIndex] ?? null;
  const isScanning = phase === 'scanning' || phase === 'processing';
  const showResult = phase === 'result' && results.length > 0;
  const scanLimit = profile?.tier === 'free' ? 10 : null;
  const scanCount = profile?.scanCountMonth ?? 0;
  const scanLimitReached = scanLimit !== null && scanCount >= scanLimit;

  const guardScanLimit = useCallback(() => {
    if (!scanLimitReached) return false;
    Alert.alert(
      'Free scan limit reached',
      'Free plan includes up to 10 scans per month. Upgrade to Premium for unlimited scan and sell integrations.',
    );
    return true;
  }, [scanLimitReached]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isScanning || !user) return;
    if (guardScanLimit()) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 1,
        skipProcessing: false,
      });

      if (!photo?.base64) return;
      await scan(photo.base64, user.id);
    } catch {
      // Camera failures are surfaced through the next retry path.
    }
  }, [guardScanLimit, isScanning, user, scan]);

  const handlePickFromGallery = useCallback(async () => {
    if (isScanning || !user) return;
    if (guardScanLimit()) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      base64: true,
    });

    if (picked.canceled || !picked.assets[0]?.base64) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await scan(picked.assets[0].base64, user.id);
  }, [guardScanLimit, isScanning, user, scan]);

  const handleAddToCollection = useCallback(
    async (condition: Condition, quantity: number, foil: boolean) => {
      if (!result || !user) return;
      setAdding(true);
      try {
        await addCard(user.id, result.card, { condition, quantity, foil });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAddedToast(true);
        reset();
        setTimeout(() => setAddedToast(false), 2000);
      } finally {
        setAdding(false);
      }
    },
    [result, user, addCard, reset],
  );

  const handleBulkMode = () => {
    Alert.alert(
      'Bulk scan',
      'Toplu masa tarama arayuzu hazir. Bu modda tek fotograf icinden kart ayirma/manuel review akisini baglayacagiz.',
    );
  };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.webSafe}>
        <View style={styles.webCard}>
          <View style={styles.webMark}>
            <Text style={styles.webMarkText}>SCAN</Text>
          </View>
          <Text style={styles.webTitle}>Exact Print Scanner</Text>
          <Text style={styles.webText}>
            Mobilde kamera ile calisir. Web testinde ayni dogrulama pipeline'i icin kart fotografi yukleyebilirsin.
          </Text>
          <Pressable style={styles.primaryButton} onPress={handlePickFromGallery}>
            <Text style={styles.primaryButtonText}>Upload from gallery</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        </View>
        <ScanResultSheet
          results={results}
          activeIndex={activeIndex}
          onSelectIndex={setActiveIndex}
          visible={showResult}
          onClose={reset}
          onAddToCollection={handleAddToCollection}
          adding={adding}
        />
      </SafeAreaView>
    );
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centered}>
        <View style={styles.permissionMark}>
          <Text style={styles.permissionMarkText}>CAM</Text>
        </View>
        <Text style={styles.permissionTitle}>Camera permission required</Text>
        <Text style={styles.permissionText}>
          Exact-print scan needs the camera. The app only adds a card after set, number and rarity are verified.
        </Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Allow camera</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
      />
      <ScannerOverlay />

      <SafeAreaView style={styles.hud} edges={['top', 'bottom']}>
        <View style={styles.topHud}>
          <View style={styles.leftHudStack}>
            <StatusChip label="Exact Print Mode" tone="primary" />
            <StatusChip label="Lighting: Good" tone="warning" />
            {scanLimit !== null && (
              <StatusChip label={`Free scans ${Math.min(scanCount, scanLimit)}/${scanLimit}`} tone={scanLimitReached ? 'warning' : 'primary'} />
            )}
          </View>
          <View style={styles.providerChip}>
            <Text style={styles.providerText}>TCGPlayer / Cardmarket</Text>
          </View>
        </View>

        <View style={styles.titleBar}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Text style={styles.iconButtonText}>X</Text>
          </Pressable>
          <View style={styles.scanState}>
            <Text style={styles.scanTitle}>Scan Center</Text>
            <Text style={styles.scanSubtitle}>
              {isScanning
                ? phase === 'scanning'
                  ? 'Capturing image...'
                  : 'Verifying exact print...'
                : 'Align the card and keep the collector number visible'}
            </Text>
          </View>
          <Pressable
            style={[styles.iconButton, torch && styles.iconButtonActive]}
            onPress={() => setTorch(!torch)}
          >
            <Text style={styles.iconButtonText}>LGT</Text>
          </Pressable>
        </View>

        <View style={styles.midLayer}>
          {isScanning && (
            <View style={styles.processingPill}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.processingText}>Cross-checking print data</Text>
            </View>
          )}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={clearError}>
                <Text style={styles.errorAction}>Retry</Text>
              </Pressable>
            </View>
          )}
          {addedToast && (
            <View style={styles.toast}>
              <Text style={styles.toastText}>Added to collection</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomControls}>
          <View style={styles.recentStrip}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.miniThumb} />
            ))}
          </View>
          <View style={styles.controlsRow}>
            <Pressable style={styles.roundControl} onPress={handlePickFromGallery}>
              <Text style={styles.roundControlText}>PHOTO</Text>
            </Pressable>
            <Pressable
              style={[styles.captureButton, (isScanning || scanLimitReached) && styles.disabled]}
              onPress={handleCapture}
              disabled={isScanning}
            >
              <View style={styles.captureInner} />
            </Pressable>
            <Pressable style={styles.roundControl} onPress={handleBulkMode}>
              <Text style={styles.roundControlText}>BULK</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScanResultSheet
        results={results}
        activeIndex={activeIndex}
        onSelectIndex={setActiveIndex}
        visible={showResult}
        onClose={reset}
        onAddToCollection={handleAddToCollection}
        adding={adding}
      />
    </View>
  );
}

function StatusChip({ label, tone }: { label: string; tone: 'primary' | 'warning' }) {
  const color = tone === 'primary' ? colors.primary : colors.warning;
  return (
    <View style={[styles.statusChip, { borderColor: color }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  webSafe: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  webCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  webMark: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webMarkText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '900' },
  webTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '900' },
  webText: { color: colors.textMuted, fontSize: fontSize.md, lineHeight: 22, textAlign: 'center' },
  hud: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topHud: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  leftHudStack: { gap: spacing.xs },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(32,31,33,0.72)',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusDot: { width: 7, height: 7, borderRadius: radius.full },
  statusText: { color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  providerChip: {
    maxWidth: '45%',
    backgroundColor: 'rgba(32,31,33,0.72)',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  providerText: { color: colors.textMuted, fontSize: 10, fontWeight: '900', textAlign: 'right' },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: 'rgba(32,31,33,0.82)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  iconButtonText: { color: colors.text, fontSize: 10, fontWeight: '900' },
  scanState: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.md },
  scanTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '900' },
  scanSubtitle: { color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center', marginTop: 2 },
  midLayer: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  processingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(14,14,16,0.84)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  processingText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '800' },
  errorBanner: {
    width: '100%',
    backgroundColor: colors.errorMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  errorText: { color: colors.error, flex: 1, fontSize: fontSize.sm },
  errorAction: { color: colors.error, fontSize: fontSize.sm, fontWeight: '900' },
  toast: {
    backgroundColor: colors.successMuted,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.success,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  toastText: { color: colors.success, fontSize: fontSize.sm, fontWeight: '900' },
  bottomControls: {
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.64)',
    gap: spacing.md,
  },
  recentStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    opacity: 0.42,
  },
  miniThumb: {
    width: 34,
    height: 48,
    borderRadius: 3,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxxl,
  },
  roundControl: {
    width: 54,
    height: 54,
    borderRadius: radius.full,
    backgroundColor: 'rgba(32,31,33,0.86)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundControlText: { color: colors.textMuted, fontSize: 9, fontWeight: '900' },
  captureButton: {
    width: 84,
    height: 84,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  disabled: { opacity: 0.5 },
  permissionMark: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionMarkText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '900' },
  permissionTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '900', textAlign: 'center' },
  permissionText: { color: colors.textMuted, fontSize: fontSize.md, lineHeight: 22, textAlign: 'center' },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    minWidth: 210,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.onPrimary, fontSize: fontSize.md, fontWeight: '900' },
  secondaryButton: { paddingVertical: spacing.sm },
  secondaryButtonText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '800' },
});
