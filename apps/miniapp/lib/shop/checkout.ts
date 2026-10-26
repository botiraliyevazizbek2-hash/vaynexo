import { products } from './catalog';
export type Payment = 'click' | 'payme' | 'stars';
export type DemoOrder = {
  id: string; createdAt: string; productId: string; quantity: number;
  unitPrice: number; userId: string; serverId: string; payment: Payment;
};
export const HISTORY_LIMIT = 20;
export function validPlayer(userId: string, serverId: string) {
  return /^[1-9]\d{4,19}$/.test(userId) && /^[1-9]\d{1,7}$/.test(serverId);
}
export function validQuantity(value: number) { return Number.isInteger(value) && value >= 1 && value <= 10; }
export function isPayment(value: unknown): value is Payment { return ['click','payme','stars'].includes(value as string); }
export function parseHistory(raw: string | null): DemoOrder[] {
  if (!raw || raw.length > 50000) return [];
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || !Array.isArray(data.orders)) return [];
    const ids = new Set<string>();
    return data.orders.filter((o: DemoOrder) => {
      if (!o || typeof o.id !== 'string' || !/^[a-f0-9-]{36}$/.test(o.id) || ids.has(o.id)
        || typeof o.createdAt !== 'string' || !Number.isFinite(Date.parse(o.createdAt))
        || !products.some(p => p.id === o.productId) || !validQuantity(o.quantity)
        || !Number.isSafeInteger(o.unitPrice) || o.unitPrice < 1 || o.unitPrice > 10000000
        || typeof o.userId !== 'string' || typeof o.serverId !== 'string'
        || !validPlayer(o.userId, o.serverId) || !isPayment(o.payment)) return false;
      ids.add(o.id); return true;
    }).slice(0, HISTORY_LIMIT);
  } catch { return []; }
}
export function orderReference(order: DemoOrder) { return `DEMO-${order.id.replace(/-/g,'').slice(0,12).toUpperCase()}`; }
