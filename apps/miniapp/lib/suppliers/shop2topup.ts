import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyShop2TopupWebhook(raw: Buffer, signature: string | null, secret: string | undefined) {
  if (!secret || !signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  const expected = 'sha256=' + createHmac('sha256', secret).update(raw).digest('hex');
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// Only read operations are exposed. Orders must go through a paid, persisted checkout.
export function createShop2TopupClient(options: { apiKey?: string; baseUrl?: string; fetchImpl?: typeof fetch } = {}) {
  if (typeof window !== 'undefined') throw Error('Server only');
  const key = options.apiKey ?? process.env.SHOP2TOPUP_API_KEY;
  const base = options.baseUrl ?? process.env.SHOP2TOPUP_API_BASE_URL ?? 'https://v2sandbox.shop2topup.com/api/endpoints/v1';
  if (!key || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) throw Error('Shop2Topup is not configured');
  if (!['https://v2sandbox.shop2topup.com/api/endpoints/v1', 'https://shop2topup.com/api/endpoints/v1'].includes(base)) throw Error('Invalid Shop2Topup host');
  async function read(path: string) {
    let response: Response;
    try {
      response = await (options.fetchImpl ?? fetch)(base + path, {
        method: 'GET', headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
        cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
      });
    } catch { throw Error('Shop2Topup connection unavailable'); }
    if (!response.ok) throw Error(`Shop2Topup HTTP ${response.status}`);
    const body = await response.json();
    if (body?.success !== true) throw Error('Shop2Topup request rejected');
    return body;
  }
  return {
    getAccount: () => read('/account'),
    getCategories: () => read('/catalog/categories'),
    async getProfile() {
      const body = await read('/account');
      if (typeof body.account?.enabled !== 'boolean') throw Error('Invalid Shop2Topup account');
      return { active: body.account.enabled, balanceUSD: String(body.account.wallet ?? '0') };
    },
    async getTopupCategories() {
      const body = await read('/catalog/categories');
      if (!Array.isArray(body.categories) || body.categories.length > 10000) throw Error('Invalid Shop2Topup categories');
      return body.categories.map((c: {id: unknown; name: unknown}) => {
        if (!Number.isSafeInteger(c.id) || Number(c.id) < 1 || typeof c.name !== 'string' || !c.name.trim()) throw Error('Invalid Shop2Topup category');
        return {id: String(c.id), name: c.name, note: null};
      });
    },
    async getTopupOffers(categoryId: string) {
      if (!/^[1-9]\d*$/.test(categoryId)) throw Error('Invalid Shop2Topup category');
      const body = await read('/catalog/subcategories?categoryId=' + categoryId);
      if (!Array.isArray(body.subcategories) || body.subcategories.length > 10000) throw Error('Invalid Shop2Topup products');
      const items = body.subcategories;
      const offers = items.filter((o: {product_type?: string}) => o.product_type === 'topup').map((o: {item_id: unknown; category_id: unknown; name: unknown; price: unknown}) => {
        if (!Number.isSafeInteger(o.item_id) || Number(o.item_id) < 1 || String(o.category_id) !== categoryId || typeof o.name !== 'string' || !o.name.trim() || typeof o.price !== 'string' || !/^\d{1,12}(?:\.\d{1,6})?$/.test(o.price)) throw Error('Invalid Shop2Topup product');
        return {id: String(o.item_id), name: o.name, supplierPriceUSD: o.price};
      });
      return {id: categoryId, name: String(items[0]?.category_name ?? 'Mobile Legends'), note: null, fields: [], offers, supplier: 'shop2topup' as const};
    },
  };
}
