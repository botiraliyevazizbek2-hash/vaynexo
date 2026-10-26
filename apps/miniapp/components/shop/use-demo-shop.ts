'use client';
import { useEffect, useRef, useState } from 'react';
import { type Product } from '../../lib/shop/catalog';
import { HISTORY_LIMIT, isPayment, parseHistory, validPlayer, validQuantity, type DemoOrder, type Payment } from '../../lib/shop/checkout';

export function useDemoShop(products: Product[]) {
  const [selectedId, select] = useState<string | null>(null);
  const selectedProduct = products.find(p=>p.id===selectedId)??null;
  const [userId, updateUser] = useState('');
  const [serverId, updateServer] = useState('');
  const [idVerified, confirmFormat] = useState(false);
  const [confirmed, confirmDetails] = useState(false);
  const [quantity, updateQuantity] = useState(1);
  const [payment, updatePayment] = useState<Payment>('click');
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  const storageKey = useRef('');
  const submittedId = useRef<string | null>(null);
  useEffect(() => {
    // Partition local demo history by Telegram account. This is not server authentication.
    const tg = (window as Window & {Telegram?: {WebApp?: {initDataUnsafe?: {user?: {id?:number}}}}}).Telegram?.WebApp;
    const id = tg?.initDataUnsafe?.user?.id;
    storageKey.current = `vaynexo.demo-orders.v1.${Number.isSafeInteger(id) && id! > 0 ? id : 'browser'}`;
    try {
      const saved = parseHistory(localStorage.getItem(storageKey.current));
      setOrders(saved); setActiveId(saved[0]?.id ?? null);
    } catch { setStorageFailed(true); }
    setReady(true);
  }, []);
  function resetConfirmation() { confirmDetails(false); submittedId.current = null; }
  function buyProduct(product: Product) {
    if(!products.some(p=>p.id===product.id))return;
    select(product.id); updateQuantity(1); confirmFormat(false); resetConfirmation();
  }
  function clearProduct(){select(null);confirmFormat(false);updateQuantity(1);resetConfirmation();}
  function setUserId(value: string) { updateUser(value); confirmFormat(false); resetConfirmation(); }
  function setServerId(value: string) { updateServer(value); confirmFormat(false); resetConfirmation(); }
  function setQuantity(value: number) { if(validQuantity(value)) { updateQuantity(value); resetConfirmation(); } }
  function setPayment(value: string) { if(isPayment(value)) { updatePayment(value); resetConfirmation(); } }
  function verifyPlayer() { const valid = validPlayer(userId,serverId); confirmFormat(valid); confirmDetails(false); return valid; }
  function createOrder(): DemoOrder | null {
    if (!ready || !selectedProduct || !idVerified || !confirmed || !validPlayer(userId,serverId) || !validQuantity(quantity) || !isPayment(payment)) return null;
    if (submittedId.current) return null;
    // Resolve the catalogue price rather than accepting a UI-provided total.
    const product = products.find(p => p.id === selectedProduct.id);
    if (!product || product.supplier === 'resellcodes') return null;
    const order: DemoOrder = {id:crypto.randomUUID(),createdAt:new Date().toISOString(),productId:product.id,quantity,unitPrice:product.price,userId,serverId,payment};
    submittedId.current = order.id;
    const next = [order,...orders].slice(0,HISTORY_LIMIT);
    setOrders(next); setActiveId(order.id);
    try { localStorage.setItem(storageKey.current,JSON.stringify({version:1,orders:next}));setStorageFailed(false); }
    catch { setStorageFailed(true); }
    return order;
  }
  return {selectedProduct,buyProduct,clearProduct,userId,setUserId,serverId,setServerId,idVerified,verifyPlayer,confirmed,setConfirmed:confirmDetails,quantity,setQuantity,payment,setPayment,orders,activeOrder:orders.find(o=>o.id===activeId)??null,setActiveId,ready,storageFailed,createOrder};
}
export type DemoShop = ReturnType<typeof useDemoShop>;
