import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { Stars } from '@/components/ui/Stars';
import { Text, Button, Card, Sheet, Field, Section, EmptyState } from '@/components/ds';
import { useTheme } from '@/lib/theme';
import { fetchReviews, addReview, summarizeReviews, isFirebaseConfigured } from '@/lib/data/community';
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
  const t = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setReviews(await fetchReviews(clinicId));
    setLoading(false);
  }, [clinicId]);

  useEffect(() => { load(); }, [load]);

  // Firebase yapılandırılmamışsa bölümü gizle (yerel mod)
  if (!isFirebaseConfigured) return null;
  const summary = summarizeReviews(reviews);

  return (
    <Section title="Deneyimler" action="Yorum yaz" onAction={() => setModal(true)}>
      {summary.count > 0 && (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <Text variant="display">{summary.average.toFixed(1).replace('.', ',')}</Text>
          <View>
            <Stars value={summary.average} size={18} />
            <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
              {summary.count} değerlendirme
            </Text>
          </View>
        </Card>
      )}

      {loading ? (
        <ActivityIndicator color={t.primary} style={{ marginVertical: 16 }} />
      ) : reviews.length === 0 ? (
        <Card tone="alt" padded={false}>
          <EmptyState
            icon="chatbubbles-outline"
            title="Henüz deneyim paylaşılmamış"
            text="Telefona çıktılar mı, acil kabul ettiler mi? Kısa bir not başka bir pati sahibine yol gösterir."
          />
        </Card>
      ) : (
        reviews.map((r) => (
          <Card key={r.id} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="bodyStrong">{r.author_name}</Text>
              <Text variant="caption" tone="subtle">
                {timeAgo(r.created_at)}
              </Text>
            </View>
            <View style={{ marginTop: 4 }}>
              <Stars value={r.rating} size={13} />
            </View>
            {!!r.comment && (
              <Text variant="callout" style={{ marginTop: 8 }}>
                {r.comment}
              </Text>
            )}
          </Card>
        ))
      )}

      <AddReviewSheet visible={modal} onClose={() => setModal(false)} clinicId={clinicId} clinicName={clinicName} onSubmitted={load} />
    </Section>
  );
}

function AddReviewSheet({
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
      track('review_added', { clinic_id: clinicId, rating });
      setComment('');
      onClose();
      onSubmitted();
    } else {
      Alert.alert('Gönderilemedi', 'İnternet bağlantını kontrol edip tekrar dene.');
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Deneyimini paylaş">
      <View style={{ paddingHorizontal: 20 }}>
        <Text variant="callout" tone="muted" numberOfLines={1}>
          {clinicName}
        </Text>
        <View style={{ alignItems: 'center', marginVertical: 18 }}>
          <Stars value={rating} size={36} onChange={setRating} />
        </View>
        <Field label="Adın (isteğe bağlı)" value={name} onChangeText={setName} maxLength={40} placeholder="Görünecek ad" />
        <Field
          label="Deneyimin"
          value={comment}
          onChangeText={setComment}
          maxLength={1000}
          multiline
          placeholder="Telefona çıktılar mı, acil kabul ettiler mi, ilgi nasıldı?"
        />
        <Button title="Gönder" full loading={saving} onPress={submit} />
      </View>
    </Sheet>
  );
}
