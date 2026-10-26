import { createHmac, timingSafeEqual } from 'node:crypto';
export function validateInitData(raw: string, token: string, now = Math.floor(Date.now()/1000)) {
  if (!raw || raw.length > 16384 || !token) return null;
  const entries = [...new URLSearchParams(raw).entries()];
  if (new Set(entries.map(([k])=>k)).size !== entries.length) return null;
  const params = new URLSearchParams(raw);
  const hash = params.get('hash') ?? '';
  const date = Number(params.get('auth_date'));
  if (!/^[a-f0-9]{64}$/.test(hash) || !Number.isSafeInteger(date) || now-date > 3600 || date-now > 30) return null;
  const secret = createHmac('sha256','WebAppData').update(token).digest();
  const check = entries.filter(([k])=>k!=='hash').sort(([a],[b])=>a < b ? -1 : a > b ? 1 : 0).map(([k,v])=>`${k}=${v}`).join('\n');
  const actual = createHmac('sha256',secret).update(check).digest();
  if (!timingSafeEqual(actual,Buffer.from(hash,'hex'))) return null;
  try { const user=JSON.parse(params.get('user') ?? '{}'); return Number.isSafeInteger(user.id) && user.id>0 ? user as {id:number; language_code?:string} : null; } catch { return null; }
}
