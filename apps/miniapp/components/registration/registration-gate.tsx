'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, Phone, ShieldCheck } from 'lucide-react';
import { useI18n } from '../language-provider';
import type { Language } from '../../lib/i18n/core';
type TelegramApp={initData?:string;requestContact?:(callback:(shared:boolean)=>void)=>void;ready?:()=>void;expand?:()=>void};
function telegram(){return (window as Window&{Telegram?:{WebApp?:TelegramApp}}).Telegram?.WebApp;}
type Status='checking'|'waiting'|'ready'|'registered'|'browser'|'unsupported'|'setup'|'error';
export function RegistrationGate({children,required,available}:{children:ReactNode;required:boolean;available:boolean}) {
 const {t,language,setLanguage}=useI18n();
 const [status,setStatus]=useState<Status>('checking');
 const [consent,setConsent]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [polling,setPolling]=useState(false);
 const stopped=useRef(false);
 const waitingUntil=useRef(0);
 const requesting=useRef(false);
 useEffect(()=>{
  if(!required)return;
  stopped.current=false;
  const tg=telegram();tg?.ready?.();tg?.expand?.();
  if(!available){setStatus('setup');return;}
  if(!tg?.initData){setStatus('browser');return;}
  void refresh();
  return()=>{stopped.current=true;};
 },[required,available]);
 useEffect(()=>{
  if(!polling)return;
  let cancelled=false,timer:ReturnType<typeof setTimeout>;
  async function poll(){
   if(cancelled)return;
   if(Date.now()>waitingUntil.current){setPolling(false);setBusy(false);setStatus('ready');setError('Tasdiq kelmadi. Qayta urinib ko‘ring.');return;}
   await refresh();if(!cancelled)timer=setTimeout(poll,2500);
  }
  timer=setTimeout(poll,1000);
  return()=>{cancelled=true;clearTimeout(timer);};
 },[polling]);
 async function call(action:'status'|'begin'|'cancel') {
  const response=await fetch('/api/registration',{method:'POST',headers:{'Content-Type':'application/json','X-Telegram-Init-Data':telegram()?.initData??''},body:JSON.stringify({action,...(action==='begin'?{consent:true}:{})}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error(response.status===429?'Ko‘p urinish bo‘ldi. 30 soniyadan keyin qayta urinib ko‘ring.':'Tasdiqlash xizmati bilan bog‘lanib bo‘lmadi. Qayta urinib ko‘ring.');
  return response.json();
 }
 async function refresh() {
  try{const data=await call('status');if(stopped.current)return;
   if(data.registered===true){setStatus('registered');setPolling(false);setBusy(false);}
   else if(!requesting.current&&!polling)setStatus('ready');
  }catch{if(!stopped.current&&!requesting.current&&!polling)setStatus('error');}
 }
 async function requestPhone() {
  if(!consent||requesting.current)return;
  const tg=telegram();
  if(!tg?.requestContact){setStatus('unsupported');return;}
  requesting.current=true;setBusy(true);setError('');
  try {
   const data=await call('begin');
   if(data.registered===true){await refresh();return;}
   setStatus('waiting');waitingUntil.current=Date.now()+90000;setPolling(true);
   tg.requestContact(shared=>{
    if(!shared){setPolling(false);setStatus('ready');setBusy(false);setError('Raqam ulashilmadi. Davom etish uchun o‘z raqamingizni ulashing.');void call('cancel').catch(()=>{});}
    // The callback is not proof of registration. Only the authenticated server status opens the app.
   });
  }catch(e){setPolling(false);setStatus('ready');setBusy(false);setError(e instanceof Error?e.message:'Tasdiq kelmadi. Qayta urinib ko‘ring.');}
  finally{requesting.current=false;}
 }
 if(!required)return <>{children}</>;
 if(status==='registered')return <>{children}</>;
 return <main className="registration-shell"><section className="registration-card"><div className="registration-top"><span>VAYNEXO</span><select aria-label={t('Ilova tili')} value={language} onChange={e=>setLanguage(e.target.value as Language)}><option value="uz">UZ</option><option value="ru">RU</option><option value="en">EN</option></select></div><div className="registration-icon"><Phone size={30}/></div><h1>{t('Telefon raqami bilan ro‘yxatdan o‘tish')}</h1><p>{t('Ilovaga kirish uchun Telegram hisobingizga ulangan raqamni ulashing.')}</p><div className="registration-steps"><span><ShieldCheck size={18}/>{t('Alohida SMS-kod kerak emas.')}</span><span><CheckCircle2 size={18}/>{t('Faqat o‘zingizga tegishli Telegram kontakti qabul qilinadi.')}</span></div>
 {status==='checking'?<p role="status">{t('Ro‘yxatdan o‘tish holati tekshirilmoqda...')}</p>:status==='setup'?<div role="status" className="disclaimer">{t('Telefon orqali ro‘yxatdan o‘tish tayyorlanmoqda. Xizmat hali faollashtirilmagan.')}</div>:status==='browser'?<><p className="disclaimer">{t('Raqamingizni xavfsiz ulash uchun ilovani Telegram bot ichida oching.')}</p><a className="button primary full" href="https://t.me/VaynexoBot">{t('Telegram botni ochish')}</a></>:status==='unsupported'?<p className="disclaimer">{t('Telegramni yangilab, ilovani qayta oching. Kontakt ulashish bu qurilmada ishlamayapti.')}</p>:status==='error'?<><p role="alert" className="field-error">{t('Tasdiqlash xizmati bilan bog‘lanib bo‘lmadi. Qayta urinib ko‘ring.')}</p><button className="button secondary full" onClick={()=>{setStatus('checking');void refresh();}}>{t('Qayta tekshirish')}</button></>:<><label className="shop-confirm"><input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/><span>{t('Raqamimni ro‘yxatdan o‘tish va profilimga bog‘lash uchun saqlashga roziman.')}</span></label><button className="button primary full" onClick={requestPhone} disabled={!consent||busy}>{t(status==='waiting'?'Telegram tasdig‘i kutilmoqda...':'Telegram raqamimni ulashish')}</button>{status==='waiting'&&<p role="status">{t('Telegram oynasida raqamni ulashishga ruxsat bering. Tasdiq kelgach ilova ochiladi.')}</p>}{error&&<p role="alert" className="field-error">{t(error)}</p>}</>}
 <small>{t('Raqamingiz ochiq katalogda ko‘rsatilmaydi. Uni brauzer xotirasiga yozmaymiz.')}</small></section></main>;
}
