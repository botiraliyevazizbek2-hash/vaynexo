'use client';
import {useEffect,useRef,useState} from 'react';
import {Send,LoaderCircle} from 'lucide-react';
import {useI18n} from '../language-provider';
type Message={role:'user'|'assistant';content:string};
export function AIChat(){
 const {t,language}=useI18n();const [messages,setMessages]=useState<Message[]>([]),[draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const end=useRef<HTMLDivElement>(null),running=useRef(false),abort=useRef<AbortController|null>(null),stopped=useRef(false);
 useEffect(()=>{stopped.current=false;return()=>{stopped.current=true;abort.current?.abort();};},[]);
 useEffect(()=>{end.current?.scrollIntoView({behavior:'smooth',block:'nearest'});},[messages,busy,error]);
 async function send(){
  const content=draft.trim();if(!content||running.current)return;
  const initData=(window as Window&{Telegram?:{WebApp?:{initData?:string}}}).Telegram?.WebApp?.initData;
  if(!initData){setError('Chatdan foydalanish uchun ilovani Telegram ichida oching.');return;}
  const history=[...messages,{role:'user' as const,content}].slice(-19);
  while(history.length&&history[0].role!=='user')history.shift();
  while(history.reduce((n,m)=>n+m.content.length,0)>16000&&history.length>1)history.splice(0,2);
  running.current=true;setBusy(true);setError('');setDraft('');setMessages(history);
  abort.current=new AbortController();
  try{const r=await fetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json','X-Telegram-Init-Data':initData},body:JSON.stringify({messages:history,language}),signal:abort.current.signal});const d=await r.json();if(!r.ok||typeof d.text!=='string')throw Error(d.error??'unavailable');if(!stopped.current)setMessages([...history,{role:'assistant',content:d.text}]);}
  catch(e){if(!stopped.current){const code=e instanceof Error?e.message:'';setMessages(messages);setDraft(content);setError(code==='unauthorized'?'Ilovani yopib, Telegram bot orqali qayta oching.':code==='rate_limited'?'Biroz kutib, qayta urinib ko‘ring.':'AI hozir javob bera olmadi. Birozdan keyin qayta urinib ko‘ring.');}}
  finally{running.current=false;if(!stopped.current)setBusy(false);}
 }
 return <section className="v-ai-chat" aria-label={t('AI chati')}><div className="v-ai-messages" role="log" aria-live="polite">{messages.length?messages.map((m,i)=><div key={i} className={'v-ai-message '+m.role}><p>{m.content}</p></div>):<p className="v-ai-greeting">{t('Salom! Sizga qanday yordam bera olaman?')}</p>}{busy&&<div className="v-ai-message assistant" role="status"><LoaderCircle size={16} className="v-ai-spinner"/>{t('Javob yozilmoqda...')}</div>}{error&&<p className="v-ai-error" role="alert">{t(error)}</p>}<div ref={end}/></div><form className="v-ai-composer" onSubmit={e=>{e.preventDefault();void send();}}><textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder={t('Xabar yozing...')} aria-label={t('Xabar yozing...')} rows={2} maxLength={2000} disabled={busy} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send();}}}/><button disabled={busy||!draft.trim()} type="submit" aria-label={t('Yuborish')}>{busy?<LoaderCircle size={19} className="v-ai-spinner"/>:<Send size={19}/>}</button></form></section>;
}
