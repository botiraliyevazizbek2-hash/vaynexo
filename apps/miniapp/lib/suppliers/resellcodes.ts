// Server-side, read-only integration. No balance-spending endpoints are exposed.
const BASE = 'https://resell.codes/api/v1';
type Failure = 'not_configured' | 'unauthorized' | 'forbidden' | 'not_found' | 'rate_limited' | 'network' | 'invalid_input' | 'invalid_response' | 'provider_error';
export class ResellcodesError extends Error {
  readonly code: Failure;
  readonly status: number;
  constructor(code: Failure, status = 0) {
    super(`ReSellCodes: ${code}`);
    this.name = 'ResellcodesError'; this.code = code; this.status = status;
  }
}
function record(v: unknown): v is Record<string, unknown> { return !!v && typeof v === 'object' && !Array.isArray(v); }
function text(v: unknown, max = 1000): v is string { return typeof v === 'string' && v.trim().length > 0 && v.length <= max; }
function id(v: unknown): v is string { return text(v, 200) && /^[A-Za-z0-9_.-]+$/.test(v); }
// Preserve exact USD decimal strings; no floating-point money arithmetic.
export function validResellcodesUSD(v: unknown): v is string { return typeof v === 'string' && /^\d{1,12}\.\d{4}$/.test(v); }
export function createResellcodesClient(options: { apiKey?: string; fetchImpl?: typeof fetch } = {}) {
  if (typeof window !== 'undefined') throw new ResellcodesError('forbidden');
  const key = options.apiKey ?? process.env.RESELLCODES_API_KEY;
  if (!key || !/^rsc_live_[a-fA-F0-9]{48}$/.test(key)) throw new ResellcodesError('not_configured');
  const send = options.fetchImpl ?? fetch;
  async function get(path: string): Promise<Record<string, unknown>> {
    let response: Response;
    try {
      response = await send(BASE + path, { method: 'GET', headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' }, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000) });
    } catch { throw new ResellcodesError('network'); }
    if (!response.ok) {
      const codes: Record<number, Failure> = { 401: 'unauthorized', 403: 'forbidden', 404: 'not_found', 429: 'rate_limited' };
      throw new ResellcodesError(codes[response.status] ?? 'provider_error', response.status);
    }
    try {
      const raw = await response.text();
      if (Buffer.byteLength(raw) > 2_000_000) throw Error();
      const data: unknown = JSON.parse(raw);
      if (!record(data)) throw Error();
      return data;
    } catch { throw new ResellcodesError('invalid_response', response.status); }
  }
  return {
    async getProfile() {
      const d = await get('/me');
      if (d.object !== 'account' || !['ACTIVE', 'BLOCKED'].includes(String(d.status)) || !validResellcodesUSD(d.balance_usd)) throw new ResellcodesError('invalid_response');
      return { active: d.status === 'ACTIVE', balanceUSD: d.balance_usd };
    },
    async getTopupCategories() {
      const d = await get('/top-ups/categories?limit=600');
      if (d.object !== 'list' || !Array.isArray(d.data) || d.data.length > 600) throw new ResellcodesError('invalid_response');
      return d.data.map(p => {
        if (!record(p) || !id(p.category_id) || !text(p.name)) throw new ResellcodesError('invalid_response');
        return { id: p.category_id, name: p.name, note: text(p.note, 20000) ? p.note : null };
      });
    },
    async getTopupOffers(categoryId: string) {
      if (!id(categoryId)) throw new ResellcodesError('invalid_input');
      const d = await get('/top-ups/categories/' + encodeURIComponent(categoryId) + '/offers');
      if (d.object !== 'top_up_offers' || d.category_id !== categoryId || !text(d.name) || !Array.isArray(d.fields) || d.fields.length > 50 || !Array.isArray(d.offers) || d.offers.length > 10000) throw new ResellcodesError('invalid_response');
      return {
        id: categoryId, name: d.name, note: text(d.note, 20000) ? d.note : null,
        fields: d.fields.map(f => {
          if (!record(f) || !id(f.key) || !text(f.label) || !text(f.type, 64)) throw new ResellcodesError('invalid_response');
          return { key: f.key, label: f.label, type: f.type };
        }),
        offers: d.offers.map(o => {
          if (!record(o) || !id(o.offer_id) || !text(o.name) || !validResellcodesUSD(o.price_usd)) throw new ResellcodesError('invalid_response');
          return { id: o.offer_id, name: o.name, supplierPriceUSD: o.price_usd };
        }),
      };
    },
  };
}
