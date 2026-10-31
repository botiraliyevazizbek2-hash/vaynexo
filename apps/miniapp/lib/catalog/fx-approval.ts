import { catalogDatabase } from './database';
import { isCatalogAdmin } from './pricing';
import { sendMessage, telegramCall } from '../telegram/bot';

export type FxAction='approve'|'reject';
export function parseFxCallback(value:string|undefined):{action:FxAction;id:number}|null {
 const m=/^fx:(approve|reject):([1-9]\d{0,14})$/.exec(value??'');
 if(!m)return null;
 const id=Number(m[2]);return Number.isSafeInteger(id)?{action:m[1] as FxAction,id}:null;
}

export async function fetchOfficialRates() {
 const result=await fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/',{cache:'no-store',signal:AbortSignal.timeout(10000)});
 if(!result.ok)throw Error('Central Bank unavailable');
 const data=await result.json();
 if(!Array.isArray(data))throw Error('Bad rate response');
 function rate(code:string){
  const row=data.find((x:unknown)=>typeof x==='object'&&x!==null&&(x as {Ccy?:string}).Ccy===code);
  if(!row)throw Error('Missing '+code);
  const amount=Number(row.Rate),nominal=Number(row.Nominal);
  const value=amount/nominal;
  if(!Number.isFinite(value)||value<=0||!Number.isFinite(nominal)||nominal<=0||value>1000000)throw Error('Invalid '+code);
  return value.toFixed(4);
 }
 return {usd:rate('USD'),rub:rate('RUB')};
}

function adminIds(){return (process.env.ADMIN_TELEGRAM_IDS??'').split(/[\s,\[\]]+/).filter(x=>/^[1-9]\d*$/.test(x)&&Number.isSafeInteger(Number(x))).map(Number);}

export async function checkAndNotifyRate(){
 const ids=[...new Set(adminIds())];if(!ids.length)throw Error('ADMIN_TELEGRAM_IDS is required');
 const {usd,rub}=await fetchOfficialRates();
 const db=catalogDatabase();
 // One serialized checker at a time, avoiding duplicate pending proposals.
 const client=await db.connect();
 let proposal:{id:string;usd_uzs:string;rub_uzs:string}|undefined;
 try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(61062710)');
  const settings=(await client.query('SELECT usd_uzs,rub_uzs,version FROM vaynexo_catalog_settings WHERE id=true')).rows[0];
  if(!settings)throw Error('Catalog migration missing');
  const pending=(await client.query("SELECT id,usd_uzs,rub_uzs FROM vaynexo_fx_proposals WHERE status='pending' ORDER BY id LIMIT 1")).rows[0];
  if(pending){proposal=pending;}
  else {
   const sameUsd=settings.usd_uzs!==null&&Math.abs(Number(settings.usd_uzs)-Number(usd))<0.0001;
   const sameRub=settings.rub_uzs!==null&&Math.abs(Number(settings.rub_uzs)-Number(rub))<0.0001;
   if(!sameUsd||!sameRub){
    proposal=(await client.query("INSERT INTO vaynexo_fx_proposals(usd_uzs,rub_uzs,pricing_version) VALUES($1,$2,$3) RETURNING id,usd_uzs,rub_uzs",[usd,rub,settings.version])).rows[0];
   }
  }
  await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 if(!proposal)return {ok:true,changed:false};
 const claimed=await db.query("UPDATE vaynexo_fx_proposals SET notified_at=now() WHERE id=$1 AND status='pending' AND (notified_at IS NULL OR notified_at<now()-interval '15 minutes') RETURNING id",[proposal.id]);
 if(!claimed.rows.length)return {ok:true,changed:false,pending:true};
 const reply={
  text:`<b>VAYNEXO · Kursni tasdiqlash</b>\n🇺🇸 1 USD = ${Number(proposal.usd_uzs).toFixed(4)} UZS\n🇷🇺 1 RUB = ${Number(proposal.rub_uzs).toFixed(4)} UZS\n\nTasdiqlansa olmoslarning UZS narxlari yangi USD kursiga moslanadi. Rad qilinsa eski narxlar qoladi.`,
  reply_markup:{inline_keyboard:[[{text:'✅ Tasdiqlash',callback_data:`fx:approve:${proposal.id}`},{text:'❌ Rad etish',callback_data:`fx:reject:${proposal.id}`}]]}
 };
 let delivered=0;
 for(const id of ids){try{await sendMessage(id,reply);delivered++;}catch{console.error('[fx] Admin notification failed');}}
 if(!delivered)await db.query('UPDATE vaynexo_fx_proposals SET notified_at=NULL WHERE id=$1 AND status=\'pending\'',[proposal.id]);
 return {ok:delivered>0,changed:true,delivered};
}

export async function handleFxCallback(adminId:number,callbackId:string,value:string){
 if(!isCatalogAdmin(adminId))return false;
 const parsed=parseFxCallback(value);if(!parsed)return false;
 const db=catalogDatabase(),client=await db.connect();
 let outcome='Bu taklif endi faol emas.';
 try{
  await client.query('BEGIN');
  const proposal=(await client.query('SELECT * FROM vaynexo_fx_proposals WHERE id=$1 FOR UPDATE',[parsed.id])).rows[0];
  if(proposal?.status==='pending'){
   if(parsed.action==='reject'){
    await client.query("UPDATE vaynexo_fx_proposals SET status='rejected',resolved_at=now(),resolved_by=$2 WHERE id=$1",[parsed.id,adminId]);
    outcome='❌ Kurs rad etildi. Narxlar o‘zgarmadi.';
   }else{
    const updated=await client.query('UPDATE vaynexo_catalog_settings SET usd_uzs=$1,rub_uzs=$2,version=version+1,updated_by=$3,updated_at=now() WHERE id=true AND version=$4 RETURNING version',[proposal.usd_uzs,proposal.rub_uzs,adminId,proposal.pricing_version]);
    if(updated.rows.length){
     await client.query("UPDATE vaynexo_fx_proposals SET status='approved',resolved_at=now(),resolved_by=$2 WHERE id=$1",[parsed.id,adminId]);
     const setting=await client.query('SELECT markup_bps FROM vaynexo_catalog_settings WHERE id=true');
     if(setting.rows[0]?.markup_bps!==null&&setting.rows[0]?.markup_bps!==undefined){
      await client.query('INSERT INTO vaynexo_catalog_audit(telegram_id,markup_bps,usd_uzs,version) VALUES($1,$2,$3,$4)',[adminId,setting.rows[0].markup_bps,proposal.usd_uzs,updated.rows[0].version]);
     }
     await client.query('INSERT INTO vaynexo_fx_audit(proposal_id,admin_id,usd_uzs,rub_uzs) VALUES($1,$2,$3,$4)',[parsed.id,adminId,proposal.usd_uzs,proposal.rub_uzs]);
     outcome='✅ Kurs tasdiqlandi. Olmoslarning yangi UZS narxlari hisoblanadi.';
    }else{
     await client.query("UPDATE vaynexo_fx_proposals SET status='stale',resolved_at=now(),resolved_by=$2 WHERE id=$1",[parsed.id,adminId]);
     outcome='⚠️ Narx sozlamalari o‘zgargan. Yangidan kurs tekshiring.';
    }
   }
  }
  await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 await telegramCall('answerCallbackQuery',{callback_query_id:callbackId,text:outcome,show_alert:true});
 return true;
}
