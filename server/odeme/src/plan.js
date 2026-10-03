// Klinik paketi: erken erişim ve kurucu klinik sırası.
//
// Erken erişim boyunca (EARLY_UNTIL dahil) tahsilat ve e-belge dahil her şey ücretsiz.
// Bu dönemde panele giren ilk FOUNDER_LIMIT klinik "kurucu klinik" olur; ücretli paket
// geldiğinde fiyatları PRICE_LOCK_UNTIL'e kadar sabit kalır. Sıra numarası sunucuda,
// tek seferde (sayaçla birlikte) yazılır; klinik kendisi yazamaz.
//
// clinic_plans/{clinicId}: plan ('early' | 'free' | 'pro'), founder, founder_no,
//   early_until, price_locked_until, created_at, created_by. Yönetici Console'dan
//   değiştirebilir (ör. plan: 'pro').
// plan_meta/founders: count
import { commitAll, createWrite, getDoc, PreconditionFailed, updateWrite } from './firebase.js';
import { istanbulDate } from './util.js';

export const EARLY_UNTIL = '2027-03-31';
export const PRICE_LOCK_UNTIL = '2029-03-31';
export const FOUNDER_LIMIT = 50;

/** Erken erişim verilen günde (İstanbul, YYYY-AA-GG) sürüyor mu. */
export function earlyAccessOpen(today = istanbulDate()) {
  return today <= EARLY_UNTIL;
}

function view(data) {
  return {
    plan: data.plan || 'free',
    founder: data.founder === true,
    founder_no: typeof data.founder_no === 'number' ? data.founder_no : null,
    early_until: data.early_until || null,
    price_locked_until: data.price_locked_until || null,
  };
}

/**
 * Kliniğin paketini döner; ilk kez soruluyorsa oluşturur. Erken erişimde ve yer varsa
 * kurucu klinik sırası verilir. Aynı anda gelen istekler sayacı ön koşulla korur.
 */
export async function ensurePlan(env, clinicId, uid, { tries = 4 } = {}) {
  // PLAN_TODAY yalnızca testte: erken erişim bittikten sonrasını denemek için
  const today = env.PLAN_TODAY || istanbulDate();
  const path = `clinic_plans/${clinicId}`;
  for (let i = 0; i < tries; i++) {
    const existing = await getDoc(env, path);
    if (existing) return view(existing.data);

    const early = earlyAccessOpen(today);
    const base = { plan: early ? 'early' : 'free', early_until: early ? EARLY_UNTIL : null, created_by: uid };
    try {
      if (!early) {
        await commitAll(env, [createWrite(env, path, { ...base, founder: false }, { serverTime: ['created_at'] })]);
        continue;
      }
      const meta = await getDoc(env, 'plan_meta/founders');
      const count = meta && typeof meta.data.count === 'number' ? meta.data.count : 0;
      if (count >= FOUNDER_LIMIT) {
        await commitAll(env, [createWrite(env, path, { ...base, founder: false }, { serverTime: ['created_at'] })]);
        continue;
      }
      const no = count + 1;
      await commitAll(env, [
        updateWrite(env, 'plan_meta/founders', { count: no }, { serverTime: ['updated_at'], precondition: meta ? { updateTime: meta.updateTime } : { exists: false } }),
        createWrite(env, path, { ...base, founder: true, founder_no: no, price_locked_until: PRICE_LOCK_UNTIL }, { serverTime: ['created_at'] }),
      ]);
    } catch (e) {
      // Sayaç başka bir klinik için ilerledi ya da bu kliniğin paketi aynı anda oluştu: yeniden oku
      if (!(e instanceof PreconditionFailed)) throw e;
    }
  }
  const last = await getDoc(env, path);
  if (last) return view(last.data);
  throw new Error('plan');
}
