export function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

export function rejectNonPost(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return true;
  }

  return false;
}

export function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return req.body;
}

export function missingCredentialResponse(res, channel, required, payload) {
  return res.status(200).json({
    success: false,
    dryRun: true,
    channel,
    error: 'credentials_required',
    required,
    payload,
  });
}

export function normalizeShopDomain(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const withoutProtocol = raw.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  return withoutProtocol.endsWith('.myshopify.com')
    ? withoutProtocol
    : withoutProtocol.replace(/\/admin.*$/i, '');
}

export function money(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? Number(num.toFixed(2)) : fallback;
}

export function text(value, fallback = '') {
  const raw = String(value ?? fallback).trim();
  return raw || fallback;
}

export async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const bodyText = await response.text();
  let data = null;

  try {
    data = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    data = bodyText;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export function basicAuth(username, password) {
  return Buffer.from(`${username}:${password}`).toString('base64');
}
