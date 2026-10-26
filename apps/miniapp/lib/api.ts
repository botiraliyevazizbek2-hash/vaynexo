export type ApiOrderRequest = {
  productId: string;
  userId: string;
  serverId: string;
  paymentMethod: string;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

/**
 * Backend integration boundary. The UI is intentionally in demo mode by default.
 * Add the matching FastAPI endpoint before enabling real orders or payments.
 */
export async function createOrder(input: ApiOrderRequest) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL sozlanmagan. Demo rejimida sinab ko‘ring.');
  }
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => 'Noma’lum server xatosi');
    throw new Error(message || `Server xatosi: ${response.status}`);
  }
  return response.json();
}
