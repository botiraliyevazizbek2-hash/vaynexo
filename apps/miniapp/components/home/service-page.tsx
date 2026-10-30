'use client';
import {MarketplacePage} from '../marketplace/marketplace-page';
import {ArrowLeft,Clock3} from 'lucide-react';
import {useI18n} from '../language-provider';
import {homeServices,type PendingService} from '../../lib/home/services';
import {serviceIcons} from './home-page';
export function ServicePage({service,onBack}:{service:PendingService;onBack:()=>void}){
 const {t}=useI18n();const item=homeServices.find(s=>s.id===service)!;const Icon=serviceIcons[service];
 if(service==='marketplace')return <MarketplacePage onBack={onBack}/>;
 return <div className="v-service-page"><button className="v-back" onClick={onBack}><ArrowLeft size={17}/>{t('Bo‘limlarga qaytish')}</button><section className={`v-service-detail ${item.tone}`}><div className="v-service-icon"><Icon size={38}/></div><span className="v-service-status"><Clock3 size={13}/>{t('Tez kunda')}</span><h2>{t(item.title)}</h2><p>{t(item.description)}</p><div className="v-service-preparing">{t('Ushbu xizmat tayyorlanmoqda. Ishga tushganda shu yerda foydalanishingiz mumkin.')}</div>{service==='telegram'&&<div className="v-telegram-options"><span>Telegram Stars</span><span>Telegram Premium</span></div>}</section></div>;
}
