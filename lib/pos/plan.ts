// Klinik paketi: erken erişim ve kurucu klinik. Ödeme sunucusu belirler ve saklar
// (server/odeme/src/plan.js, POST /plan); tarihler orada da aynı.
//
// Erken erişim boyunca (EARLY_UNTIL dahil) tahsilat ve e-belge dahil her şey ücretsiz.
// Bu dönemde panele giren ilk FOUNDER_LIMIT klinik kurucu klinik olur; ücretli paket
// geldiğinde fiyatları PRICE_LOCK_UNTIL'e kadar sabit kalır. Hasta takibi hep ücretsiz.
import { callPay } from './sales';
import { daysUntil, todayISO } from '@/lib/utils/dates';

export const EARLY_UNTIL = '2027-03-31';
export const PRICE_LOCK_UNTIL = '2029-03-31';
export const FOUNDER_LIMIT = 50;

/**
 * Ücretli özellik kilidi. Abonelikle ödeme açılana kadar kapalı: erken erişim bitse de
 * hiçbir şey kilitlenmez. Açılınca tahsilat ve e-belge yalnızca erken erişimde ya da
 * "pro" pakette çalışır.
 */
export const PAYWALL_ON = false;

export interface ClinicPlan {
  plan: 'early' | 'free' | 'pro';
  founder: boolean;
  founder_no: number | null;
  early_until: string | null;
  price_locked_until: string | null;
}

/** Sunucuya ulaşılamazsa takvime göre (kurucu bilgisi olmadan). */
export function fallbackPlan(today = todayISO()): ClinicPlan {
  const early = today <= EARLY_UNTIL;
  return { plan: early ? 'early' : 'free', founder: false, founder_no: null, early_until: early ? EARLY_UNTIL : null, price_locked_until: null };
}

const cache = new Map<string, Promise<ClinicPlan>>();

/** Kliniğin paketi; ilk soruşta sunucu oluşturur (kurucu klinik sırası dahil). */
export function loadPlan(clinicId: string): Promise<ClinicPlan> {
  let p = cache.get(clinicId);
  if (!p) {
    p = callPay('/plan', { clinicId }).then((r) => {
      if (!r || !r.ok) {
        cache.delete(clinicId);
        return fallbackPlan();
      }
      const d = r.data;
      return {
        plan: d.plan === 'early' || d.plan === 'pro' ? d.plan : 'free',
        founder: d.founder === true,
        founder_no: typeof d.founder_no === 'number' ? d.founder_no : null,
        early_until: typeof d.early_until === 'string' ? d.early_until : null,
        price_locked_until: typeof d.price_locked_until === 'string' ? d.price_locked_until : null,
      };
    });
    cache.set(clinicId, p);
  }
  return p;
}

/** Erken erişimin kalan günü (son gün 0); erken erişimde değilse null. */
export function earlyDaysLeft(plan: ClinicPlan, today = todayISO()): number | null {
  if (plan.plan !== 'early' || !plan.early_until || today > plan.early_until) return null;
  return daysUntil(plan.early_until, today);
}

/** Tahsilat ve e-belge açık mı (kilit kapalıyken hep açık). */
export function proAccess(plan: ClinicPlan, today = todayISO()): boolean {
  return !PAYWALL_ON || plan.plan === 'pro' || earlyDaysLeft(plan, today) != null;
}
