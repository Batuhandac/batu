import React, { useEffect, useState, useCallback } from 'react';
import { Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Section, Card, EmptyState } from '@/components/ds';
import { useTheme } from '@/lib/theme';
import * as ImagePicker from 'expo-image-picker';
import {
  fetchClinicPhotos,
  addClinicPhoto,
  isFirebaseConfigured,
} from '@/lib/data/community';
import { track } from '@/lib/analytics';

export function PhotosSection({ clinicId }: { clinicId: string }) {
  const t = useTheme();
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setPhotos(await fetchClinicPhotos(clinicId));
    setLoading(false);
  }, [clinicId]);

  useEffect(() => { load(); }, [load]);

  const addPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Galeri izni gerekli', 'Fotoğraf eklemek için Ayarlar’dan galeri erişimine izin ver.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setUploading(true);
    const url = await addClinicPhoto(clinicId, result.assets[0].uri);
    setUploading(false);
    if (url) {
      await track('clinic_photo_added', { clinic_id: clinicId });
      setPhotos((p) => [url, ...p]);
    } else {
      Alert.alert('Yüklenemedi', 'İnternet bağlantını kontrol edip tekrar dene.');
    }
  };

  if (!isFirebaseConfigured) return null;

  return (
    <Section title="Fotoğraflar" action={uploading ? 'Yükleniyor…' : 'Ekle'} onAction={uploading ? undefined : addPhoto}>
      {loading ? (
        <ActivityIndicator color={t.primary} style={{ marginVertical: 16 }} />
      ) : photos.length === 0 ? (
        <Card tone="alt" onPress={addPhoto} padded={false}>
          <EmptyState
            icon="camera-outline"
            title="Henüz fotoğraf yok"
            text="Kliniğin girişini ya da tabelasını ekle; ilk kez gelen biri doğru kapıyı kolayca bulsun."
          />
        </Card>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {photos.map((url) => (
            <Image key={url} source={{ uri: url }} style={{ width: 160, height: 160, borderRadius: 16, backgroundColor: t.surfaceAlt }} />
          ))}
        </ScrollView>
      )}
    </Section>
  );
}
