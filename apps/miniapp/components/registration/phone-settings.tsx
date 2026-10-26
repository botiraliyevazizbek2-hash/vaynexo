'use client';
import {useEffect,useRef,useState} from 'react';
import {Phone} from 'lucide-react';
import {useI18n} from '../language-provider';
type TelegramApp={initData?:string;requestContact?:(callback:(shared:boolean)=>void)=>void};
function telegram(){return (window as Window&{Telegram?:{WebApp?:TelegramApp}}).Telegram?.WebApp;}
export function PhoneSettings({available}:{available:boolean}){
 const {t}=useI18n();const [phone,setPhone]=useState<string|null>(null),[open,setOpen]=useState(false),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),stopped=useRef(false),generation=useRef(0);
 async function call(action:'status'|'begin'|'cancel'){
  const r=await fetch('/api/registration',{method:'POST',headers:{'Content-Type':'application/json','X-Telegram-Init-Data':telegram()?.initData??''},body:JSON.stringify({action,...(action==='begin'?{consent:true}:{})}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error(r.status===429?'Ko‘p urinish bo‘ldi. 30 soniyadan keyin qayta urinib ko‘ring.':'Tasdiqlash xizmati bilan bog‘lanib bo‘lmadi. Qayta urinib ko‘ring.');return r.json();
 }
 useEffect(()=>{
  stopped.current=false;
  if(available&&telegram()?.initData)void call('status').then(d=>{if(!stopped.current&&d.registered)setPhone(d.maskedPhone);}).catch(()=>{});
  return()=>{stopped.current=true;generation.current++;if(timer.current)clearTimeout(timer.current);};
 },[available]);
 function close(){generation.current++;if(timer.current)clearTimeout(timer.current);setBusy(false);setOpen(false);setConsent(false);setError('');void call('cancel').catch(()=>{});}
 async function share(){
  if(!consent||busy)return;
  const tg=telegram();
  if(!tg?.initData){setError('Raqamingizni xavfsiz ulash uchun ilovani Telegram bot ichida oching.');return;}
  if(!available){setError('Telefon orqali ro‘yxatdan o‘tish tayyorlanmoqda. Xizmat hali faollashtirilmagan.');return;}
  if(!tg.requestContact){setError('Telegramni yangilab, ilovani qayta oching. Kontakt ulashish bu qurilmada ishlamayapti.');return;}
  const attempt=++generation.current;setBusy(true);setError('');
  const active=()=>!stopped.current&&generation.current===attempt;
  function fail(message:string){if(active()){setBusy(false);setError(message);generation.current++;}}
  try{
   const d=await call('begin');if(!active())return;
   if(d.registered){setPhone(d.maskedPhone);setOpen(false);setBusy(false);return;}
   const deadline=Date.now()+90000;
   async function poll(){
    if(!active())return;
    if(Date.now()>deadline){fail('Tasdiq kelmadi. Qayta urinib ko‘ring.');return;}
    try{const d=await call('status');if(!active())return;if(d.registered){setPhone(d.maskedPhone);setBusy(false);setOpen(false);return;}}catch{}
    if(active())timer.current=setTimeout(poll,2000);
   }
   tg.requestContact(shared=>{if(!shared&&active()){fail('Raqam ulashilmadi. Keyinroq profil orqali qo‘shishingiz mumkin.');void call('cancel').catch(()=>{});}});
   if(active())timer.current=setTimeout(poll,1000);
  }catch(e){fail(e instanceof Error?e.message:'Tasdiq kelmadi. Qayta urinib ko‘ring.');}
 }
 return <section className="optional-phone settings-card" aria-label={t('Telefon raqami')}><div className="setting-row"><div className="setting-icon"><Phone size={18}/></div><div className="setting-copy"><b>{t('Telefon raqami')}</b><small>{phone??t('Ixtiyoriy — keyinroq qo‘shishingiz mumkin.')}</small></div>{!phone&&<button className="button secondary small" onClick={()=>open?close():setOpen(true)}>{t('Raqam qo‘shish')}</button>}</div>
 {open&&!phone&&<div className="phone-link-form"><label className="shop-confirm"><input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/><span>{t('Raqamimni ro‘yxatdan o‘tish va profilimga bog‘lash uchun saqlashga roziman.')}</span></label><button className="button primary full" disabled={!consent||busy} onClick={share}>{t(busy?'Telegram tasdig‘i kutilmoqda...':'Telegram raqamimni ulashish')}</button><button className="button secondary full" onClick={close}>{t('Keyinroq')}</button>{error&&<p className="field-error" role="alert">{t(error)}</p>}<small>{t('Raqamingiz ochiq katalogda ko‘rsatilmaydi. Uni brauzer xotirasiga yozmaymiz.')}</small></div>}
 </section>;
}
