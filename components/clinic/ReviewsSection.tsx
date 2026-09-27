import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, Alert, Pressable } from 'react-native';
import { Stars } from '@/components/ui/Stars';
import { Text, Button, Card, Sheet, Field, Section, EmptyState, Icon, Avatar } from '@/components/ds';
import { ContentMenu, RulesSheet } from '@/components/community/Safety';
import { useTheme, radius } from '@/lib/theme';
import { fetchReviews, addReview, deleteReview, replyToReview, summarizeReviews, isFirebaseConfigured } from '@/lib/data/community';
import { getBlockedUsers, hasAcceptedRules, acceptRules } from '@/lib/data/safety';
import { checkCommunityText } from '@/lib/utils/moderation';
import { getAuthorName, setAuthorName } from '@/lib/deviceId';
import { vetDisplayName } from '@/lib/auth';
import { useSession } from '@/stores/session';
import { track } from '@/lib/analytics';
import { timeAgo } from '@/lib/utils/time';
import type { Review } from '@/types';

export function ReviewsSection({ clinicId, clinicName }: { clinicId: string; clinicName: string }) {
  const t = useTheme();
  const uid = useSession((s) => s.uid);
  const vet = useSession((s) => s.vet);
  const isClinicVet = !!vet && vet.clinic_id === clinicId;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [menu, setMenu] = useState<Review | null>(null);
  const [replyTo, setReplyTo] = useState<Review | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [list, blocked] = await Promise.all([fetchReviews(clinicId), getBlockedUsers()]);
    setReviews(list.filter((r) => !blocked.has(r.author_id)));
    setLoading(false);
  }, [clinicId]);

  useEffect(() => {
    load();
  }, [load]);

  // Firebase yapılandırılmamışsa bölümü gizle (yerel mod)
  if (!isFirebaseConfigured) return null;
  const summary = summarizeReviews(reviews);

  return (
    <Section title="Deneyimler" action={isClinicVet ? undefined : 'Yorum yaz'} onAction={() => setModal(true)}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar label={r.author_name} size={32} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {r.author_name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Stars value={r.rating} size={12} />
                  <Text variant="caption" tone="subtle">
                    {timeAgo(r.created_at)}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setMenu(r)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Seçenekler">
                <Icon name="ellipsis-horizontal" size={18} color={t.textSubtle} />
              </Pressable>
            </View>
            {!!r.comment && (
              <Text variant="callout" style={{ marginTop: 10 }}>
                {r.comment}
              </Text>
            )}
            {r.vet_reply ? (
              <View style={{ marginTop: 12, padding: 12, borderRadius: radius.md, backgroundColor: t.surfaceAlt }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="checkmark-circle" size={14} color={t.primary} />
                  <Text variant="caption" tone="primary">
                    Klinik yanıtı · {r.vet_reply.name}
                  </Text>
                </View>
                <Text variant="callout" style={{ marginTop: 4 }}>
                  {r.vet_reply.text}
                </Text>
              </View>
            ) : null}
            {isClinicVet ? (
              <Button
                title={r.vet_reply ? 'Yanıtı düzenle' : 'Yanıtla'}
                variant="ghost"
                size="sm"
                icon="return-down-forward-outline"
                onPress={() => setReplyTo(r)}
                style={{ alignSelf: 'flex-start', marginTop: 6, marginLeft: -10 }}
              />
            ) : null}
          </Card>
        ))
      )}

      <AddReviewSheet visible={modal} onClose={() => setModal(false)} clinicId={clinicId} clinicName={clinicName} onSubmitted={load} />
      {replyTo && vet ? (
        <ReplySheet review={replyTo} name={`${vetDisplayName(vet)} · ${vet.clinic_name}`} onClose={() => setReplyTo(null)} onSaved={load} />
      ) : null}
      {menu ? (
        <ContentMenu
          visible
          onClose={() => setMenu(null)}
          kind="review"
          path={`reviews/${menu.id}`}
          authorUid={menu.author_id || null}
          authorName={menu.author_name}
          isMine={!!uid && menu.author_id === uid}
          onDelete={async () => {
            if (await deleteReview(menu.id)) load();
            else Alert.alert('Silinemedi', 'İnternet bağlantını kontrol edip tekrar dene.');
          }}
          onBlocked={load}
        />
      ) : null}
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
  const [error, setError] = useState<string | null>(null);
  const [rules, setRules] = useState(false);

  useEffect(() => {
    if (visible) getAuthorName().then((n) => setName(n === 'Pati dostu' ? '' : n));
  }, [visible]);

  const submit = async (skipRules = false) => {
    setError(null);
    const problem = checkCommunityText(`${comment}\n${name}`);
    if (problem) {
      setError(problem);
      return;
    }
    if (!skipRules && !(await hasAcceptedRules())) {
      setRules(true);
      return;
    }
    setSaving(true);
    await setAuthorName(name.trim() || 'Pati dostu');
    const ok = await addReview(clinicId, rating, comment);
    setSaving(false);
    if (ok) {
      track('review_added', { clinic_id: clinicId, rating });
      setComment('');
      onClose();
      onSubmitted();
    } else {
      setError('Gönderilemedi. İnternet bağlantını kontrol edip tekrar dene.');
    }
  };

  return (
    <>
      <Sheet visible={visible && !rules} onClose={onClose} title="Deneyimini paylaş">
        <View style={{ paddingHorizontal: 20 }}>
          <Text variant="callout" tone="muted" numberOfLines={1}>
            {clinicName}
          </Text>
          <View style={{ alignItems: 'center', marginVertical: 18 }}>
            <Stars value={rating} size={36} onChange={setRating} />
          </View>
          <Field label="Görünecek adın (isteğe bağlı)" value={name} onChangeText={setName} maxLength={30} placeholder="Pati dostu" />
          <Field
            label="Deneyimin"
            value={comment}
            onChangeText={setComment}
            maxLength={1000}
            multiline
            placeholder="Telefona çıktılar mı, acil kabul ettiler mi, ilgi nasıldı?"
          />
          {error ? (
            <Text variant="callout" tone="danger" style={{ marginBottom: 12 }}>
              {error}
            </Text>
          ) : null}
          <Button title="Gönder" full loading={saving} onPress={() => submit()} />
        </View>
      </Sheet>
      <RulesSheet
        visible={rules}
        onClose={() => setRules(false)}
        onAccept={async () => {
          await acceptRules();
          setRules(false);
          submit(true);
        }}
      />
    </>
  );
}

function ReplySheet({ review, name, onClose, onSaved }: { review: Review; name: string; onClose: () => void; onSaved: () => void }) {
  const [text, setText] = useState(review.vet_reply?.text ?? '');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const problem = checkCommunityText(text);
    if (problem) {
      Alert.alert('Kaydedilemedi', problem);
      return;
    }
    setSaving(true);
    const ok = await replyToReview(review.id, text, name);
    setSaving(false);
    if (!ok) {
      Alert.alert('Kaydedilemedi', 'İnternet bağlantınızı kontrol edip tekrar deneyin.');
      return;
    }
    track('review_reply', { clinic_id: review.clinic_id });
    onClose();
    onSaved();
  };
  return (
    <Sheet visible onClose={onClose} title="Yoruma yanıt">
      <View style={{ paddingHorizontal: 20 }}>
        <Card tone="alt" style={{ marginBottom: 14 }}>
          <Text variant="caption" tone="muted">
            {review.author_name}
          </Text>
          <Text variant="callout" numberOfLines={4} style={{ marginTop: 2 }}>
            {review.comment || 'Yorumsuz puan'}
          </Text>
        </Card>
        <Field
          label="Yanıtınız herkese açık görünür"
          value={text}
          onChangeText={setText}
          maxLength={1000}
          multiline
          placeholder="Teşekkür edebilir, yaşanan durumu nazikçe açıklayabilirsiniz."
        />
        <Button title="Yanıtı yayınla" full loading={saving} onPress={save} />
      </View>
    </Sheet>
  );
}
