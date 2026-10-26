'use client';
import {useEffect,useState} from 'react';
export type TelegramAccount={telegramId:number;firstName:string;lastName:string;username:string|null;photoUrl?:string|null};
export function useTelegramAccount(){
 const [blobPhoto,setBlobPhoto]=useState<string|null>(null),[fallback,setFallback]=useState(false);
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
 const directPhoto=user?.photoUrl??null;
 useEffect(()=>{
  if(!user||directPhoto&&!fallback)return;
  const initData=(window as Window&{Telegram?:{WebApp?:{initData?:string}}}).Telegram?.WebApp?.initData;
  if(!initData)return;
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),20000);let stopped=false,url:string|null=null;
  setBlobPhoto(null);
  fetch('/api/account/photo',{method:'POST',headers:{'X-Telegram-Init-Data':initData},signal:abort.signal})
   .then(async r=>{if(!r.ok||r.status===204)return;const blob=await r.blob();if(stopped||!blob.type.startsWith('image/'))return;url=URL.createObjectURL(blob);setBlobPhoto(url);})
   .catch(()=>{}).finally(()=>clearTimeout(timer));
  return()=>{stopped=true;clearTimeout(timer);abort.abort();if(url)URL.revokeObjectURL(url);};
 },[user?.telegramId,directPhoto,fallback]);
 return {user,status,photoUrl:!fallback&&directPhoto?directPhoto:blobPhoto,onPhotoError:()=>{if(directPhoto&&!fallback)setFallback(true);else setBlobPhoto(null);},retry:()=>retry(v=>v+1)};
}
export type AccountState=ReturnType<typeof useTelegramAccount>;
