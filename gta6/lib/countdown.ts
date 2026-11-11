import { RELEASE_DATE_ISO } from '@/constants/theme';

export interface Countdown { total: number; days: number; hours: number; minutes: number; seconds: number; released: boolean }

export function countdownTo(target: string = RELEASE_DATE_ISO, now: number = Date.now()): Countdown {
  const total = new Date(target).getTime() - now;
  if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, released: true };
  const s = Math.floor(total / 1000);
  return {
    total,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    released: false,
  };
}
