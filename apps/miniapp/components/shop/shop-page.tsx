'use client';
import { LiveCatalog } from './live-catalog';
import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, Diamond, Info, LockKeyhole, Minus, Plus, Search, ShieldCheck, ShoppingBag } from 'lucide-react';
import { products, formatPrice } from '../../lib/shop/catalog';
import { validPlayer } from '../../lib/shop/checkout';
import { useI18n } from '../language-provider';
import { ProductCard } from './product-card';
import type { DemoShop } from './use-demo-shop';
export function ShopPage({shop,onCreate,onOrders}: {shop:DemoShop;onCreate:()=>void;onOrders:()=>void}) {
  const {t,language}=useI18n();
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('all');
  const [sort,setSort]=useState('default');
  const [attempted,setAttempted]=useState(false);
  const {selectedProduct:p,userId,serverId,idVerified,quantity,payment,confirmed}=shop;
  const filtered=useMemo(()=>{
    const query=search.trim().toLocaleLowerCase(language);
    const list=products.filter(p=>(category==='all'||(category==='diamonds'?p.icon==='diamond':category==='passes'?p.icon!=='diamond':p.badge==='Mashhur')) && `${t(p.title)} ${t(p.subtitle)} ${p.diamonds}`.toLocaleLowerCase(language).includes(query));
    return sort==='default'?list:[...list].sort((a,b)=>sort==='low'?a.price-b.price:b.price-a.price);
  },[search,category,sort,language]);
  const userError=attempted&&!/^[1-9]\d{4,19}$/.test(userId);
  const serverError=attempted&&!/^[1-9]\d{1,7}$/.test(serverId);
  function choose(product:typeof products[number]) {
    shop.buyProduct(product);setAttempted(false);
    requestAnimationFrame(()=>document.getElementById('checkout-card')?.scrollIntoView({behavior:'smooth',block:'start'}));
  }
  return <div className="content-stack">
    <div className="page-intro"><div><div className="eyebrow small-eyebrow"><Diamond size={13}/> MLBB TOP-UP</div><h2>{t('Do‘kon & Olmoslar')}</h2><p>{t('Kerakli mahsulotni tanlang, ma’lumotlarni tasdiqlang.')}</p></div><button className="button secondary small" onClick={onOrders}><ClipboardList size={15}/>{t('Buyurtmalar')} ({shop.orders.length})</button></div>
    <LiveCatalog/><div className="shop-promo"><div className="promo-symbol"><Diamond size={26}/></div><div><span className="mini-label">VAYNEXO STORE</span><h3>{t('Paket tanlang. Tafsilotlarni tekshiring.')}</h3><p>{t('Mahsulotlar va narxlar — demo ma’lumotlar.')}</p></div></div>
    <div className="filter-toolbar"><div className="category-pills">{[['all','Barchasi'],['diamonds','Olmoslar'],['passes','Passlar'],['popular','Top']].map(([id,label])=><button key={id} className={category===id?'selected':''} aria-pressed={category===id} onClick={()=>setCategory(id)}>{t(label)}</button>)}</div><label className="search-box"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('Mahsulot qidirish...')} aria-label={t('Mahsulot qidirish...')} maxLength={100}/></label></div>
    <div className="catalog-meta"><span>{t('Mahsulotlar soni: {count}',{count:String(filtered.length)})}</span><select className="shop-sort" value={sort} onChange={e=>setSort(e.target.value)} aria-label={t('Saralash')}><option value="default">{t('Tavsiya etilgan')}</option><option value="low">{t('Avval arzonlari')}</option><option value="high">{t('Avval qimmatlari')}</option></select></div>
    <div className="shop-layout"><div className="shop-products"><div className="catalog-grid">{filtered.map(product=><ProductCard key={product.id} product={product} onBuy={()=>choose(product)}/>)}</div>{filtered.length===0&&<div className="empty-state"><Search size={26}/><h3>{t('Mahsulot topilmadi')}</h3><p>{t('Boshqa so‘z bilan qidiring yoki filtrlarni tozalang.')}</p><button className="button secondary" onClick={()=>{setSearch('');setCategory('all');setSort('default');}}>{t('Filtrlarni tozalash')}</button></div>}<div className="disclaimer"><Info size={15}/><span>{t('Ko‘rsatilgan paketlar va narxlar sinov uchun. Haqiqiy mahsulotlar ta’minotchi API’si bilan sinxronlanadi.')}</span></div></div>
      <aside className="checkout-card" id="checkout-card"><div className="checkout-header"><div><span className="step-label">{t('BUYURTMA')}</span><h3>{p?t('Xaridni davom ettirish'):t('Mahsulot tanlang')}</h3></div><LockKeyhole size={18}/></div>
      {p?<>
        <div className="selected-product"><div className="selected-product-icon"><Diamond size={23}/></div><div className="selected-product-name"><b>{t(p.title)}</b><small>{formatPrice(p.price)}</small></div><div className="quantity-control"><button disabled={quantity<=1} aria-label={t('Kamaytirish')} onClick={()=>shop.setQuantity(quantity-1)}><Minus size={12}/></button><b aria-live="polite">{quantity}</b><button disabled={quantity>=10} aria-label={t('Ko‘paytirish')} onClick={()=>shop.setQuantity(quantity+1)}><Plus size={12}/></button></div></div>
        <form className="form-section" noValidate onSubmit={e=>{e.preventDefault();setAttempted(true);shop.verifyPlayer();}}>
          <label htmlFor="mlbb-id">{t('MLBB User ID')}</label><input id="mlbb-id" value={userId} onChange={e=>shop.setUserId(e.target.value)} placeholder="123456789" inputMode="numeric" maxLength={20} autoComplete="off" aria-invalid={userError} aria-describedby="mlbb-id-help"/>
          <small id="mlbb-id-help" className={userError?'field-error':'field-note'}>{t('User ID: 5–20 ta raqam, boshida 0 bo‘lmasin.')}</small>
          <label htmlFor="server-id">{t('Server ID (Zone ID)')}</label><input id="server-id" value={serverId} onChange={e=>shop.setServerId(e.target.value)} placeholder="5143" inputMode="numeric" maxLength={8} autoComplete="off" aria-invalid={serverError} aria-describedby="server-id-help"/>
          <small id="server-id-help" className={serverError?'field-error':'field-note'}>{t('Server ID: 2–8 ta raqam, boshida 0 bo‘lmasin.')}</small>
          <button type="submit" className={`button ${idVerified?'success':'secondary'} full verify-button`}><ShieldCheck size={16}/>{idVerified?t('Format tekshirildi'):t('Formatni tekshirish')}</button>
          <div className="field-note"><Info size={13}/>{t('ID va server o‘yindagi profilingizda ko‘rinadi. Hozir faqat raqamlar formati tekshiriladi; nik va hudud tasdiqlanmaydi.')}</div>
        </form>
        <fieldset className="form-section payment-section shop-payment"><legend>{t('To‘lov usuli')} · {t('Demo')}</legend>{(['click','payme','stars'] as const).map(method=><label className={`payment-option ${payment===method?'chosen':''}`} key={method}><input type="radio" name="payment" value={method} checked={payment===method} onChange={()=>shop.setPayment(method)}/><span><b>{method==='stars'?'Telegram Stars':method==='click'?'Click':'Payme'}</b><small>{t('Faqat demo tanlov, pul yechilmaydi.')}</small></span></label>)}</fieldset>
        <div className="checkout-total"><span>{t('Jami summa')}</span><b>{formatPrice(p.price*quantity)}</b></div>
        <label className="shop-confirm"><input type="checkbox" checked={confirmed} onChange={e=>shop.setConfirmed(e.target.checked)} disabled={!idVerified}/><span>{t('Paket, miqdor, User ID va Server ID ni tekshirdim. Bu demo ekanini tushunaman.')}</span></label>
        <button className="button primary full pay-button" disabled={!shop.ready||!idVerified||!validPlayer(userId,serverId)||!confirmed} onClick={onCreate}>{t('Demo buyurtma yaratish')}<ArrowRight size={16}/></button>
        <p className="checkout-footnote">{t('Haqiqiy to‘lov amalga oshirilmaydi.')}</p>
      </>:<div className="empty-checkout"><div className="empty-icon"><ShoppingBag size={24}/></div><b>{t('Mahsulot tanlanmagan')}</b><p>{t('Katalogdan mahsulot tanlang. Keyin MLBB ID, server va buyurtma tafsilotlarini kiriting.')}</p></div>}
      </aside></div>
  </div>;
}
