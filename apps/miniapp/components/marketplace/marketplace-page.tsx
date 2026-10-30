'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {ArrowLeft,Plus,ShoppingBag,ShieldCheck,ImagePlus,X,CheckCircle2} from 'lucide-react';
import './marketplace.css';

type Listing={id:string;title:string;description:string;rank:string;skins:number;price:number;photo:string;status:'active'|'reserved'|'sold'};
type Order={id:string;listingId:string;title:string;price:number;status:'awaiting_handover'|'completed';createdAt:string};
type Market={version:1;listings:Listing[];orders:Order[]};
const KEY='vaynexo-marketplace-demo-v1';
const empty:Market={version:1,listings:[],orders:[]};
const money=(n:number)=>new Intl.NumberFormat('uz-UZ').format(n)+' so‘m';
function validMarket(value:unknown):value is Market{
 if(!value||typeof value!=='object')return false;
 const v=value as Market;
 return v.version===1&&Array.isArray(v.listings)&&v.listings.length<=50&&Array.isArray(v.orders)&&v.orders.length<=100&&v.listings.every(x=>x&&typeof x.id==='string'&&typeof x.title==='string'&&typeof x.description==='string'&&typeof x.rank==='string'&&Number.isSafeInteger(x.price)&&x.price>0&&Number.isSafeInteger(x.skins)&&typeof x.photo==='string'&&(!x.photo||/^data:image\/(jpeg|png|webp);base64,/.test(x.photo))&&['active','reserved','sold'].includes(x.status))&&v.orders.every(x=>x&&typeof x.id==='string'&&typeof x.listingId==='string'&&typeof x.title==='string'&&Number.isSafeInteger(x.price)&&typeof x.createdAt==='string'&&['awaiting_handover','completed'].includes(x.status));
}
export function MarketplacePage({onBack}:{onBack:()=>void}){
 const editorRef=useRef<HTMLDivElement>(null);
 const [market,setMarket]=useState<Market>(empty),[ready,setReady]=useState(false),[view,setView]=useState<'listings'|'orders'>('listings');
 const [creating,setCreating]=useState(false),[selected,setSelected]=useState<string|null>(null),[confirm,setConfirm]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[photo,setPhoto]=useState(''),[reading,setReading]=useState(false);
 useEffect(()=>{try{const saved=localStorage.getItem(KEY);if(saved){const parsed=JSON.parse(saved);if(validMarket(parsed))setMarket(parsed);else setError('Saqlangan sinov ma’lumotlarini o‘qib bo‘lmadi.');}}catch{setError('Qurilmadagi xotira ochilmadi. Saqlashga ruxsatni tekshiring.');}setReady(true);},[]);
 const save=(next:Market)=>{try{localStorage.setItem(KEY,JSON.stringify(next));setMarket(next);setError('');return true;}catch{setError('Saqlash uchun joy yetmadi yoki xotira bloklangan. Kichikroq rasm tanlang.');return false;}};
 useEffect(()=>{if(creating||selected)editorRef.current?.scrollIntoView({behavior:'smooth',block:'start'});},[creating,selected]);
 const listing=market.listings.find(x=>x.id===selected);
 const close=()=>{setCreating(false);setSelected(null);setConfirm(false);setError('');};
 function create(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!ready||reading)return;
  if(market.listings.length>=50){setError('Sinovda ko‘pi bilan 50 ta e’lon saqlanadi.');return;}
  const form=new FormData(e.currentTarget),title=String(form.get('title')||'').trim(),description=String(form.get('description')||'').trim(),price=Number(form.get('price')),skins=Number(form.get('skins'));
  if(title.length<5||description.length<10||!Number.isSafeInteger(price)||price<1000||price>1000000000||!Number.isSafeInteger(skins)||skins<0||skins>5000){setError('Sarlavha, tavsif, narx va skinlar sonini tekshiring.');return;}
  const entry:Listing={id:crypto.randomUUID(),title,description,price,skins,rank:String(form.get('rank')),photo,status:'active'};
  if(save({...market,listings:[entry,...market.listings]})){setCreating(false);setPhoto('');setView('listings');setNotice('E’lon joylandi. Endi uni ochib sinov xaridini bajaring.');}
 }
 async function pickPhoto(file:File|undefined){
  if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>1500000){setError('JPG, PNG yoki WebP rasm tanlang, hajmi 1,5 MB dan kichik bo‘lsin.');return;}
  setReading(true);setError('');
  try{const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(file);});setPhoto(data);}catch{setError('Rasmni o‘qib bo‘lmadi. Boshqa rasm tanlang.');}finally{setReading(false);}
 }
 function buy(){
  if(!listing||listing.status!=='active')return;
  if(market.orders.length>=100){setError('Sinov buyurtmalari limiti to‘ldi.');return;}
  const order:Order={id:crypto.randomUUID(),listingId:listing.id,title:listing.title,price:listing.price,status:'awaiting_handover',createdAt:new Date().toISOString()};
  if(save({...market,listings:market.listings.map(x=>x.id===listing.id?{...x,status:'reserved'}:x),orders:[order,...market.orders]})){setSelected(null);setConfirm(false);setView('orders');setNotice('Sinov xaridi yaratildi. Haqiqiy pul olinmadi. Endi qabul qilishni sinab ko‘ring.');}
 }
 function accept(order:Order){
  if(order.status!=='awaiting_handover')return;
  if(save({...market,orders:market.orders.map(x=>x.id===order.id?{...x,status:'completed'}:x),listings:market.listings.map(x=>x.id===order.listingId?{...x,status:'sold'}:x)}))setNotice('Sinov yakunlandi: akkaunt qabul qilindi, e’lon sotilgan deb belgilandi. Pul o‘tkazilmadi.');
 }
 return <div className="vx-market">
  <button className="v-back" onClick={onBack}><ArrowLeft size={17}/>Bo‘limlarga qaytish</button>
  <div className="vx-market-heading"><div><span className="eyebrow">VAYNEXO MARKET</span><h2>Akkaunt savdosi</h2></div><button className="button primary" disabled={!ready} onClick={()=>{close();setPhoto('');setNotice('');setCreating(true);}}><Plus size={18}/>E’lon yaratish</button></div>
  <div className="vx-market-demo"><ShieldCheck size={21}/><div><b>Sinov rejimi — haqiqiy pul yechilmaydi</b><p>E’lon va buyurtmalar faqat shu qurilmada saqlanadi. O‘z e’loningizni sotib olib tekshirishingiz mumkin. Bu haqiqiy escrow emas.</p></div></div>
  <div className="vx-market-tabs"><button aria-pressed={view==='listings'} onClick={()=>setView('listings')}>E’lonlar ({market.listings.length})</button><button aria-pressed={view==='orders'} onClick={()=>setView('orders')}>Sinov xaridlarim ({market.orders.length})</button></div>
  {notice&&<p className="vx-market-notice" role="status">{notice}</p>}
  {error&&<p role="alert" className="vx-market-error">{error}</p>}
  {!ready?<p role="status">Yuklanmoqda…</p>:view==='listings'?<>
   {!market.listings.length&&<div className="vx-market-empty"><ShoppingBag size={35}/><h3>Hali e’lon yo‘q</h3><p>“E’lon yaratish” orqali o‘z akkauntingizni qo‘shing.</p></div>}
   <div className="vx-market-grid">{market.listings.map(x=><article className="vx-market-card" key={x.id}>{x.photo?<img className="vx-market-cover" src={x.photo} alt={x.title}/>:<div className="vx-market-cover vx-market-placeholder"><ShoppingBag size={42}/><span>MOBILE LEGENDS</span></div>}<div className="vx-market-card-body"><span className={`vx-market-status ${x.status}`}>{x.status==='active'?'Sotuvda':x.status==='reserved'?'Sinov xaridi kutilmoqda':'Sotilgan'}</span><h3>{x.title}</h3><p>{x.rank} · {x.skins} ta skin</p><strong>{money(x.price)}</strong><button className="button secondary" onClick={()=>{setSelected(x.id);setConfirm(false);setError('');}}>E’lonni ko‘rish</button></div></article>)}</div>
  </>:<div className="vx-market-orders">{!market.orders.length&&<div className="vx-market-empty"><ShoppingBag size={35}/><h3>Sinov xaridlari yo‘q</h3><p>Avval e’lon yarating va “Sinov uchun sotib olish”ni bosing.</p></div>}{market.orders.map(o=><article className="vx-market-order" key={o.id}><span className="vx-market-status">{o.status==='completed'?'Sinov tugallandi':'Qabul qilish kutilmoqda'}</span><h3>{o.title}</h3><p>Buyurtma #{o.id.slice(0,8)} · {new Date(o.createdAt).toLocaleDateString('uz-UZ')}</p><strong>{money(o.price)}</strong><p>To‘lov: sinov · haqiqiy pul olinmagan</p>{o.status==='awaiting_handover'?<><p>Bu bosqichda haqiqiy akkaunt topshirilmaydi. Tugma qabul qilish jarayonini sinaydi.</p><button className="button primary" onClick={()=>accept(o)}><CheckCircle2 size={17}/>Sinovda qabul qildim</button></>:<p><CheckCircle2 size={17}/> Akkauntni qabul qilish sinovi muvaffaqiyatli.</p>}</article>)}</div>}
  {creating&&<div className="vx-market-editor" ref={editorRef}><div className="vx-market-heading"><h3>Yangi e’lon</h3><button className="icon-button" aria-label="E’lon formasini yopish" onClick={close}><X size={20}/></button></div><form onSubmit={create}>
   <label>Sarlavha<input name="title" required minLength={5} maxLength={90} placeholder="Masalan: Mythic akkaunt, 150 ta skin"/></label>
   <div className="vx-market-fields"><label>Rank<select name="rank" defaultValue="Mythic">{['Warrior','Elite','Master','Grandmaster','Epic','Legend','Mythic','Mythical Honor','Mythical Glory','Mythical Immortal'].map(rank=><option key={rank}>{rank}</option>)}</select></label><label>Skinlar soni<input name="skins" type="number" min={0} max={5000} defaultValue={0} required/></label></div>
   <label>Narx (so‘m)<input name="price" type="number" required min={1000} max={1000000000} step={1} placeholder="250000"/></label>
   <label>Tavsif<textarea name="description" required minLength={10} maxLength={2000} rows={4} placeholder="Qahramonlar, skinlar va akkaunt haqida yozing. Parol yoki tasdiqlash kodini kiritmang."/></label>
   <label className="vx-market-upload"><span><ImagePlus size={18}/> Rasm (ixtiyoriy, 1,5 MB gacha)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>void pickPhoto(e.target.files?.[0])}/></label>{photo&&<img className="vx-market-preview" src={photo} alt="E’lon rasmi oldindan ko‘rinishi"/>}
   <p>Parol, Google login yoki SMS kod so‘ralmaydi.</p><div className="vx-market-actions"><button type="button" className="button secondary" onClick={close}>Bekor qilish</button><button className="button primary" disabled={reading}>{reading?'Rasm yuklanmoqda…':'Sinov e’lonini joylash'}</button></div>
  </form></div>}
  {listing&&<div className="vx-market-editor" ref={editorRef}><div className="vx-market-heading"><h3>{confirm?'Sinov xaridini tasdiqlash':listing.title}</h3><button className="icon-button" aria-label="E’lonni yopish" onClick={close}><X size={20}/></button></div>{listing.photo&&<img className="vx-market-preview" src={listing.photo} alt={listing.title}/>}<p>{listing.rank} · {listing.skins} ta skin</p><p className="vx-market-description">{listing.description}</p><h3>{money(listing.price)}</h3>{confirm?<><p>Bu sinov xaridi. Kartangizdan pul yechilmaydi va sotuvchiga to‘lov yuborilmaydi.</p><div className="vx-market-actions"><button className="button secondary" onClick={()=>setConfirm(false)}>Orqaga</button><button className="button primary" onClick={buy}>Sinov xaridini tasdiqlash</button></div></>:listing.status==='active'?<button className="button primary" onClick={()=>setConfirm(true)}>Sinov uchun sotib olish</button>:<p>{listing.status==='reserved'?'Xarid yaratildi. “Sinov xaridlarim” bo‘limida davom eting.':'Bu e’lon sotilgan.'}</p>}</div>}
 </div>;
}
