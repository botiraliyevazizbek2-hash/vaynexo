'use client';
import {useEffect,useState} from 'react';
import {useI18n} from '../language-provider';
import {formatPrice,type Product} from '../../lib/shop/catalog';
export function LiveCatalog(){
 const {t}=useI18n();const [state,setState]=useState('loading'),[products,setProducts]=useState<Product[]>([]);
 useEffect(()=>{const abort=new AbortController();async function read(){try{const r=await fetch('/api/catalog',{signal:abort.signal});const d=await r.json();if(abort.signal.aborted)return;setState(r.ok?d.status:'unavailable');setProducts(r.ok?d.products:[]);}catch(e){if(!abort.signal.aborted){setState('unavailable');setProducts([]);}}}void read();const timer=setInterval(read,60000);return()=>{abort.abort();clearInterval(timer);};},[]);
 return <section className="live-catalog"><div className="eyebrow">RESELLCODES · MLBB</div><h3>{t('API katalogi')}</h3><p>{t('To‘lov va yetkazish hali yoqilmagan.')}</p>{state==='loading'?<p role="status">{t('Yuklanmoqda...')}</p>:state==='awaiting_pricing'?<p>{t('Admin ustama foizi va kursni belgilagach paketlar chiqadi.')}</p>:state!=='ready'?<p role="status">{t('Katalog vaqtincha mavjud emas. Keyinroq qayta urinib ko‘ring.')}</p>:<div className="catalog-grid">{products.map(p=><article className="api-product" key={p.id}><small>{p.subtitle}</small><h3>{p.title}</h3><strong>{formatPrice(p.price)}</strong></article>)}</div>}</section>;
}
