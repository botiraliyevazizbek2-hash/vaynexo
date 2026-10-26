'use client';
import {ArrowLeft,ArrowRight,Clock3} from 'lucide-react';
import {useI18n} from '../language-provider';
import {homeServices,type PendingService} from '../../lib/home/services';
import {serviceIcons} from './home-page';
export function ServicePage({service,onBack,onShop}:{service:PendingService;onBack:()=>void;onShop:()=>void}){
 const {t}=useI18n();const item=homeServices.find(s=>s.id===service)!;const Icon=serviceIcons[service];
 return <div className="v-service-page"><button className="v-back" onClick={onBack}><ArrowLeft size={17}/>{t('Bo‘limlarga qaytish')}</button><section className={`v-service-detail ${item.tone}`}><div className="v-service-icon"><Icon size={38}/></div><span className="v-service-status"><Clock3 size={13}/>{t('Tez kunda')}</span><h2>{t(item.title)}</h2><p>{t(item.description)}</p><div className="v-service-preparing">{t('Ushbu xizmat tayyorlanmoqda. Ishga tushganda shu yerda foydalanishingiz mumkin.')}</div>{service==='telegram'&&<div className="v-telegram-options"><span>Telegram Stars</span><span>Telegram Premium</span></div>}<button className="button primary" onClick={onShop}>{t('Mobile Legends do‘koni')}<ArrowRight size={15}/></button></section></div>;
}
