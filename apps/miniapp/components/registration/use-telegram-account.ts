'use client';
import {useEffect,useState} from 'react';
export type TelegramAccount={telegramId:number;firstName:string;lastName:string;username:string|null};
export function useTelegramAccount(){
 const [user,setUser]=useState<TelegramAccount|null>(null),[status,setStatus]=useState<'loading'|'ready'|'guest'|'error'>('loading'),[revision,retry]=useState(0);
 useEffect(()=>{
  const initData=(window as Window&{Telegram?:{WebApp?:{initData?:string}}}).Telegram?.WebApp?.initData;
  if(!initData){setStatus('guest');return;}
  const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),10000);let stopped=false;
  setStatus('loading');
  fetch('/api/account',{method:'POST',headers:{'X-Telegram-Init-Data':initData},signal:abort.signal})
   .then(async r=>{const d=await r.json();if(!r.ok||!Number.isSafeInteger(d.account?.telegramId)||typeof d.account.firstName!=='string')throw Error();if(!stopped){setUser(d.account);setStatus('ready');}})
   .catch(()=>{if(!stopped)setStatus('error');})
   .finally(()=>clearTimeout(timer));
  return()=>{stopped=true;clearTimeout(timer);abort.abort();};
 },[revision]);
 return {user,status,retry:()=>retry(v=>v+1)};
}
export type AccountState=ReturnType<typeof useTelegramAccount>;
