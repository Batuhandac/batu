// iyzico: imzalı istekler ve ödeme formu. Anahtar çifti ya Patiport'un deneme hesabı
// (IYZICO_API_KEY/SECRET) ya da kliniğin kendi hesabıdır (şifreli kasadan).
import { enc } from './util.js';

export const IYZICO_SANDBOX = 'https://sandbox-api.iyzipay.com';
export const IYZICO_LIVE = 'https://api.iyzipay.com';

/** iyzico fiyat biçimi (resmî kütüphaneyle aynı): 1250 → "1250.0", 1250.5 → "1250.5" */
export function formatPrice(kurus) {
  const s = String(parseFloat((kurus / 100).toFixed(2)));
  return s.includes('.') ? s : `${s}.0`;
}

/** IYZWSv2 yetkilendirme başlığı: HMAC-SHA256(rnd + yol + gövde) hex, sonra base64. */
export async function iyzicoAuth(apiKey, secretKey, path, bodyText, rnd) {
  const key = await crypto.subtle.importKey('raw', enc(secretKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = [...new Uint8Array(await crypto.subtle.sign('HMAC', key, enc(rnd + path + bodyText)))].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `IYZWSv2 ${btoa(`apiKey:${apiKey}&randomKey:${rnd}&signature:${sig}`)}`;
}

/** Deneme anahtarları "sandbox-" ile başlar; canlı anahtarlar canlı adrese gider. */
export function envOfKey(apiKey) {
  return String(apiKey).startsWith('sandbox-') ? 'sandbox' : 'live';
}

/** Patiport'un deneme hesabı (kendi hesabını bağlamamış klinikler için). */
export function demoCreds(env) {
  return { apiKey: env.IYZICO_API_KEY, secretKey: env.IYZICO_SECRET_KEY, baseUrl: env.IYZICO_BASE_URL || IYZICO_SANDBOX };
}

/** Kliniğin kendi anahtarları için adres (testte IYZICO_CLINIC_URL ile sahte sunucuya). */
export function clinicCreds(env, apiKey, secretKey) {
  const baseUrl = env.IYZICO_CLINIC_URL || (envOfKey(apiKey) === 'sandbox' ? IYZICO_SANDBOX : IYZICO_LIVE);
  return { apiKey, secretKey, baseUrl };
}

export async function iyzicoCall(creds, path, body) {
  const bodyText = JSON.stringify(body);
  const rnd = `${Date.now()}${Math.random().toString(8).slice(2, 10)}`;
  const res = await fetch(creds.baseUrl + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-iyzi-rnd': rnd,
      Authorization: await iyzicoAuth(creds.apiKey, creds.secretKey, path, bodyText, rnd),
    },
    body: bodyText,
  });
  return res.json().catch(() => ({ status: 'failure', errorMessage: `HTTP ${res.status}` }));
}

/** Anahtarların çalıştığını zararsız bir sorguyla (BIN sorgusu) dener. */
export async function validateKeys(creds) {
  const r = await iyzicoCall(creds, '/payment/bin/check', { locale: 'tr', binNumber: '552879' });
  return r.status === 'success' ? { ok: true } : { ok: false, message: r.errorMessage || null };
}

export function initializeCheckout(creds, req) {
  return iyzicoCall(creds, '/payment/iyzipos/checkoutform/initialize/auth/ecom', req);
}

export function retrieveCheckout(creds, token, saleId) {
  return iyzicoCall(creds, '/payment/iyzipos/checkoutform/auth/ecom/detail', { locale: 'tr', conversationId: saleId || undefined, token });
}
