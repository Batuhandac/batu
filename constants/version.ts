export const APP_VERSION = process.env.EXPO_PUBLIC_APP_VERSION ?? 'dev';
export const BUILD_TIME = process.env.EXPO_PUBLIC_BUILD_TIME ?? 'local';

export function versionLabel(): string {
  if (APP_VERSION === 'dev') return 'dev';
  const shortSha = APP_VERSION.slice(0, 7);
  if (BUILD_TIME === 'local') return shortSha;
  try {
    const d = new Date(Number(BUILD_TIME) * 1000);
    const hh = d.getUTCHours().toString().padStart(2, '0');
    const mm = d.getUTCMinutes().toString().padStart(2, '0');
    const dd = d.getUTCDate().toString().padStart(2, '0');
    const mo = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    return `${shortSha} · ${dd}.${mo} ${hh}:${mm}`;
  } catch {
    return shortSha;
  }
}
