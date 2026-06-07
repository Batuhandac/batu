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
