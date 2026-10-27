'use client';
import {useState} from 'react';
import {ArrowUpRight,BrainCircuit,ChevronRight,Diamond,KeyRound,Search,Send,ShoppingBag,Sparkles,Swords,X} from 'lucide-react';
import {useI18n} from '../language-provider';
import {homeServices,type HomeDestination} from '../../lib/home/services';
import {PromotionCarousel} from './promotion-carousel';
export const serviceIcons={shop:Diamond,marketplace:ShoppingBag,boost:Swords,rental:KeyRound,telegram:Send,coach:BrainCircuit};
export function HomePage({onNavigate}:{onNavigate:(target:HomeDestination)=>void}){
 const {t,language}=useI18n();const [search,setSearch]=useState('');
 const query=search.trim().toLocaleLowerCase(language);
 const services=homeServices.filter(item=>`${t(item.title)} ${t(item.description)} ${item.keywords}`.toLocaleLowerCase(language).includes(query));
 return <div className="v-home"><PromotionCarousel onNavigate={onNavigate}/>
 <label className="v-home-search"><Search size={19}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('Xizmat yoki bo‘lim qidirish...')} aria-label={t('Xizmat yoki bo‘lim qidirish...')} maxLength={100}/>{search&&<button type="button" aria-label={t('Qidiruvni tozalash')} onClick={()=>setSearch('')}><X size={17}/></button>}</label>
 <section className="v-home-services" aria-labelledby="v-services-title"><div className="v-section-heading"><div><span>{t('VAYNEXO XIZMATLARI')}</span><h2 id="v-services-title">{t('Bo‘limlar')}</h2></div><Sparkles size={20} aria-hidden="true"/></div>
 <div className="v-services-grid">{services.map(item=><button className={`v-service-card v-service-image-card ${item.tone}`} key={item.id} onClick={()=>onNavigate(item.id)}><div className={`v-service-art ${item.id}`}><img src={`/images/services/${item.id==='shop'?'mlbb':item.id}.webp`} alt="" aria-hidden="true" width={640} height={item.id==='shop'?640:427} loading="lazy" decoding="async"/></div><div className="v-service-copy"><h3>{t(item.title)}</h3><p>{t(item.description)}</p></div><ArrowUpRight className="v-service-arrow" size={16}/></button>)}</div>
 {!services.length&&<div className="v-home-empty" role="status"><Search size={26}/><h3>{t('Bo‘lim topilmadi')}</h3><p>{t('Boshqa so‘z bilan qidirib ko‘ring.')}</p><button className="button secondary" onClick={()=>setSearch('')}>{t('Qidiruvni tozalash')}<ChevronRight size={15}/></button></div>}
 </section></div>;
}
