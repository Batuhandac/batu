import { Platform } from 'react-native';

const RAW_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');

export function getServerApiUrl(path: string): string | null {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (Platform.OS === 'web') return normalizedPath;
  if (!API_BASE_URL) return null;

  return `${API_BASE_URL}${normalizedPath}`;
}

export async function postServerApi<T>(
  path: string,
  body: unknown,
): Promise<{ ok: true; data: T } | { ok: false; status?: number; reason: 'not_configured' | 'http' | 'network' }> {
  const url = getServerApiUrl(path);
  if (!url) return { ok: false, reason: 'not_configured' };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) return { ok: false, reason: 'http', status: res.status };

    return { ok: true, data: await res.json() as T };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
