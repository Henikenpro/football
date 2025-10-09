// lib/footballClient.ts
const API_BASE = process.env.API_FOOTBALL_BASE ?? 'https://v3.football.api-sports.io';
const API_KEY = (process.env.FOOTBALL_API_KEY ?? '').trim();

type Params = Record<string, unknown>;
type FetchOptions = RequestInit | undefined;

function ensureLeadingSlash(p: string) {
  return p.startsWith('/') ? p : '/' + p;
}

function maskKey(key: string) {
  if (!key) return '';
  if (key.length <= 6) return '***';
  return key.slice(0, 3) + '...' + key.slice(-3);
}

export default async function footballFetch(path: string, params: Params = {}, options: FetchOptions = {}) {
  if (!API_KEY) {
    throw new Error('FOOTBALL_API_KEY chưa được cấu hình (process.env.FOOTBALL_API_KEY).');
  }

  const url = new URL(API_BASE + ensureLeadingSlash(path));
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-apisports-key': API_KEY,
  };

  if (process.env.NODE_ENV === 'development') {
    console.debug('[footballFetch] URL:', url.toString());
    console.debug('[footballFetch] x-apisports-key:', maskKey(API_KEY));
  }

  const res = await fetch(url.toString(), {
    method: options?.method ?? 'GET',
    headers,
    ...options,
  });

  const text = await res.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!res.ok) {
    const errMsg = typeof body === 'string' ? body : JSON.stringify(body);
    const err: any = new Error(`Football API error ${res.status}: ${errMsg}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}