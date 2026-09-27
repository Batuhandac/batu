import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/stores/session';
import { fetchQuestions, fetchMyQuestions, unreadAnswerCounts, type Question } from '@/lib/data/qa';
import { subscribeMyConversations, subscribeClinicConversations } from '@/lib/data/messages';
import { getBlockedUsers } from '@/lib/data/safety';

let latestCache: Question[] | null = null;

/** Ana sayfadaki "Topluluktan" önizlemesi. */
export function useLatestQuestions(n = 3) {
  const [items, setItems] = useState<Question[]>(latestCache ?? []);
  const reload = useCallback(async () => {
    const res = await fetchQuestions(null, 12);
    if (!res) return;
    const blocked = await getBlockedUsers();
    latestCache = res.items.filter((q) => !blocked.has(q.author_uid));
    setItems(latestCache);
  }, []);
  return { items: items.slice(0, n), reload };
}

/** Kullanıcının soruları ve son bakışından beri gelen yanıt sayıları. */
export function useMyQuestions() {
  const uid = useSession((s) => s.uid);
  const [mine, setMine] = useState<Question[]>([]);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const reload = useCallback(async () => {
    if (!uid) return;
    const list = await fetchMyQuestions(uid);
    setMine(list);
    setUnread(await unreadAnswerCounts(list));
  }, [uid]);
  useEffect(() => {
    reload();
  }, [reload]);
  const total = Object.values(unread).reduce((a, b) => a + b, 0);
  return { mine, unread, total, reload };
}

/** Okunmamış mesaj sayısı (hekimse kliniğin gelen kutusu). */
export function useUnreadMessages(): number {
  const uid = useSession((s) => s.uid);
  const vet = useSession((s) => s.vet);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!uid) {
      setCount(0);
      return;
    }
    if (vet) {
      return subscribeClinicConversations(vet.clinic_id, (list) => setCount(list.reduce((a, c) => a + (c.vet_unread > 0 ? 1 : 0), 0)));
    }
    return subscribeMyConversations(uid, (list) => setCount(list.reduce((a, c) => a + (c.user_unread > 0 ? 1 : 0), 0)));
  }, [uid, vet]);
  return count;
}
