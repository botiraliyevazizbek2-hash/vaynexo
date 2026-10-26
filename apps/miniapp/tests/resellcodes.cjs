const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript');
require.extensions['.ts'] = (m,f) => m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {createResellcodesClient,validResellcodesUSD}=require('../lib/suppliers/resellcodes.ts');
const key='rsc_live_'+'a'.repeat(48);
test('ReSellCodes reads exact USD prices and dynamic buyer fields without exposing purchase operations', async()=>{
 const calls=[];
 const api=createResellcodesClient({apiKey:key,fetchImpl:async(url,options)=>{calls.push({url,options});return Response.json({object:'top_up_offers',category_id:'mlbb_global',name:'Mobile Legends',fields:[{key:'zone',label:'Server ID',type:'text'}],offers:[{offer_id:'55',name:'55 Diamonds',price_usd:'0.9161'}]});}});
 const catalog=await api.getTopupOffers('mlbb_global');assert.equal(catalog.offers[0].supplierPriceUSD,'0.9161');assert.deepEqual(catalog.fields,[{key:'zone',label:'Server ID',type:'text'}]);
 assert.equal(calls[0].options.method,'GET');assert.equal(calls[0].options.headers.Authorization,'Bearer '+key);assert.equal(calls[0].options.redirect,'error');assert.equal(calls[0].url,'https://resell.codes/api/v1/top-ups/categories/mlbb_global/offers');assert.equal(api.createOrder,undefined);
 await assert.rejects(api.getTopupOffers('../me'),e=>e.code==='invalid_input');assert.equal(calls.length,1);
});
test('ReSellCodes sanitizes auth, rate-limit and network failures with no automatic retry',async()=>{
 for(const [status,code]of [[401,'unauthorized'],[403,'forbidden'],[429,'rate_limited']]){
  let calls=0;const api=createResellcodesClient({apiKey:key,fetchImpl:async()=>{calls++;return new Response(key,{status});}});
  await assert.rejects(api.getProfile(),e=>e.code===code&&!e.message.includes(key));assert.equal(calls,1);
 }
 const api=createResellcodesClient({apiKey:key,fetchImpl:async()=>{throw Error(key);}});await assert.rejects(api.getProfile(),e=>e.code==='network'&&!e.message.includes(key));
});
test('ReSellCodes validates account, category and price contracts',async()=>{
 const make=data=>createResellcodesClient({apiKey:key,fetchImpl:async()=>Response.json(data)});
 assert.deepEqual(await make({object:'account',status:'ACTIVE',balance_usd:'0.0000'}).getProfile(),{active:true,balanceUSD:'0.0000'});
 assert.equal((await make({object:'account',status:'BLOCKED',balance_usd:'0.0000'}).getProfile()).active,false);
 assert.deepEqual(await make({object:'list',data:[{category_id:'mobile_legends',name:'MLBB',note:'Global'}]}).getTopupCategories(),[{id:'mobile_legends',name:'MLBB',note:'Global'}]);
 for(const bad of [0.9161,'NaN','-1.0000','1e2','1.00'])assert.equal(validResellcodesUSD(bad),false);
 await assert.rejects(make({object:'account',status:'ACTIVE',balance_usd:0}).getProfile(),e=>e.code==='invalid_response');
 assert.throws(()=>createResellcodesClient({apiKey:'bad'}),e=>e.code==='not_configured');
});
