// Paraşüt (ön muhasebe ve e-belge) istemcisi: OAuth, müşteri, satış faturası ve
// e-SMM / e-Arşiv. Patiport'un Paraşüt uygulama kimliği (PARASUT_CLIENT_ID/SECRET)
// Paraşüt'ten istenir; her klinik kendi Paraşüt hesabıyla "Paraşüt'e bağlan" der,
// şifresi bize gelmez (authorization code akışı).
// Belgeler: https://apidocs.parasut.com/ (API v4)

const PARASUT = 'https://api.parasut.com';
const base = (env) => env.PARASUT_URL || PARASUT;

export function parasutConfigured(env) {
  return Boolean(env.PARASUT_CLIENT_ID && env.PARASUT_CLIENT_SECRET);
}

export function authorizeUrl(env, redirectUri, state) {
  const q = new URLSearchParams({ client_id: env.PARASUT_CLIENT_ID, redirect_uri: redirectUri, response_type: 'code', state });
  return `${base(env)}/oauth/authorize?${q}`;
}

export class ParasutError extends Error {
  constructor(message, status, reauth = false) {
    super(message);
    this.status = status;
    this.reauth = reauth;
  }
}

async function tokenRequest(env, params) {
  const res = await fetch(`${base(env)}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ client_id: env.PARASUT_CLIENT_ID, client_secret: env.PARASUT_CLIENT_SECRET, ...params }).toString(),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok || !d.access_token) {
    // invalid_grant: yenileme belirteci geçersiz, klinik yeniden bağlanmalı
    throw new ParasutError(d.error_description || d.error || `Paraşüt oturumu açılamadı (${res.status})`, res.status, d.error === 'invalid_grant');
  }
  return { access_token: d.access_token, refresh_token: d.refresh_token, access_exp_ms: Date.now() + (Number(d.expires_in) || 7200) * 1000 };
}

export function exchangeCode(env, code, redirectUri) {
  return tokenRequest(env, { grant_type: 'authorization_code', code, redirect_uri: redirectUri });
}

/** Paraşüt yenileme belirteci her kullanımda değişir; yenisi saklanmalıdır. */
export function refreshTokens(env, refreshToken) {
  return tokenRequest(env, { grant_type: 'refresh_token', refresh_token: refreshToken });
}

async function call(env, accessToken, method, path, body) {
  const res = await fetch(`${base(env)}/v4${path}`, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return { status: 204, data: null };
  const d = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (d.errors && d.errors[0] && (d.errors[0].detail || d.errors[0].title)) || `Paraşüt hatası (${res.status})`;
    throw new ParasutError(msg, res.status, res.status === 401);
  }
  return { status: res.status, ...d };
}

/** Kullanıcının firmaları: [{ id, name }] */
export async function companies(env, accessToken) {
  const d = await call(env, accessToken, 'GET', '/me?include=companies');
  return (d.included || []).filter((x) => x.type === 'companies').map((c) => ({ id: Number(c.id), name: String(c.attributes?.name || c.attributes?.legal_name || `Firma ${c.id}`) }));
}

const round2 = (n) => Math.round(n * 100) / 100;

/** KDV dahil tutardan KDV hariç birim fiyat. */
export function netOfVat(grossKurus, vatRate) {
  return round2(grossKurus / 100 / (1 + vatRate / 100));
}

/**
 * Bir tahsilat için e-belge keser: müşteri → satış faturası → e-SMM ya da e-Arşiv.
 * input: { docType: 'e_smm'|'e_archive', amountKurus, vatRate, description, buyerName,
 *          city, district, issueDate, note }
 * Döner: { invoiceId, docId, docType, number }
 */
export async function issueDocument(env, accessToken, companyId, input, { pollMs = 1500, maxPolls = 16 } = {}) {
  const c = `/${companyId}`;
  const contact = await call(env, accessToken, 'POST', `${c}/contacts`, {
    data: {
      type: 'contacts',
      attributes: {
        name: input.buyerName || 'Nihai Tüketici',
        contact_type: 'person',
        account_type: 'customer',
        // Kimliği bilinmeyen nihai tüketici için GİB'in kabul ettiği numara
        tax_number: '11111111111',
        city: input.city || undefined,
        district: input.district || undefined,
        untrackable: true,
      },
    },
  });
  const invoice = await call(env, accessToken, 'POST', `${c}/sales_invoices`, {
    data: {
      type: 'sales_invoices',
      attributes: {
        item_type: 'invoice',
        description: input.description,
        issue_date: input.issueDate,
        currency: 'TRL',
        tax_number: '11111111111',
        city: input.city || undefined,
        district: input.district || undefined,
        billing_address: [input.district, input.city].filter(Boolean).join(' / ') || undefined,
      },
      relationships: {
        contact: { data: { type: 'contacts', id: String(contact.data.id) } },
        details: {
          data: [
            {
              type: 'sales_invoice_details',
              attributes: { quantity: 1, unit_price: netOfVat(input.amountKurus, input.vatRate), vat_rate: input.vatRate, description: input.description },
            },
          ],
        },
      },
    },
  });
  const invoiceId = String(invoice.data.id);
  const kind = input.docType === 'e_archive' ? 'e_archives' : 'e_smms';
  const created = await call(env, accessToken, 'POST', `${c}/${kind}`, {
    data: {
      type: kind,
      attributes: input.note ? { note: input.note } : {},
      relationships: { sales_invoice: { data: { type: 'sales_invoices', id: invoiceId } } },
    },
  });
  // e-belge çoğunlukla arka planda oluşur: iş takibini (trackable job) bekle
  if (created.data && created.data.type === 'trackable_jobs') {
    let done = false;
    for (let i = 0; i < maxPolls && !done; i++) {
      await new Promise((r) => setTimeout(r, pollMs));
      const job = await call(env, accessToken, 'GET', `${c}/trackable_jobs/${created.data.id}`);
      const st = job.data?.attributes?.status;
      if (st === 'error') throw new ParasutError((job.data.attributes.errors || []).join(', ') || 'e-belge oluşturulamadı', 422);
      done = st === 'done';
    }
    if (!done) throw new ParasutError('e-belge zamanında oluşmadı; birazdan yeniden deneyin', 504);
  }
  const shown = await call(env, accessToken, 'GET', `${c}/sales_invoices/${invoiceId}?include=active_e_document`);
  const doc = (shown.included || []).find((x) => x.type === 'e_smms' || x.type === 'e_archives' || x.type === 'e_invoices');
  return {
    invoiceId,
    docId: doc ? String(doc.id) : created.data && created.data.type === kind ? String(created.data.id) : null,
    docType: doc ? (doc.type === 'e_archives' ? 'e_archive' : doc.type === 'e_invoices' ? 'e_invoice' : 'e_smm') : input.docType,
    number: doc && doc.attributes && doc.attributes.invoice_number != null ? String(doc.attributes.invoice_number) : null,
  };
}

/** e-belgenin PDF adresi (1 saat geçerli); henüz hazır değilse null. */
export async function documentPdf(env, accessToken, companyId, docType, docId) {
  const path = docType === 'e_archive' ? `/${companyId}/e_archives/${docId}/pdf` : `/${companyId}/e_smms/${docId}.pdf`;
  const d = await call(env, accessToken, 'GET', path);
  return d.status === 204 ? null : d.data?.attributes?.url || null;
}
