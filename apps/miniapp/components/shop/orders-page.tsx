'use client';
import { ArrowLeft, ClipboardList, Diamond, Info } from 'lucide-react';
import { products, formatPrice } from '../../lib/shop/catalog';
import { orderReference, type DemoOrder } from '../../lib/shop/checkout';
import { useI18n } from '../language-provider';
import type { DemoShop } from './use-demo-shop';
export function OrderHistory({orders,onSelect}: {orders:DemoOrder[];onSelect:(id:string)=>void}) {
  const {t,language}=useI18n();
  return <div className="history-list demo-history">{orders.length?orders.map(order=>{
    const product=products.find(p=>p.id===order.productId)!;
    return <button className="history-row" key={order.id} onClick={()=>onSelect(order.id)}><div className="history-icon"><Diamond size={18}/></div><div className="history-main"><b>{t(product.title)} × {order.quantity}</b><small>{orderReference(order)}</small><small>{new Date(order.createdAt).toLocaleString(language==='uz'?'uz-UZ':language==='ru'?'ru-RU':'en-GB',{dateStyle:'short',timeStyle:'short'})}</small></div><div className="history-right"><b>{formatPrice(order.unitPrice*order.quantity)}</b><small>{t('Demo')}</small></div></button>;
  }):<p className="disclaimer">{t('Hozircha demo buyurtmalar yo‘q.')}</p>}</div>;
}
export function OrdersPage({shop,onShop}: {shop:DemoShop;onShop:()=>void}) {
  const {t}=useI18n();const order=shop.activeOrder;
  const product=order?products.find(p=>p.id===order.productId):null;
  return <div className="content-stack"><div className="page-intro"><div><div className="eyebrow small-eyebrow"><ClipboardList size={13}/> VAYNEXO</div><h2>{t('Buyurtmalar')}</h2><p>{t('Oxirgi 20 ta demo buyurtma shu qurilmada saqlanadi. Bu serverdagi haqiqiy buyurtmalar tarixi emas.')}</p></div><button className="button secondary small" onClick={onShop}><ArrowLeft size={15}/>{t('Do‘konga o‘tish')}</button></div>
    {shop.storageFailed&&<div role="status" className="disclaimer field-error">{t('Qurilmaga saqlab bo‘lmadi. Sahifa yopilsa yangi demo buyurtmalar yo‘qolishi mumkin.')}</div>}
    {order&&product&&<div className="order-detail-layout"><section className="order-main-card"><div className="order-success"><div className="success-mark"><ClipboardList size={25}/></div><div><h3>{t('Demo buyurtma yaratildi')}</h3><p>{t('Bu buyurtma faqat interfeysni sinash uchun. To‘lov ham, yetkazish ham amalga oshirilmadi.')}</p></div></div><div className="order-reference"><span>{t('Buyurtma raqami')}</span><b>{orderReference(order)}</b></div><div className="disclaimer"><Info size={16}/><span>{t('Demo saqlandi. To‘lov va yetkazish ulanmagan.')}</span></div><div className="shop-order-player"><span>{t('MLBB User ID')}</span><b>{order.userId}</b><span>{t('Server ID')}</span><b>{order.serverId}</b></div></section><aside className="order-summary-card"><h3>{t('Buyurtma tafsilotlari')}</h3><div className="summary-product"><div className="selected-product-icon"><Diamond size={22}/></div><div><b>{t(product.title)}</b><small>{formatPrice(order.unitPrice)} × {order.quantity}</small></div></div><div className="summary-line"><span>{t('To‘lov usuli')} · {t('Demo')}</span><b>{order.payment==='stars'?'Telegram Stars':order.payment==='click'?'Click':'Payme'}</b></div><div className="summary-line total-line"><span>{t('Jami')}</span><b>{formatPrice(order.unitPrice*order.quantity)}</b></div><p className="checkout-footnote">{t('Format tekshirildi. O‘yin akkaunti tasdiqlanmagan.')}</p></aside></div>}
    <div className="section-title"><h2>{t('Xaridlar tarixi')}</h2></div><OrderHistory orders={shop.orders} onSelect={shop.setActiveId}/>
    {!shop.orders.length&&<button className="button primary" onClick={onShop}>{t('Mahsulot tanlang')}</button>}
  </div>;
}
