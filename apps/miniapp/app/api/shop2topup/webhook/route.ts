import { createHash } from 'node:crypto';
import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import { verifyShop2TopupWebhook } from '../../../../lib/suppliers/shop2topup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
let pool: Pool | undefined;

export async function POST(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ ok: false }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 65536) { await reader.cancel(); return Response.json({ ok: false }, { status: 413 }); }
    chunks.push(value);
  }
  const raw = Buffer.concat(chunks);
  const secret = process.env.SHOP2TOPUP_WEBHOOK_SECRET;
  const valid = verifyShop2TopupWebhook(raw, request.headers.get('x-shop2topup-signature'), secret);
  // URL registration may precede provision of the signing secret. An unverified
  // test may acknowledge connectivity only; it never changes an order or database.
  if (!valid && secret) return Response.json({ ok: false }, { status: 401 });
  let payload;
  try { payload = JSON.parse(raw.toString('utf8')); } catch { return Response.json({ ok: false }, { status: 400 }); }
  if (payload?.event === 'webhook.test') return Response.json({ ok: true, test: true, verified: valid });
  if (!valid) return Response.json({ ok: false, error: 'webhook_secret_not_configured' }, { status: 503 });
  if (!['order.completed', 'order.refunded'].includes(payload?.event) ||
      typeof payload?.data?.order_id !== 'string' || payload.data.order_id.length > 128 ||
      typeof payload?.data?.status !== 'string' || payload.data.status.length > 64 ||
      typeof payload?.timestamp !== 'string' || !Number.isFinite(Date.parse(payload.timestamp))) {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (!process.env.DATABASE_URL) return Response.json({ ok: false }, { status: 503 });
  try {
    if (!pool) {
      pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2, connectionTimeoutMillis: 3000, statement_timeout: 3000, query_timeout: 4000 });
      pool.on('error', () => {});
      if (process.env.VERCEL) attachDatabasePool(pool);
    }
    await pool.query(`CREATE TABLE IF NOT EXISTS vaynexo_shop2topup_events (
      digest text PRIMARY KEY, order_id text NOT NULL, event text NOT NULL,
      status text NOT NULL, event_at timestamptz NOT NULL, received_at timestamptz NOT NULL DEFAULT now()
    )`);
    await pool.query(`INSERT INTO vaynexo_shop2topup_events (digest,order_id,event,status,event_at)
      VALUES ($1,$2,$3,$4,$5) ON CONFLICT (digest) DO NOTHING`,
      [createHash('sha256').update(raw).digest('hex'), payload.data.order_id, payload.event, payload.data.status, payload.timestamp]);
    // Receipt only: payment, fulfilment and customer balance are never changed here.
    return Response.json({ ok: true });
  } catch { return Response.json({ ok: false }, { status: 503 }); }
}
