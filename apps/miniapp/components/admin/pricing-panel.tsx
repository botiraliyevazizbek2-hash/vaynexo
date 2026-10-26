'use client';
import { useEffect,useState } from 'react';
import { useI18n } from '../language-provider';
type Snapshot={settings?:{markup:string|null;rate:string|null;version:number};products?:{id:string;title:string;subtitle:string;supplierPriceUSD:string;price:number}[];syncedAt?:string;telegramId?:number;status?:string};
export function PricingPanel(){
 const {t,language,setLanguage}=useI18n();
 const [data,setData]=useState<Snapshot>({}),[markup,setMarkup]=useState(''),[rate,setRate]=useState(''),[busy,setBusy]=useState(true),[error,setError]=useState(''),[saved,setSaved]=useState(false);
 function auth(){return {'Content-Type':'application/json','X-Telegram-Init-Data':(window as Window & {Telegram?:{WebApp?:{initData?:string}}}).Telegram?.WebApp?.initData??''};}
 async function load(){setBusy(true);setError('');try{const r=await fetch('/api/admin/pricing',{headers:auth()});const d=await r.json();setData(d);if(!r.ok)throw Error(r.status===403?'Faqat admin kirishi mumkin.':'Katalogni yuklab bo‘lmadi.');setMarkup(d.settings.markup??'');setRate(d.settings.rate??'');}catch(e){setError(e instanceof Error?e.message:'Katalogni yuklab bo‘lmadi.');}finally{setBusy(false);}}
 useEffect(()=>{void load();},[]);
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setSaved(false);setError('');try{const r=await fetch('/api/admin/pricing',{method:'POST',headers:auth(),body:JSON.stringify({markup,rate,version:data.settings?.version})});const d=await r.json();if(!r.ok)throw Error(r.status===409?'Sozlamalar o‘zgargan. Yangilab qayta urinib ko‘ring.':'Foiz va kursni tekshiring. Saqlanmadi.');setData(d);setSaved(true);}catch(e){setError(e instanceof Error?e.message:'Katalogni yuklab bo‘lmadi.');}finally{setBusy(false);}}
 return <main className="pricing-shell"><div className="pricing-head"><div><small>VAYNEXO · ADMIN</small><h1>{t('Katalog va ustama')}</h1></div><select aria-label={t('Til')} value={language} onChange={e=>setLanguage(e.target.value as 'uz'|'ru'|'en')}><option value="uz">UZ</option><option value="ru">RU</option><option value="en">EN</option></select></div>
 <a href="/">← {t('Ilovaga qaytish')}</a><p>{t('API paketlarni avtomatik yuklaydi. Sotuv narxi uchun necha foiz ustama qo‘yamiz?')}</p>
 {error&&<p role="alert">{t(error)}</p>}{data.telegramId&&<p>Telegram ID: <b>{data.telegramId}</b></p>}
 {data.settings&&<><form onSubmit={save} className="pricing-form"><label>{t('Ustama (%)')}<input required inputMode="decimal" type="number" min="0" max="1000" step="0.01" value={markup} onChange={e=>setMarkup(e.target.value)}/></label><label>{t('1 USD = necha UZS?')}<input required inputMode="decimal" type="number" min="0.0001" max="1000000" step="0.0001" value={rate} onChange={e=>setRate(e.target.value)}/></label><p>{t('Sotuv narxi = USD narxi × kurs × (1 + foiz / 100). Butun so‘mgacha yuqoriga yaxlitlanadi.')}</p><button className="button primary" disabled={busy}>{t(busy?'Yuklanmoqda...':'Saqlash va narxlarni qo‘llash')}</button></form>
 {saved&&<p role="status">{t('Saqlandi. Yangi narxlar katalogga qo‘llandi.')}</p>}
 <p>{t('Katalog ochilganda 15 daqiqada bir yangilanadi. To‘lov va yetkazish hali yoqilmagan.')}</p><button className="button secondary" disabled={busy} onClick={load}>{t('Yangilash')}</button>
 <p>{t('Mahsulotlar soni: {count}',{count:String(data.products?.length??0)})}</p>
 <div className="pricing-list">{data.products?.map(p=><article key={p.id}><b>{p.title}</b><small>{p.subtitle}</small><div>{t('Tannarx')}: ${p.supplierPriceUSD}</div><strong>{p.price.toLocaleString()} UZS</strong></article>)}</div></>}
 </main>;
}
