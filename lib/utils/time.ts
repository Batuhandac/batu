export function formatVerifiedAt(iso: string | null): string {
  if (!iso) return 'Hiç doğrulanmadı';
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return 'Az önce doğrulandı';
  if (diffMin < 60) return `${diffMin} dk önce doğrulandı`;
  if (diffH < 24) return `${diffH} sa önce doğrulandı`;
  return `${diffD} gün önce doğrulandı`;
}

export function isStale(iso: string | null): boolean {
  if (!iso) return true;
  return Date.now() - new Date(iso).getTime() > 7 * 24 * 60 * 60 * 1000;
}

/** "az önce", "5 dk önce", "3 sa önce", "2 gün önce", sonra tarih. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'az önce';
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

/** Mesaj listesi için kısa saat/tarih: bugünse 14:05, değilse 12 Eyl. */
export function shortTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}
