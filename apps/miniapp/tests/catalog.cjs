const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {parsePricing,sellingPrice,isCatalogAdmin}=require('../lib/catalog/pricing.ts');
const {catalogService,selectedCatalogSupplier}=require('../lib/catalog/service.ts');
const {PGlite}=require('@electric-sql/pglite');
test('a stored Shop2Topup key never changes the catalogue supplier without explicit selection',()=>{
 const key=process.env.SHOP2TOPUP_API_KEY, selected=process.env.CATALOG_SUPPLIER;
 try {process.env.SHOP2TOPUP_API_KEY='some.secret';delete process.env.CATALOG_SUPPLIER;assert.equal(selectedCatalogSupplier(),'resellcodes');process.env.CATALOG_SUPPLIER='shop2topup';assert.equal(selectedCatalogSupplier(),'shop2topup');}
 finally {if(key===undefined)delete process.env.SHOP2TOPUP_API_KEY;else process.env.SHOP2TOPUP_API_KEY=key;if(selected===undefined)delete process.env.CATALOG_SUPPLIER;else process.env.CATALOG_SUPPLIER=selected;}
});
test('exact markup and FX conversion: zero markup, fractional percentages and upward rounding',()=>{
 assert.deepEqual(parsePricing('10.25','13000.1234'),{markupBps:1025,rate:'13000.1234'});
 assert.equal(sellingPrice('1.0000',1000,'13000'),14300);
 assert.equal(sellingPrice('0.9161',1000,'13000'),13101);
 assert.equal(sellingPrice('1.0000',0,'13000'),13000);
 assert.equal(sellingPrice('0.0001',0,'1'),1);
 for(const [m,r]of [['-1','13000'],['1e2','13000'],['1000.01','13000'],['10','0'],['10','Infinity'],['10','1.00001']])assert.throws(()=>parsePricing(m,r));
 assert.equal(isCatalogAdmin(42,'[42, 99]'),true);assert.equal(isCatalogAdmin(4,'42'),false);assert.equal(isCatalogAdmin(42,''),false);
});
test('Postgres catalog: pricing required, atomic snapshots, audited optimistic edits, TTL, removal and failure backoff',async()=>{
 const db=new PGlite();let calls=0,fail=false;
 let offers=[{id:'o1',name:'55 Diamonds',supplierPriceUSD:'0.9161'}];
 try{
 const migration=fs.readFileSync('migrations/miniapp/002_supplier_catalog.sql','utf8');await db.exec(migration);await db.exec(migration);
 const s=catalogService((q,v)=>db.query(q,v),()=>({getProfile:async()=>({active:true}),getTopupCategories:async()=>{calls++;return [{id:'mlbb',name:'Mobile Legends'}];},getTopupOffers:async()=>{if(fail)throw Error();return {id:'mlbb',name:'Global',fields:[],note:null,offers};}}));
 await s.refresh();assert.equal(calls,1);assert.equal((await s.read()).status,'awaiting_pricing');assert.deepEqual((await s.read()).products,[]);
 assert.equal(await s.save(42,1000,'13000',0),true);assert.equal(await s.save(99,2000,'13000',0),false);
 const catalog=await s.read();assert.equal(catalog.products[0].price,13101);assert.equal(catalog.products[0].supplierPriceUSD,undefined);assert.equal(catalog.settings,undefined);
 assert.equal((await s.read(true)).products[0].supplierPriceUSD,'0.9161');
 assert.equal((await db.query('SELECT * FROM vaynexo_catalog_audit')).rows.length,1);
 await s.refresh();assert.equal(calls,1);
 offers=[];await db.query("UPDATE vaynexo_catalog_cache SET synced_at=now()-interval '16 minutes'");await s.refresh();assert.deepEqual((await s.read()).products,[]);
 offers=[{id:'o2',name:'Pass',supplierPriceUSD:'1.0000'}];await db.query("UPDATE vaynexo_catalog_cache SET synced_at=now()-interval '16 minutes'");await s.refresh();assert.equal((await s.read()).products[0].id,'rsc:mlbb:o2');
 await db.query("UPDATE vaynexo_catalog_cache SET synced_at=now()-interval '2 hours'");fail=true;await s.refresh();const before=calls;await s.refresh();assert.equal(calls,before);assert.equal((await s.read()).status,'unavailable');assert.deepEqual((await s.read()).products,[]);
 }finally{await db.close();}
});
test('admin API rejects unsigned and non-admin Telegram requests before any DB work',async()=>{
 const {GET,POST}=require('../app/api/admin/pricing/route.ts');
 assert.equal((await GET(new Request('https://test'))).status,403);
 assert.equal((await POST(new Request('https://test',{method:'POST',body:'{}'}))).status,403);
});
test('signed admin request saves to Postgres and public route returns marked-up prices without costs',async()=>{
 const crypto=require('node:crypto'),db=new PGlite();
 const database=require('../lib/catalog/database.ts'),original=database.catalogDatabase;
 const oldToken=process.env.TELEGRAM_BOT_TOKEN,oldAdmins=process.env.ADMIN_TELEGRAM_IDS;
 try{
 await db.exec(fs.readFileSync('migrations/miniapp/002_supplier_catalog.sql','utf8'));
 await db.query('UPDATE vaynexo_catalog_cache SET synced_at=now(),payload=$1::jsonb',[JSON.stringify([{id:'mlbb',name:'Global',fields:[],offers:[{id:'one',name:'55 Diamonds',supplierPriceUSD:'1.0000'}]},{id:'mobile_legends_adventure',name:'Mobile Legends: Adventure',fields:[],offers:[{id:'wrong',name:'Adventure Diamonds',supplierPriceUSD:'1.0000'}]}])]);
 database.catalogDatabase=()=>({query:(s,v)=>db.query(s,v)});
 process.env.TELEGRAM_BOT_TOKEN='test:token';process.env.ADMIN_TELEGRAM_IDS='42';
 function req(id,body){const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id})});const check=[...p.entries()].sort(([a],[b])=>a<b?-1:1).map(([k,v])=>`${k}=${v}`).join('\n');const key=crypto.createHmac('sha256','WebAppData').update(process.env.TELEGRAM_BOT_TOKEN).digest();p.set('hash',crypto.createHmac('sha256',key).update(check).digest('hex'));return new Request('https://test',{method:body?'POST':'GET',headers:{'X-Telegram-Init-Data':p.toString()},...(body?{body:JSON.stringify(body)}:{})});}
 const admin=require('../app/api/admin/pricing/route.ts'),publicApi=require('../app/api/catalog/route.ts');
 assert.equal((await admin.GET(req(99))).status,403);
 assert.equal((await admin.POST(req(99,{markup:'10',rate:'13000',version:0}))).status,403);
 assert.equal((await admin.POST(req(42,{markup:'-1',rate:'13000',version:0}))).status,400);
 assert.equal((await admin.POST(req(42,{markup:'10',rate:'13000',version:0}))).status,200);
 assert.equal((await admin.POST(req(42,{markup:'20',rate:'13000',version:0}))).status,409);
 const response=await publicApi.GET(),payload=await response.json();assert.equal(payload.products.length,1);assert.equal(payload.products[0].categoryId,'mlbb');assert.equal(payload.products[0].price,14300);assert.equal(payload.products[0].supplierPriceUSD,undefined);
 assert.equal((await db.query('SELECT telegram_id FROM vaynexo_catalog_audit')).rows[0].telegram_id,42);
 }finally{database.catalogDatabase=original;if(oldToken===undefined)delete process.env.TELEGRAM_BOT_TOKEN;else process.env.TELEGRAM_BOT_TOKEN=oldToken;if(oldAdmins===undefined)delete process.env.ADMIN_TELEGRAM_IDS;else process.env.ADMIN_TELEGRAM_IDS=oldAdmins;await db.close();}
});
