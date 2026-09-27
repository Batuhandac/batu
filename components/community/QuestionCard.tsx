import React from 'react';
import { View, Image } from 'react-native';
import { router } from 'expo-router';
import { Text, Icon, Card, Badge } from '@/components/ds';
import { useTheme, radius } from '@/lib/theme';
import { TOPICS, type Question } from '@/lib/data/qa';
import { timeAgo } from '@/lib/utils/time';

const SPECIES: Record<string, string> = { dog: 'Köpek', cat: 'Kedi', other: 'Diğer' };

export function QuestionCard({ q, compact, unread = 0 }: { q: Question; compact?: boolean; unread?: number }) {
  const t = useTheme();
  const topic = TOPICS.find((x) => x.key === q.topic) ?? TOPICS[TOPICS.length - 1];
  return (
    <Card onPress={() => router.push(`/community/${q.id}`)} accessibilityLabel={q.title} style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text variant="caption" tone="muted" style={{ flex: 1 }} numberOfLines={1}>
          {topic.label} · {SPECIES[q.species] ?? 'Diğer'}
        </Text>
        {unread > 0 ? (
          <Text variant="caption" tone="sos" style={{ fontWeight: '600' }}>
            {unread} yeni yanıt
          </Text>
        ) : (
          <Text variant="caption" tone="subtle">
            {timeAgo(q.created_at)}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={compact ? 2 : 3}>
            {q.title}
          </Text>
          {!compact && q.body ? (
            <Text variant="callout" tone="muted" numberOfLines={2} style={{ marginTop: 4 }}>
              {q.body}
            </Text>
          ) : null}
        </View>
        {q.photo_url ? (
          <Image source={{ uri: q.photo_url }} style={{ width: 64, height: 64, borderRadius: radius.sm, backgroundColor: t.surfaceAlt }} />
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <Text variant="caption" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
          {q.author_name}
        </Text>
        <View style={{ flex: 1 }} />
        {q.has_vet_answer ? <Badge label="Hekim yanıtladı" tone="primary" icon="checkmark-circle" /> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="chatbubble-outline" size={14} color={t.textSubtle} />
          <Text variant="caption" tone="subtle">
            {q.answer_count}
          </Text>
        </View>
      </View>
    </Card>
  );
}
