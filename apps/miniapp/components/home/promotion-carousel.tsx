'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Bot,ChevronLeft,ChevronRight,Diamond,Pause,Play,Send,Sparkles} from 'lucide-react';
import {useI18n} from '../language-provider';
import {homeBanners,type HomeDestination} from '../../lib/home/services';
export function PromotionCarousel({onNavigate}:{onNavigate:(target:HomeDestination)=>void}){
 const {t}=useI18n();
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[hovered,setHovered]=useState(false),[focused,setFocused]=useState(false);
 const touch=useRef<number|null>(null);
 const stopped=paused||hovered||focused;
 useEffect(()=>{
  if(stopped)return;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const timer=setInterval(()=>{if(!document.hidden&&!media.matches)setIndex(i=>(i+1)%homeBanners.length);},5000);
  return()=>clearInterval(timer);
 },[stopped]);
 const move=(delta:number)=>setIndex(i=>(i+delta+homeBanners.length)%homeBanners.length);
 return <section className="v-promotion" aria-roledescription={t('Karusel')} aria-label={t('VAYNEXO takliflari')} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setFocused(false);}} onTouchStart={e=>{touch.current=e.touches[0].clientX;}} onTouchEnd={e=>{if(touch.current!==null){const delta=e.changedTouches[0].clientX-touch.current;if(Math.abs(delta)>45)move(delta>0?-1:1);touch.current=null;}}}>
 <div className="v-promotion-stage">{homeBanners.map((banner,i)=>{const Icon=banner.id==='mlbb'?Diamond:banner.id==='telegram'?Send:Bot;return <article key={banner.id} className={`v-promotion-slide ${banner.tone} ${i===index?'active':''}`} aria-hidden={i!==index} inert={i!==index}>
 <div className="v-promotion-grid" aria-hidden="true"/>{banner.id==='mlbb'&&<div className="v-promotion-photo" aria-hidden="true"/>}
 <div className="v-promotion-copy"><span className="v-promotion-badge"><span/>{t(banner.badge)}</span><h2>{t(banner.title)}</h2><p>{t(banner.description)}</p><button className="v-promotion-action" onClick={()=>onNavigate(banner.destination)}>{t(banner.action)}<ArrowRight size={15}/></button></div>
 <div className="v-promotion-art" aria-hidden="true"><div className="v-art-ring ring-one"/><div className="v-art-ring ring-two"/><div className="v-art-icon"><Icon strokeWidth={1.15}/></div><Sparkles className="v-art-spark" size={18}/><span className="v-art-caption">VAYNEXO</span></div>
 </article>;})}</div>
 <div className="v-promotion-controls"><div className="v-promotion-dots">{homeBanners.map((b,i)=><button key={b.id} className={i===index?'active':''} aria-label={t('Banner {number}',{number:String(i+1)})} aria-current={i===index?'true':undefined} onClick={()=>setIndex(i)}/>)}</div><div className="v-promotion-arrows"><button aria-label={t('Oldingi banner')} onClick={()=>move(-1)}><ChevronLeft size={15}/></button><button aria-label={t(paused?'Bannerlarni davom ettirish':'Bannerlarni to‘xtatish')} onClick={()=>setPaused(v=>!v)}>{paused?<Play size={12}/>:<Pause size={12}/>}</button><button aria-label={t('Keyingi banner')} onClick={()=>move(1)}><ChevronRight size={15}/></button></div></div>
 </section>;
}
