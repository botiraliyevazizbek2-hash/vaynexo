'use client';
import type { LiveCatalog } from './use-live-catalog';
import { useMemo, useState } from 'react';
import { ClipboardList, Diamond, Info, LockKeyhole, Minus, Plus, Search, ShieldCheck, ShoppingBag } from 'lucide-react';
import { type Product, formatPrice } from '../../lib/shop/catalog';
import { useI18n } from '../language-provider';
import { ProductCard } from './product-card';
import type { DemoShop } from './use-demo-shop';
export function ShopPage({shop,catalog,onOrders}: {shop:DemoShop;catalog:LiveCatalog;onOrders:()=>void}) {
  const {t,language}=useI18n();
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('all');
  const [attempted,setAttempted]=useState(false);
  const {selectedProduct:p,userId,serverId,idVerified,quantity}=shop;
  const products=catalog.regionProducts;
  const filtered=useMemo(()=>{
    const query=search.trim().toLocaleLowerCase(language);
    const list=products.filter(p=>(category==='all'||(category==='diamonds'?p.icon==='diamond':p.icon!=='diamond')) && `${t(p.title)} ${t(p.subtitle)} ${p.diamonds}`.toLocaleLowerCase(language).includes(query));
    return [...list].sort((a,b)=>a.price-b.price);
  },[search,category,language,t,products]);
  const userError=attempted&&!/^[1-9]\d{4,19}$/.test(userId);
  const serverError=attempted&&!/^[1-9]\d{1,7}$/.test(serverId);
  function choose(product:Product) {
    shop.buyProduct(product);setAttempted(false);
    requestAnimationFrame(()=>document.getElementById('checkout-card')?.scrollIntoView({behavior:'smooth',block:'start'}));
  }
  return <div className="content-stack">
    <div className="page-intro"><div><div className="eyebrow small-eyebrow"><Diamond size={13}/> MLBB TOP-UP</div><h2>{t('Do‘kon & Olmoslar')}</h2><p>{t('Kerakli mahsulotni tanlang, ma’lumotlarni tasdiqlang.')}</p></div><button className="button secondary small" onClick={onOrders}><ClipboardList size={15}/>{t('Buyurtmalar')} ({shop.orders.length})</button></div>

    <div className="filter-toolbar"><div className="category-pills">{[['all','Barchasi'],['diamonds','Olmoslar'],['passes','Passlar']].map(([id,label])=><button key={id} className={category===id?'selected':''} aria-pressed={category===id} onClick={()=>setCategory(id)}>{t(label)}</button>)}</div><label className="search-box"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('Mahsulot qidirish...')} aria-label={t('Mahsulot qidirish...')} maxLength={100}/></label></div>
    {catalog.regions.length>0&&<section className="server-picker" aria-label={t('Serverni tanlang')}><span className="step-label">{t('Serverni tanlang')}</span><div className="server-tabs" role="group" aria-label={t('Serverlar')}>{catalog.regions.map(region=><button key={region.id} type="button" aria-pressed={catalog.regionId===region.id} onClick={()=>{shop.clearProduct();setSearch('');setCategory('all');setAttempted(false);catalog.setRegion(region.id);}}>{t(region.label)}</button>)}</div></section>}
    <div className="catalog-meta"><span>{t('Mahsulotlar soni: {count}',{count:String(filtered.length)})}</span></div>
    <div className="shop-layout"><div className="shop-products"><div className="catalog-grid">{filtered.map(product=><ProductCard key={product.id} product={product} onBuy={()=>choose(product)}/>)}</div>{catalog.status==='loading'&&<p className="disclaimer" role="status">{t('Yuklanmoqda...')}</p>}{catalog.status!=='ready'&&catalog.status!=='loading'&&<div className="empty-state" role="status"><p>{t(catalog.status==='awaiting_pricing'?'Admin ustama foizi va kursni belgilagach paketlar chiqadi.':'Katalog vaqtincha mavjud emas. Keyinroq qayta urinib ko‘ring.')}</p><button className="button secondary" onClick={catalog.reload}>{t('Yangilash')}</button></div>}{catalog.status==='ready'&&filtered.length===0&&<div className="empty-state"><Search size={26}/><h3>{t('Mahsulot topilmadi')}</h3><p>{t('Boshqa so‘z bilan qidiring yoki filtrlarni tozalang.')}</p><button className="button secondary" onClick={()=>{setSearch('');setCategory('all');}}>{t('Filtrlarni tozalash')}</button></div>}<div className="disclaimer"><Info size={15}/><span>{t('To‘lov va yetkazish hali yoqilmagan.')}</span></div></div>
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
        <div className="checkout-total"><span>{t('Jami summa')}</span><b>{formatPrice(p.price*quantity)}</b></div>
        <button className="button primary full pay-button" disabled>{t('To‘lov tez kunda')}</button>
        <p className="checkout-footnote">{t('To‘lov va yetkazish hali yoqilmagan.')}</p>
      </>:<div className="empty-checkout"><div className="empty-icon"><ShoppingBag size={24}/></div><b>{t('Mahsulot tanlanmagan')}</b><p>{t('Katalogdan mahsulot tanlang. Keyin MLBB ID, server va buyurtma tafsilotlarini kiriting.')}</p></div>}
      </aside></div>
  </div>;
}
