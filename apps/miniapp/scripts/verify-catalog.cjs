// Read-only provider sync plus database snapshot check; no prices are configured here.
const fs=require('node:fs'),ts=require('typescript'),{Client}=require('pg');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
(async()=>{
 const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000,statement_timeout:15000});
 try{
 await db.connect();const {catalogService}=require('../lib/catalog/service.ts');const service=catalogService((q,v)=>db.query(q,v));await service.refresh();
 const result=(await db.query("SELECT jsonb_array_length(payload) AS categories,synced_at>now()-interval '1 hour' AS fresh FROM vaynexo_catalog_cache WHERE id=true")).rows[0];
 if(!result?.fresh||!result.categories)throw Error('catalog_unavailable');
 const view=await service.read();console.log(JSON.stringify({catalogDatabase:'ok',supplierSnapshot:'fresh',mlbbCategories:result.categories,pricingStatus:view.status,paidOrdersSent:0}));
 }finally{await db.end();}
})().catch(()=>{console.error('Catalog verification failed; check private database/provider configuration.');process.exitCode=1;});
