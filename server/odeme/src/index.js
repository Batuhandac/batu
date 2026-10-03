// Patiport ödeme sunucusu (Cloudflare Worker): hekim panelinden tahsilat ve e-belge.
//
// Tahsilat akışı:
//  1. Panel satış belgesini yazar: clinic_pos/{clinicId}/sales/{saleId}, status "pending",
//     mode "iyzico" (kliniğin kendi iyzico hesabı) ya da "iyzico_test" (Patiport'un deneme
//     hesabı).
//  2. Panel POST /start çağırır. Sunucu hekimi doğrular, tutarı belgeden okur (istekten
//     değil), doğru hesabın anahtarlarıyla iyzico ödeme formunu başlatır ve sayfa adresini
//     belgeye yazar.
//  3. Hasta sahibi QR'ı okutup kartla öder (3D Secure dahil); para kliniğin kendi iyzico
//     hesabına geçer.
//  4. iyzico tarayıcıyı POST /callback?c=…&s=…'ye yollar (form: token). Sunucu token'ın o
//     satışa ait olduğunu kontrol eder, sonucu iyzico'ya kendisi sorar ve belgeye yazar.
//  5. Dönüş kaçarsa panel POST /check ile yeniden sordurur.
//  6. Klinik Paraşüt'ü bağladıysa ve "kendiliğinden kes" açıksa e-SMM ya da e-Arşiv kesilir
//     (POST /edoc/issue elle de çağrılabilir; nakit tahsilatlar için de).
//
// Hesap bağlama: POST /connect/iyzico (anahtarlar denenir, şifreli kasaya yazılır),
// POST /connect/parasut/begin + GET /connect/parasut/callback (Paraşüt'te oturum açılır,
// şifre bize gelmez), POST /disconnect.
//
// Anahtarlar tarayıcıya hiç gitmez. Firestore'a hizmet hesabıyla yazılır; bu yazımlar
// güvenlik kurallarına takılmaz, bu yüzden her uçta sahiplik ayrıca kontrol edilir.
//
// Ortam değişkenleri:
//   IYZICO_API_KEY, IYZICO_SECRET_KEY   secret; Patiport'un iyzico deneme hesabı
//   IYZICO_BASE_URL                     deneme hesabının adresi (sandbox)
//   FIREBASE_SERVICE_ACCOUNT            secret; Firebase hizmet hesabı JSON'u
//   PAY_ENC_KEY                         secret; şifreli kasa anahtarı (yayında ilk kez üretilir)
//   PARASUT_CLIENT_ID, _SECRET          secret; Patiport'un Paraşüt uygulama kimliği (isteğe bağlı)
//   FIREBASE_PROJECT_ID, ALLOWED_ORIGINS
//   Yalnızca testte: FIRESTORE_URL, AUTH_URL, DEV_BEARER, JWKS_URL, IYZICO_CLINIC_URL,
//                    PARASUT_URL, PARASUT_POLL_MS
import { corsHeaders, defer, istanbulDate, json, page, randomId, redirect, safeReturnUrl, str } from './util.js';
import { createDoc, deleteDoc, getDoc, PreconditionFailed, updateDoc, verifyIdToken } from './firebase.js';
import { open, seal, vaultReady } from './vault.js';
import { clinicCreds, demoCreds, envOfKey, formatPrice, initializeCheckout, retrieveCheckout, validateKeys } from './iyzico.js';
import { authorizeUrl, companies, documentPdf, exchangeCode, issueDocument, ParasutError, parasutConfigured, refreshTokens } from './parasut.js';

export { formatPrice, iyzicoAuth } from './iyzico.js';
export { signJwt, verifyIdToken } from './firebase.js';
export { seal, open } from './vault.js';
export { netOfVat } from './parasut.js';

const ONLINE_MODES = ['iyzico', 'iyzico_test'];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const route = `${request.method} ${url.pathname}`;
    try {
      switch (route) {
        case 'POST /start':
          return await start(request, env, url, cors);
        case 'POST /callback':
          return await callback(request, env, url, ctx);
        case 'POST /check':
          return await check(request, env, cors, ctx);
        case 'POST /connect/iyzico':
          return await connectIyzico(request, env, cors);
        case 'POST /disconnect':
          return await disconnect(request, env, cors);
        case 'POST /connect/parasut/begin':
          return await parasutBegin(request, env, url, cors);
        case 'GET /connect/parasut/callback':
          return await parasutCallback(env, url);
        case 'POST /edoc/issue':
          return await edocIssue(request, env, cors);
        case 'POST /edoc/pdf':
          return await edocPdf(request, env, cors);
        case 'GET /health':
          return json(
            {
              ok: true,
              sandbox: (env.IYZICO_BASE_URL || '').includes('sandbox'),
              configured: Boolean(env.IYZICO_API_KEY && env.IYZICO_SECRET_KEY && env.FIREBASE_SERVICE_ACCOUNT),
              vault: vaultReady(env),
              parasut: parasutConfigured(env),
            },
            200,
            cors
          );
        default:
          return json({ error: 'not_found' }, 404, cors);
      }
    } catch (e) {
      console.error('odeme', e && e.stack ? e.stack : String(e));
      // Ödeyen kişi ham hata değil, sade bir sayfa görsün
      if (url.pathname === '/callback') return page(false, 'Sonuç kaydedilemedi. Ödemeniz alındıysa klinik panelinde görünecektir.');
      if (url.pathname === '/connect/parasut/callback') return page(false, 'Paraşüt bağlantısı tamamlanamadı. Panelden yeniden deneyin.', 'Paraşüt bağlanamadı');
      return json({ error: 'server_error' }, 500, cors);
    }
  },
};

// ─── Hekim isteği ────────────────────────────────────────────────────────────

/** Hekimi doğrular; klinik (ve istenirse satış) kimliğini döner ya da hata yanıtı. */
async function authVet(request, env, cors, { needSale = false } = {}) {
  const idToken = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!idToken) return { res: json({ error: 'auth' }, 401, cors) };
  let body;
  try {
    body = await request.json();
  } catch {
    return { res: json({ error: 'bad_request' }, 400, cors) };
  }
  const clinicId = str(body.clinicId, 1, 200);
  const saleId = needSale ? str(body.saleId, 1, 100) : null;
  if (!clinicId || (needSale && !saleId) || /[/]/.test(clinicId + (saleId || ''))) return { res: json({ error: 'bad_request' }, 400, cors) };

  const uid = await verifyIdToken(env, idToken);
  if (!uid) return { res: json({ error: 'auth' }, 401, cors) };
  const vet = await getDoc(env, `vets/${uid}`);
  if (!vet || vet.data.clinic_id !== clinicId) return { res: json({ error: 'forbidden' }, 403, cors) };
  return { uid, vet, clinicId, saleId, body };
}

// ─── Kliniğin iyzico hesabı ──────────────────────────────────────────────────

async function clinicIyzico(env, clinicId) {
  if (!vaultReady(env)) return null;
  const sec = await getDoc(env, `clinic_secrets/${clinicId}`);
  if (!sec || !sec.data.iyzico) return null;
  const k = await open(env, sec.data.iyzico, `${clinicId}:iyzico`);
  return clinicCreds(env, k.apiKey, k.secretKey);
}

/** Satışın hangi hesapla yürüyeceği: kliniğin kendi hesabı ya da Patiport'un deneme hesabı. */
async function credsForSale(env, clinicId, sale) {
  return sale.data.mode === 'iyzico' ? clinicIyzico(env, clinicId) : demoCreds(env);
}

async function connectIyzico(request, env, cors) {
  const v = await authVet(request, env, cors);
  if (v.res) return v.res;
  if (!vaultReady(env)) return json({ error: 'vault' }, 503, cors);
  const apiKey = str(typeof v.body.apiKey === 'string' ? v.body.apiKey.trim() : null, 8, 200);
  const secretKey = str(typeof v.body.secretKey === 'string' ? v.body.secretKey.trim() : null, 8, 200);
  if (!apiKey || !secretKey || /\s/.test(apiKey + secretKey)) return json({ error: 'bad_request' }, 400, cors);

  const checked = await validateKeys(clinicCreds(env, apiKey, secretKey));
  if (!checked.ok) return json({ error: 'invalid_keys', message: checked.message }, 400, cors);

  await updateDoc(env, `clinic_secrets/${v.clinicId}`, { iyzico: await seal(env, { apiKey, secretKey }, `${v.clinicId}:iyzico`) });
  const info = { env: envOfKey(apiKey), key_hint: apiKey.slice(-4), connected_ms: Date.now(), connected_by: v.uid };
  await updateDoc(env, `clinic_pay/${v.clinicId}`, { iyzico: info });
  return json({ ok: true, ...info }, 200, cors);
}

async function disconnect(request, env, cors) {
  const v = await authVet(request, env, cors);
  if (v.res) return v.res;
  const provider = v.body.provider;
  if (provider !== 'iyzico' && provider !== 'parasut') return json({ error: 'bad_request' }, 400, cors);
  // Değeri undefined olan alan silinir
  await updateDoc(env, `clinic_secrets/${v.clinicId}`, { [provider]: undefined });
  await updateDoc(env, `clinic_pay/${v.clinicId}`, { [provider]: undefined });
  return json({ ok: true }, 200, cors);
}

// ─── Kartla tahsilat ─────────────────────────────────────────────────────────

async function start(request, env, url, cors) {
  const v = await authVet(request, env, cors, { needSale: true });
  if (v.res) return v.res;
  const { uid, vet, clinicId, saleId } = v;

  const salePath = `clinic_pos/${clinicId}/sales/${saleId}`;
  const sale = await getDoc(env, salePath);
  if (!sale) return json({ error: 'not_found' }, 404, cors);
  const s = sale.data;
  if (s.created_by !== uid || !ONLINE_MODES.includes(s.mode)) return json({ error: 'forbidden' }, 403, cors);
  if (s.status !== 'pending') return json({ error: 'not_pending' }, 409, cors);
  if (s.pay_url) return json({ url: s.pay_url }, 200, cors); // aynı satış için ikinci çağrı

  const creds = await credsForSale(env, clinicId, sale);
  if (!creds) return json({ error: 'not_connected' }, 409, cors);

  const kurus = Number(s.amount_kurus);
  if (!Number.isInteger(kurus) || kurus < 100) return json({ error: 'bad_amount' }, 400, cors);
  const price = formatPrice(kurus);
  const place = vet.data.clinic_name || 'Veteriner kliniği';

  const req = {
    locale: 'tr',
    conversationId: saleId,
    price,
    basketId: clinicId,
    paymentGroup: 'PRODUCT',
    buyer: {
      id: `patiport-${uid.slice(0, 20)}`,
      name: 'Hasta',
      surname: 'Sahibi',
      // Kimlik ve iletişim bilgisi toplamıyoruz; iyzico alanları zorunlu tuttuğu için
      // nihai tüketici yer tutucuları gönderilir.
      identityNumber: '11111111111',
      email: 'odeme@example.com',
      gsmNumber: '+905000000000',
      registrationAddress: place,
      city: 'Türkiye',
      country: 'Turkey',
      ip: request.headers.get('CF-Connecting-IP') || '85.34.78.112',
    },
    billingAddress: { contactName: 'Hasta Sahibi', city: 'Türkiye', country: 'Turkey', address: place },
    basketItems: [{ id: saleId, name: (s.description || 'Veteriner hizmeti').slice(0, 120), category1: 'Veteriner hizmeti', itemType: 'VIRTUAL', price }],
    // Satış dönüş adresinden bulunur (iyzico'nun sorgu yanıtındaki conversationId o
    // sorgunun kendi değerini yansıtır, başlatmadakini değil)
    callbackUrl: `${url.origin}/callback?c=${encodeURIComponent(clinicId)}&s=${encodeURIComponent(saleId)}`,
    currency: 'TRY',
    paidPrice: price,
    enabledInstallments: [1],
  };

  const r = await initializeCheckout(creds, req);
  if (r.status !== 'success' || !r.token || !r.paymentPageUrl) {
    console.error('iyzico initialize', r.errorCode, r.errorMessage);
    return json({ error: 'iyzico', message: r.errorMessage || null }, 502, cors);
  }
  const expiresMs = Date.now() + (Number(r.tokenExpireTime) || 1800) * 1000;
  await updateDoc(
    env,
    salePath,
    { pay_token: r.token, pay_url: r.paymentPageUrl, pay_expires_ms: expiresMs, pay_env: s.mode === 'iyzico' ? envOfKey(creds.apiKey) : 'sandbox' },
    { precondition: { updateTime: sale.updateTime } }
  );
  return json({ url: r.paymentPageUrl, expires_ms: expiresMs }, 200, cors);
}

/**
 * iyzico sonucunu satış belgesine işler. final: iyzico formun bittiğini bildirdi
 * (geri dönüş); yalnızca o zaman başarısız sonuç "olmadı" olarak yazılır.
 */
async function settle(env, salePath, sale, r, final) {
  const s = sale.data;
  const amountOk = Math.round(Number(r.price) * 100) === Number(s.amount_kurus);
  const ok = r.status === 'success' && r.paymentStatus === 'SUCCESS' && amountOk;

  if (s.status === 'approved') return { status: 'approved', message: 'Ödeme daha önce alınmış.' };
  if (!ok && (!final || s.status !== 'pending')) {
    return { status: s.status, message: s.status === 'pending' ? 'Ödeme henüz tamamlanmadı.' : 'Bu ödeme iptal edilmiş.' };
  }
  // Hekim iptal etmiş olsa bile para çekildiyse kayıt "alındı" olmalı
  const fields = ok
    ? {
        status: 'approved',
        resolved_by: 'iyzico',
        card_last4: str(r.lastFourDigits, 4, 4),
        card_brand: str(r.cardAssociation, 1, 40),
        auth_code: str(r.authCode, 1, 40),
        payment_id: str(String(r.paymentId ?? ''), 1, 60),
        fail_reason: null,
      }
    : {
        status: 'declined',
        resolved_by: 'iyzico',
        fail_reason: str(r.errorMessage, 1, 200) || (amountOk ? 'Ödeme tamamlanmadı' : 'Tutar uyuşmadı'),
      };
  await updateDoc(env, salePath, fields, { serverTime: ['resolved_at'], precondition: { updateTime: sale.updateTime } });
  return ok ? { status: 'approved', message: 'Ödemeniz alındı. Bu sayfayı kapatabilirsiniz.' } : { status: 'declined', message: fields.fail_reason };
}

async function callback(request, env, url, ctx) {
  const form = await request.formData().catch(() => null);
  const token = form && typeof form.get('token') === 'string' ? form.get('token') : '';
  if (!token || token.length > 200) return page(false, 'Ödeme bilgisi alınamadı.');

  let clinicId = str(url.searchParams.get('c'), 1, 200);
  let saleId = str(url.searchParams.get('s'), 1, 100);
  let r = null;
  if (!clinicId || !saleId) {
    // Eski biçimli dönüş adresi (yalnızca deneme hesabıyla açılmış ödemeler)
    r = await retrieveCheckout(demoCreds(env), token);
    clinicId = str(r.basketId, 1, 200);
    saleId = str(r.itemTransactions && r.itemTransactions[0] && r.itemTransactions[0].itemId, 1, 100);
  }
  if (!clinicId || !saleId || /[/]/.test(clinicId + saleId)) return page(false, 'Ödeme bulunamadı.');

  const salePath = `clinic_pos/${clinicId}/sales/${saleId}`;
  const sale = await getDoc(env, salePath);
  // Token bu satışa ait değilse (başka ödemenin token'ı ya da uydurma) hiçbir şey yazılmaz
  if (!sale || sale.data.pay_token !== token) return page(false, 'Ödeme bulunamadı.');

  // Sonucu tarayıcıdan gelen veriye değil, iyzico'ya kendimiz sorarak öğreniriz
  if (!r || sale.data.mode === 'iyzico') {
    const creds = await credsForSale(env, clinicId, sale);
    if (!creds) return page(false, 'Klinik ödeme hesabı bağlı değil. Ödemeniz alındıysa klinik panelinde görünecektir.');
    r = await retrieveCheckout(creds, token, saleId);
  }
  const out = await settle(env, salePath, sale, r, true);
  if (out.status === 'approved') await defer(ctx, issueEdoc(env, clinicId, saleId, { onlyIfAuto: true }));
  return page(out.status === 'approved', out.message);
}

async function check(request, env, cors, ctx) {
  const v = await authVet(request, env, cors, { needSale: true });
  if (v.res) return v.res;
  const salePath = `clinic_pos/${v.clinicId}/sales/${v.saleId}`;
  const sale = await getDoc(env, salePath);
  if (!sale) return json({ error: 'not_found' }, 404, cors);
  if (!ONLINE_MODES.includes(sale.data.mode)) return json({ error: 'forbidden' }, 403, cors);
  if (sale.data.status === 'approved' || !sale.data.pay_token) return json({ status: sale.data.status }, 200, cors);
  const creds = await credsForSale(env, v.clinicId, sale);
  if (!creds) return json({ error: 'not_connected' }, 409, cors);
  const r = await retrieveCheckout(creds, sale.data.pay_token, v.saleId);
  const out = await settle(env, salePath, sale, r, false);
  if (out.status === 'approved') await defer(ctx, issueEdoc(env, v.clinicId, v.saleId, { onlyIfAuto: true }));
  return json(out, 200, cors);
}

// ─── Paraşüt bağlantısı ──────────────────────────────────────────────────────

const callbackUri = (url) => `${url.origin}/connect/parasut/callback`;

function withQuery(base, params) {
  const u = new URL(base);
  for (const [k, val] of Object.entries(params)) u.searchParams.set(k, val);
  return u.toString();
}

async function parasutBegin(request, env, url, cors) {
  const v = await authVet(request, env, cors);
  if (v.res) return v.res;
  if (!parasutConfigured(env)) return json({ error: 'parasut_not_configured' }, 503, cors);
  if (!vaultReady(env)) return json({ error: 'vault' }, 503, cors);
  const state = randomId(24);
  await createDoc(env, `oauth_states/${state}`, {
    provider: 'parasut',
    clinic_id: v.clinicId,
    uid: v.uid,
    exp_ms: Date.now() + 10 * 60 * 1000,
    return_url: safeReturnUrl(env, v.body.returnUrl),
  });
  return json({ url: authorizeUrl(env, callbackUri(url), state) }, 200, cors);
}

async function parasutCallback(env, url) {
  const state = str(url.searchParams.get('state'), 10, 100);
  const st = state ? await getDoc(env, `oauth_states/${state}`) : null;
  if (!st || st.data.provider !== 'parasut') return page(false, 'Bu bağlantı isteği bulunamadı ya da kullanılmış. Panelden yeniden deneyin.', 'Paraşüt bağlanamadı');
  await deleteDoc(env, `oauth_states/${state}`); // tek kullanımlık
  const back = st.data.return_url;
  const fail = (msg) => (back ? redirect(withQuery(back, { parasut: 'error', reason: msg })) : page(false, msg, 'Paraşüt bağlanamadı'));
  if (!(st.data.exp_ms > Date.now())) return fail('Süre doldu, yeniden deneyin.');
  const code = str(url.searchParams.get('code'), 1, 1000);
  if (url.searchParams.get('error') || !code) return fail('Paraşüt izni verilmedi.');

  const clinicId = st.data.clinic_id;
  const vet = await getDoc(env, `vets/${st.data.uid}`);
  if (!vet || vet.data.clinic_id !== clinicId) return fail('Bu klinik adına bağlama yetkiniz görünmüyor.');

  let tokens, list;
  try {
    tokens = await exchangeCode(env, code, callbackUri(url));
    list = await companies(env, tokens.access_token);
  } catch (e) {
    return fail(e instanceof ParasutError ? e.message : 'Paraşüt ile bağlantı kurulamadı.');
  }
  if (!list.length) return fail('Paraşüt hesabınızda firma bulunamadı.');
  const company = list[0];
  await updateDoc(env, `clinic_secrets/${clinicId}`, { parasut: await seal(env, { ...tokens, company_id: company.id }, `${clinicId}:parasut`) });
  await updateDoc(env, `clinic_pay/${clinicId}`, {
    parasut: { company_id: company.id, company_name: company.name, companies: list.length, connected_ms: Date.now(), connected_by: st.data.uid, status: 'ok' },
  });
  return back ? redirect(withQuery(back, { parasut: 'ok' })) : page(true, 'Paraşüt bağlandı. Bu sayfayı kapatabilirsiniz.', 'Paraşüt bağlandı');
}

/** Geçerli Paraşüt erişim belirteci; süresi dolduysa yeniler ve yenisini saklar. */
async function parasutAccess(env, clinicId) {
  const path = `clinic_secrets/${clinicId}`;
  const aad = `${clinicId}:parasut`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const sec = await getDoc(env, path);
    if (!sec || !sec.data.parasut) throw new ParasutError('Paraşüt bağlı değil.', 409);
    const t = await open(env, sec.data.parasut, aad);
    if (t.access_token && t.access_exp_ms > Date.now() + 120_000) return t;
    let fresh;
    try {
      fresh = await refreshTokens(env, t.refresh_token);
    } catch (e) {
      if (!(e instanceof ParasutError) || !e.reauth) throw e;
      // Başka bir istek az önce yenilemiş olabilir (yenileme belirteci her seferinde değişir)
      const again = await getDoc(env, path);
      if (again && again.data.parasut !== sec.data.parasut) continue;
      const payDoc = await getDoc(env, `clinic_pay/${clinicId}`).catch(() => null);
      if (payDoc && payDoc.data.parasut) await updateDoc(env, `clinic_pay/${clinicId}`, { parasut: { ...payDoc.data.parasut, status: 'reauth' } }).catch(() => {});
      throw new ParasutError('Paraşüt oturumu sona erdi; Ayarlar\'dan yeniden bağlayın.', 401, true);
    }
    const next = { ...t, ...fresh, refresh_token: fresh.refresh_token || t.refresh_token };
    try {
      await updateDoc(env, path, { parasut: await seal(env, next, aad) }, { precondition: { updateTime: sec.updateTime } });
      return next;
    } catch (e) {
      if (!(e instanceof PreconditionFailed)) throw e;
    }
  }
  throw new ParasutError('Paraşüt oturumu yenilenemedi; birazdan yeniden deneyin.', 503);
}

// ─── e-SMM / e-Arşiv ─────────────────────────────────────────────────────────

const VAT_RATES = [0, 1, 10, 20];
const ISSUING_STALE_MS = 3 * 60 * 1000;

/**
 * Onaylı bir tahsilat için e-belge keser. onlyIfAuto: yalnızca klinik "kendiliğinden kes"
 * dediyse. Aynı satış için ikinci kez kesmez.
 */
async function issueEdoc(env, clinicId, saleId, { onlyIfAuto = false } = {}) {
  const salePath = `clinic_pos/${clinicId}/sales/${saleId}`;
  const sale = await getDoc(env, salePath);
  if (!sale) return { error: 'not_found' };
  const s = sale.data;
  if (s.status !== 'approved') return { error: 'not_approved' };
  // Paraşüt'te deneme ortamı yok; kesilen her belge resmîdir. Deneme ödemelerine kesilmez.
  if (!(s.mode === 'cash' || (s.mode === 'iyzico' && s.pay_env === 'live'))) return { error: 'not_real' };
  if (s.edoc_status === 'issued') return { status: 'issued', number: s.edoc_number || null };
  if (s.edoc_status === 'issuing' && Date.now() - Number(s.edoc_started_ms || 0) < ISSUING_STALE_MS) return { status: 'issuing' };

  const settings = (await getDoc(env, `clinic_settings/${clinicId}`))?.data || {};
  if (onlyIfAuto && settings.edoc_auto !== true) return { skipped: true };
  const pay = (await getDoc(env, `clinic_pay/${clinicId}`))?.data || {};
  if (!pay.parasut || !parasutConfigured(env) || !vaultReady(env)) return { error: 'not_connected' };

  try {
    await updateDoc(env, salePath, { edoc_status: 'issuing', edoc_error: null, edoc_started_ms: Date.now() }, { precondition: { updateTime: sale.updateTime } });
  } catch (e) {
    if (e instanceof PreconditionFailed) return { status: 'busy' };
    throw e;
  }

  try {
    const tok = await parasutAccess(env, clinicId);
    let buyerName = null;
    if (s.patient_id) {
      const p = await getDoc(env, `clinic_patients/${clinicId}/patients/${s.patient_id}`).catch(() => null);
      buyerName = str(p && p.data.owner_name, 1, 80);
    }
    const out = await issueDocument(
      env,
      tok.access_token,
      pay.parasut.company_id,
      {
        docType: settings.edoc_type === 'e_archive' ? 'e_archive' : 'e_smm',
        amountKurus: Number(s.amount_kurus),
        vatRate: VAT_RATES.includes(Number(settings.vat_rate)) ? Number(settings.vat_rate) : 20,
        description: s.description || 'Veteriner hizmeti',
        buyerName,
        city: str(settings.edoc_city, 1, 40),
        district: str(settings.edoc_district, 1, 40),
        issueDate: istanbulDate(),
        note: s.patient_name ? `Hasta: ${s.patient_name}` : undefined,
      },
      env.PARASUT_POLL_MS ? { pollMs: Number(env.PARASUT_POLL_MS) } : undefined
    );
    await updateDoc(env, salePath, { edoc_status: 'issued', edoc_type: out.docType, edoc_id: out.docId, edoc_number: out.number, edoc_invoice_id: out.invoiceId, edoc_error: null }, { serverTime: ['edoc_at'] });
    return { status: 'issued', number: out.number };
  } catch (e) {
    const message = String((e && e.message) || e).slice(0, 200);
    await updateDoc(env, salePath, { edoc_status: 'failed', edoc_error: message });
    return { status: 'failed', message };
  }
}

async function edocIssue(request, env, cors) {
  const v = await authVet(request, env, cors, { needSale: true });
  if (v.res) return v.res;
  const out = await issueEdoc(env, v.clinicId, v.saleId, { onlyIfAuto: v.body.onlyIfAuto === true });
  if (out.error === 'not_found') return json(out, 404, cors);
  if (out.error) return json(out, 409, cors);
  return json(out, 200, cors);
}

async function edocPdf(request, env, cors) {
  const v = await authVet(request, env, cors, { needSale: true });
  if (v.res) return v.res;
  const sale = await getDoc(env, `clinic_pos/${v.clinicId}/sales/${v.saleId}`);
  if (!sale || sale.data.edoc_status !== 'issued' || !sale.data.edoc_id) return json({ error: 'not_issued' }, 409, cors);
  const pay = (await getDoc(env, `clinic_pay/${v.clinicId}`))?.data || {};
  if (!pay.parasut) return json({ error: 'not_connected' }, 409, cors);
  try {
    const tok = await parasutAccess(env, v.clinicId);
    const pdf = await documentPdf(env, tok.access_token, pay.parasut.company_id, sale.data.edoc_type, sale.data.edoc_id);
    return json(pdf ? { url: pdf } : { pending: true }, 200, cors);
  } catch (e) {
    return json({ error: 'parasut', message: String((e && e.message) || e).slice(0, 200) }, 502, cors);
  }
}
