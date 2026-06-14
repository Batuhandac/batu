import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  fetchClinicPhotos,
  addClinicPhoto,
  isFirebaseConfigured,
} from '@/lib/data/community';
import { track } from '@/lib/analytics';

export function PhotosSection({ clinicId }: { clinicId: string }) {
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
      Alert.alert('İzin gerekli', 'Fotoğraf eklemek için galeri izni ver.');
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
      Alert.alert('Yüklenemedi', 'Fotoğraf yüklenemedi. İnternet bağlantını kontrol et.');
    }
  };

  if (!isFirebaseConfigured) return null;

  return (
    <View className="mt-6">
      <View className="flex-row items-center justify-between px-4 mb-3">
        <Text className="text-white text-lg font-bold">Fotoğraflar</Text>
        <TouchableOpacity
          onPress={addPhoto}
          disabled={uploading}
          className="bg-card border border-border rounded-full px-3.5 py-1.5 flex-row items-center gap-1.5"
          activeOpacity={0.85}
        >
          {uploading ? (
            <ActivityIndicator color="#E53E3E" size="small" />
          ) : (
            <Text className="text-gray-label text-sm font-semibold">📷 Ekle</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#E53E3E" className="my-4" />
      ) : photos.length === 0 ? (
        <TouchableOpacity
          onPress={addPhoto}
          activeOpacity={0.85}
          className="mx-4 bg-card border border-dashed border-border rounded-2xl py-8 items-center"
        >
          <Text className="text-3xl mb-2">📸</Text>
          <Text className="text-gray-text text-sm text-center px-6">
            Henüz fotoğraf yok. İlk fotoğrafı sen ekle — başkaları doğru yere geldiğini anlasın.
          </Text>
        </TouchableOpacity>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        >
          {photos.map((url) => (
            <Image
              key={url}
              source={{ uri: url }}
              style={{ width: 160, height: 160, borderRadius: 16, backgroundColor: '#152336' }}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
