import { createResellcodesClient } from '../suppliers/resellcodes';
import { isMLBBCategory } from '../shop/regions';
import { sellingPrice } from './pricing';
export type Query=(sql:string,values?:unknown[])=>Promise<{rows:any[]}>;
type Category=Awaited<ReturnType<ReturnType<typeof createResellcodesClient>['getTopupOffers']>>;
export function catalogService(query:Query,client=()=>createResellcodesClient()) {
 async function refresh() {
  // A database lease prevents concurrent Vercel instances from flooding the provider.
  const claim=await query(`UPDATE vaynexo_catalog_cache SET lease_until=now()+interval '5 minutes' WHERE id=true AND lease_until<now() AND retry_after<now() AND (synced_at IS NULL OR synced_at<now()-interval '15 minutes') RETURNING id`);
  if(!claim.rows.length)return;
  try {
   const api=client();
   if(!(await api.getProfile()).active)throw Error('inactive');
   const cats=(await api.getTopupCategories()).filter(isMLBBCategory);
   if(!cats.length||cats.length>20)throw Error('invalid_catalog');
   const result:Category[]=[];
   for(const c of cats) result.push(await api.getTopupOffers(c.id));
   // Replace one snapshot, so removed offers disappear and partial failures never publish.
   await query(`UPDATE vaynexo_catalog_cache SET payload=$1::jsonb,synced_at=now(),retry_after=now(),lease_until='1970-01-01' WHERE id=true`,[JSON.stringify(result)]);
  }catch{
   await query(`UPDATE vaynexo_catalog_cache SET retry_after=now()+interval '2 minutes',lease_until='1970-01-01' WHERE id=true`);
  }
 }
 async function read(admin=false) {
  const settings=(await query('SELECT * FROM vaynexo_catalog_settings WHERE id=true')).rows[0];
  const cache=(await query('SELECT *, synced_at>now()-interval \'1 hour\' AS fresh FROM vaynexo_catalog_cache WHERE id=true')).rows[0];
  const configured=settings?.markup_bps!==null&&settings?.markup_bps!==undefined&&settings?.usd_uzs;
  const cats:Category[]=(cache?.payload??[]).filter(isMLBBCategory);
  const products=configured&&cache?.fresh?cats.flatMap(c=>c.offers.filter(o=>Number(o.supplierPriceUSD)>0).map(o=>({
   id:`rsc:${c.id}:${o.id}`,categoryId:c.id,categoryName:c.name,title:o.name,subtitle:c.name,diamonds:/pass|starlight/i.test(o.name)?'Pass':o.name,
   icon:/pass|starlight/i.test(o.name)?'ticket':'diamond', price:sellingPrice(o.supplierPriceUSD,settings.markup_bps,String(settings.usd_uzs)),supplier:'resellcodes',
   ...(admin?{supplierPriceUSD:o.supplierPriceUSD}:{}),
  }))):[];
  return {configured:!!configured,status:!configured?'awaiting_pricing':!cache?.fresh?'unavailable':'ready',syncedAt:cache?.synced_at??null,products,
   ...(admin?{settings:{markup:settings?.markup_bps===null?null:String(settings.markup_bps/100),rate:settings?.usd_uzs??null,version:settings?.version??0},categories:cats.map(c=>({name:c.name,count:c.offers.length,fields:c.fields,note:c.note}))}:{})};
 }
 async function save(adminId:number,markupBps:number,rate:string,version:number) {
  const r=await query(`WITH changed AS (UPDATE vaynexo_catalog_settings SET markup_bps=$1,usd_uzs=$2,version=version+1,updated_by=$3,updated_at=now() WHERE id=true AND version=$4 RETURNING *) INSERT INTO vaynexo_catalog_audit(telegram_id,markup_bps,usd_uzs,version) SELECT updated_by,markup_bps,usd_uzs,version FROM changed RETURNING version`,[markupBps,rate,adminId,version]);
  return !!r.rows.length;
 }
 return {refresh,read,save};
}
