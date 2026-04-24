import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { ScannerOverlay } from '@/components/scanner/ScannerOverlay';
import { ScanResultSheet } from '@/components/scanner/ScanResultSheet';
import { useScanStore } from '@/stores/scanStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { useAuthStore } from '@/stores/authStore';
import { Condition } from '@/types';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const { user } = useAuthStore();
  const { phase, results, activeIndex, error, scan, setActiveIndex, reset, clearError } = useScanStore();
  const { addCard } = useCollectionStore();

  const result = results[activeIndex] ?? null;
  const isScanning = phase === 'scanning' || phase === 'processing';
  const showResult = phase === 'result' && results.length > 0;

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isScanning || !user) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
        skipProcessing: true,
      });

      if (!photo?.base64) return;
      await scan(photo.base64, user.id);
    } catch {
      // camera error
    }
  }, [isScanning, user, scan]);

  const handlePickFromGallery = useCallback(async () => {
    if (isScanning || !user) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (picked.canceled || !picked.assets[0]?.base64) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await scan(picked.assets[0].base64, user.id);
  }, [isScanning, user, scan]);

  const handleAddToCollection = useCallback(
    async (condition: Condition, quantity: number, foil: boolean) => {
      if (!result || !user) return;
      setAdding(true);
      try {
        await addCard(user.id, result.card, { condition, quantity, foil: foil });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAddedToast(true);
        reset();
        setTimeout(() => setAddedToast(false), 2000);
      } catch {
        // handle
      } finally {
        setAdding(false);
      }
    },
    [result, user, addCard, reset],
  );

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={{ fontSize: 56, marginBottom: 16 }}>📷</Text>
        <Text style={styles.permTitle}>Kamera Tarama</Text>
        <Text style={styles.permText}>
          Kart tarama özelliği mobil uygulamamızda mevcuttur.{'\n'}
          Galeri yükleme ile devam edebilirsin.
        </Text>
        <Pressable style={styles.permBtn} onPress={handlePickFromGallery}>
          <Text style={styles.permBtnText}>📁 Galeriden Yükle</Text>
        </Pressable>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Geri Dön</Text>
        </Pressable>
        <ScanResultSheet
          results={results}
          activeIndex={activeIndex}
          onSelectIndex={setActiveIndex}
          visible={phase === 'result' && results.length > 0}
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
        <Text style={styles.permTitle}>Kamera İzni Gerekli</Text>
        <Text style={styles.permText}>
          Kartlarını taramak için kamera erişimine ihtiyacımız var.
        </Text>
        <Pressable style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>İzin Ver</Text>
        </Pressable>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Geri Dön</Text>
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

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Text style={styles.iconBtnText}>✕</Text>
          </Pressable>
          <Text style={styles.topTitle}>Kart Tara</Text>
          <Pressable
            style={[styles.iconBtn, torch && styles.iconBtnActive]}
            onPress={() => setTorch(!torch)}
          >
            <Text style={styles.iconBtnText}>⚡</Text>
          </Pressable>
        </View>

        <View style={styles.hint}>
          {isScanning ? (
            <View style={styles.scanningRow}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.hintText}>
                {phase === 'scanning' ? 'Görüntü alınıyor...' : 'Kart tanınıyor...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.hintText}>Kartı çerçeve içine al</Text>
          )}
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={clearError}>
              <Text style={styles.errorDismiss}>Tekrar Dene</Text>
            </Pressable>
          </View>
        )}

        {addedToast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>✓ Koleksiyona eklendi!</Text>
          </View>
        )}

        <View style={styles.bottomBar}>
          <Pressable style={styles.galleryBtn} onPress={handlePickFromGallery}>
            <Text style={styles.galleryIcon}>🖼</Text>
          </Pressable>

          <Pressable
            style={[styles.captureBtn, isScanning && styles.captureBtnDisabled]}
            onPress={handleCapture}
            disabled={isScanning}
          >
            <View style={styles.captureInner} />
          </Pressable>

          <View style={styles.galleryBtn} />
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: 'rgba(47,129,247,0.6)',
  },
  iconBtnText: {
    color: '#fff',
    fontSize: 18,
  },
  topTitle: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  hint: {
    alignItems: 'center',
    marginTop: -40,
  },
  scanningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  hintText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fontSize.sm,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  errorBanner: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.errorMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    flex: 1,
  },
  errorDismiss: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginLeft: spacing.md,
  },
  toast: {
    alignSelf: 'center',
    backgroundColor: colors.successMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.success,
  },
  toastText: {
    color: colors.success,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  galleryBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryIcon: { fontSize: 22 },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  captureBtnDisabled: { opacity: 0.5 },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: '#fff',
  },
  permTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  permText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  permBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  permBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '600' },
  backBtn: { paddingVertical: spacing.md },
  backBtnText: { color: colors.primary, fontSize: fontSize.md },
});
