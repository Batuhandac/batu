// Kliniklerin iyzico ve Paraşüt anahtarları için şifreli kasa (AES-256-GCM).
// Anahtar (PAY_ENC_KEY) yalnızca Cloudflare secret'ında durur; yayın akışı ilk kez
// rastgele üretir ve bir daha değiştirmez. Şifreli metin klinik ve sağlayıcıya bağlanır
// (ek doğrulama verisi): bir kliniğin kaydı başka bir kliniğe taşınırsa açılmaz.
import { enc, b64, unb64 } from './util.js';

export function vaultReady(env) {
  try {
    return unb64(env.PAY_ENC_KEY || '').length === 32;
  } catch {
    return false;
  }
}

async function key(env) {
  if (!vaultReady(env)) throw new Error('vault');
  return crypto.subtle.importKey('raw', unb64(env.PAY_ENC_KEY), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function seal(env, value, aad) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc(aad) }, await key(env), enc(JSON.stringify(value))));
  return `v1.${b64(iv)}.${b64(ct)}`;
}

export async function open(env, sealed, aad) {
  const [v, iv, ct] = String(sealed || '').split('.');
  if (v !== 'v1' || !iv || !ct) throw new Error('vault format');
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv), additionalData: enc(aad) }, await key(env), unb64(ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
