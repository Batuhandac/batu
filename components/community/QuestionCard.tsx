import React from 'react';
import { View, Image } from 'react-native';
import { router } from 'expo-router';
import { Text, Icon, Card, Avatar } from '@/components/ds';
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
        <Icon name={topic.icon} size={14} color={t.primary} />
        <Text variant="caption" tone="primary" style={{ fontSize: 12.5 }}>
          {topic.label}
        </Text>
        <Text variant="caption" tone="subtle" style={{ fontSize: 12.5 }}>
          · {SPECIES[q.species] ?? 'Diğer'}
        </Text>
        <View style={{ flex: 1 }} />
        {unread > 0 ? (
          <View style={{ backgroundColor: t.sos, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text variant="caption" color={t.onSos} style={{ fontSize: 11.5 }}>
              {unread} yeni yanıt
            </Text>
          </View>
        ) : (
          <Text variant="caption" tone="subtle" style={{ fontSize: 12.5 }}>
            {timeAgo(q.created_at)}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
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

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <Avatar label={q.author_name} size={22} />
        <Text variant="caption" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
          {q.author_name}
        </Text>
        <View style={{ flex: 1 }} />
        {q.has_vet_answer ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.primarySoft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Icon name="checkmark-circle" size={13} color={t.primary} />
            <Text variant="caption" tone="primary" style={{ fontSize: 11.5 }}>
              Hekim yanıtladı
            </Text>
          </View>
        ) : null}
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
