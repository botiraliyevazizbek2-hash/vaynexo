'use client';
import {ArrowRight,Newspaper,Trophy} from 'lucide-react';
import {useI18n} from '../language-provider';
const ads={
 news:{title:'VAYNEXO yangiliklari',description:'Patchlar, tadbirlar va foydali qo‘llanmalar.',action:'Lentani ko‘rish',target:'news-feed',Icon:Newspaper},
 tournaments:{title:'VAYNEXO Arena',description:'Turnirlar va jamoalar uchun yagona bo‘lim.',action:'Bo‘limni ko‘rish',target:'arena-tabs',Icon:Trophy},
};
export function SectionAdvertisement({section}:{section:keyof typeof ads}){
 const {t}=useI18n();const ad=ads[section];
 return <aside className={'v-section-ad '+section} aria-label={t('Reklama')}><div className="v-section-ad-copy"><span>VAYNEXO · {t('Reklama')}</span><h2>{t(ad.title)}</h2><p>{t(ad.description)}</p><button onClick={()=>document.getElementById(ad.target)?.scrollIntoView({behavior:'smooth',block:'start'})}>{t(ad.action)}<ArrowRight size={13}/></button></div><div className="v-section-ad-art" aria-hidden="true"><ad.Icon size={40} strokeWidth={1.3}/></div></aside>;
}
