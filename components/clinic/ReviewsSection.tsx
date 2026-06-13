import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Stars } from '@/components/ui/Stars';
import {
  fetchReviews,
  addReview,
  summarizeReviews,
  isFirebaseConfigured,
} from '@/lib/data/community';
import { getAuthorName, setAuthorName } from '@/lib/deviceId';
import { track } from '@/lib/analytics';
import type { Review } from '@/types';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d} gün önce`;
  const h = Math.floor(diff / 3600000);
  if (h > 0) return `${h} saat önce`;
  const m = Math.floor(diff / 60000);
  if (m > 0) return `${m} dk önce`;
  return 'az önce';
}

export function ReviewsSection({ clinicId, clinicName }: { clinicId: string; clinicName: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setReviews(await fetchReviews(clinicId));
    setLoading(false);
  }, [clinicId]);

  useEffect(() => { load(); }, [load]);

  const summary = summarizeReviews(reviews);

  // Firebase yapılandırılmamışsa bölümü gizle (yerel-only mod)
  if (!isFirebaseConfigured) return null;

  return (
    <View className="px-4 mt-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-white text-lg font-bold">Yorumlar</Text>
        <TouchableOpacity
          onPress={() => setModal(true)}
          className="bg-red-sos rounded-full px-4 py-1.5"
          activeOpacity={0.85}
        >
          <Text className="text-white text-sm font-semibold">Yorum yaz</Text>
        </TouchableOpacity>
      </View>

      {/* Özet */}
      {summary.count > 0 && (
        <View className="flex-row items-center gap-3 mb-4 bg-card border border-border rounded-2xl px-4 py-3">
          <Text className="text-white text-3xl font-bold">{summary.average.toFixed(1)}</Text>
          <View>
            <Stars value={summary.average} size={18} />
            <Text className="text-gray-muted text-xs mt-1">{summary.count} değerlendirme</Text>
          </View>
        </View>
      )}

      {loading && <ActivityIndicator color="#E53E3E" className="my-4" />}

      {!loading && reviews.length === 0 && (
        <View className="bg-card border border-border rounded-2xl px-4 py-6 items-center">
          <Text className="text-3xl mb-2">💬</Text>
          <Text className="text-gray-text text-sm text-center">
            Henüz yorum yok. İlk yorumu sen yaz, diğer pati sahiplerine yardım et!
          </Text>
        </View>
      )}

      {!loading &&
        reviews.map((r) => (
          <View key={r.id} className="bg-card border border-border rounded-2xl px-4 py-3 mb-2.5">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white font-semibold text-sm">{r.author_name}</Text>
              <Text className="text-gray-muted text-xs">{timeAgo(r.created_at)}</Text>
            </View>
            <Stars value={r.rating} size={13} />
            {!!r.comment && <Text className="text-gray-label text-sm mt-2 leading-relaxed">{r.comment}</Text>}
          </View>
        ))}

      <AddReviewModal
        visible={modal}
        onClose={() => setModal(false)}
        clinicId={clinicId}
        clinicName={clinicName}
        onSubmitted={load}
      />
    </View>
  );
}

function AddReviewModal({
  visible,
  onClose,
  clinicId,
  clinicName,
  onSubmitted,
}: {
  visible: boolean;
  onClose: () => void;
  clinicId: string;
  clinicName: string;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) getAuthorName().then((n) => setName(n === 'Pati dostu' ? '' : n));
  }, [visible]);

  const submit = async () => {
    setSaving(true);
    if (name.trim()) await setAuthorName(name.trim());
    const ok = await addReview(clinicId, rating, comment);
    setSaving(false);
    if (ok) {
      await track('review_added', { clinic_id: clinicId, rating });
      setComment('');
      onClose();
      onSubmitted();
    } else {
      Alert.alert('Gönderilemedi', 'Yorum kaydedilemedi. İnternet bağlantını kontrol et.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-surface rounded-t-3xl p-6 pb-10">
          <Text className="text-white text-xl font-bold text-center mb-1">Yorumun</Text>
          <Text className="text-gray-muted text-sm text-center mb-5" numberOfLines={1}>{clinicName}</Text>

          <View className="items-center mb-5">
            <Stars value={rating} size={38} onChange={setRating} />
          </View>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Adın (opsiyonel)"
            placeholderTextColor="#718096"
            className="bg-card border border-border rounded-2xl px-4 py-3 text-white mb-3"
          />
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Deneyimini yaz: ulaşılabilir miydi, acil kabul etti mi, ilgi nasıldı?"
            placeholderTextColor="#718096"
            multiline
            numberOfLines={4}
            className="bg-card border border-border rounded-2xl px-4 py-3 text-white mb-5"
            style={{ minHeight: 96, textAlignVertical: 'top' }}
          />

          <TouchableOpacity
            onPress={submit}
            disabled={saving}
            className={`bg-red-sos rounded-2xl py-4 items-center ${saving ? 'opacity-50' : ''}`}
            activeOpacity={0.85}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Gönder</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="py-3 items-center mt-1">
            <Text className="text-gray-text">Vazgeç</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
