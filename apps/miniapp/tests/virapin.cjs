const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),crypto=require('node:crypto');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {createVirapinClient,verifyVirapinWebhook}=require('../lib/suppliers/virapin.ts');
const key='vrk_live_'+ 'a'.repeat(32);
const input={productId:'mlbb',tierId:101,deliveryId:'842190334',serverId:'5143',quantity:1,clientRef:'vaynexo-123'};
function client(data,extra={}){const calls=[];return {calls,api:createVirapinClient({apiKey:key,fetchImpl:async(url,options)=>{calls.push({url,options});return Response.json(data);},...extra})};}
test('Virapin keeps auth server-side and preserves catalog tier IDs and wholesale prices',async()=>{
 const {api,calls}=client([{id:'mlbb',name:'Mobile Legends',tiers:[{id:101,label:'55 Diamonds',price:9000}]}]);
 const products=await api.getCatalog();assert.equal(products[0].tiers[0].wholesalePriceUZS,9000);assert.equal(products[0].tiers[0].id,101);
 assert.equal(calls[0].url,'https://reseller.virapin.uz/api/reseller/catalog');assert.equal(calls[0].options.headers.Authorization,'Bearer '+key);assert.equal(calls[0].options.redirect,'error');assert.equal(calls[0].options.method,'GET');
 assert.throws(()=>createVirapinClient({apiKey:'wrong'}),e=>e.code==='not_configured');
});
test('paid orders are disabled by default and require a stable reference with explicit UZS payment',async()=>{
 const disabled=client({});await assert.rejects(disabled.api.createOrder(input),e=>e.code==='orders_disabled');assert.equal(disabled.calls.length,0);
 const {api,calls}=client({order_id:'VR123',status:'processing',amount:9000,pay_currency:'som',duplicate:false},{ordersEnabled:true});
 for(const bad of [{...input,clientRef:undefined},{...input,clientRef:''},{...input,quantity:0},{...input,quantity:21}])await assert.rejects(api.createOrder(bad),e=>e.code==='invalid_input');
 const result=await api.createOrder(input);assert.equal(result.id,'VR123');const body=JSON.parse(calls[0].options.body);assert.equal(body.client_ref,input.clientRef);assert.equal(body.server_id,'5143');assert.equal(body.pay_currency,'som');assert.equal(calls.length,1);
});
test('lookup does not claim verification when unsupported and preserves actual nick and optional region',async()=>{
 const missing=client({supported:false,reason:'not_configured'});assert.deepEqual(await missing.api.lookup({productId:'mlbb',deliveryId:'842190334',serverId:'5143'}),{supported:false,found:false,reason:'not_configured'});
 const actual=client({supported:true,found:true,nickname:'Player',region:'Asia'});const r=await actual.api.lookup(input);assert.equal(r.nickname,'Player');assert.equal(r.region,'Asia');
 const malformed=client({supported:true,found:true});await assert.rejects(malformed.api.lookup(input),e=>e.code==='invalid_response');
});
test('provider errors and network timeouts never leak key, balance or provider body and do not auto-retry',async()=>{
 let calls=0;const api=createVirapinClient({apiKey:key,fetchImpl:async()=>{calls++;return Response.json({code:'subscription_required',error:key,balance:9000},{status:402});}});
 await assert.rejects(api.getProfile(),e=>e.code==='subscription_required'&&!e.message.includes(key)&&!e.message.includes('9000'));assert.equal(calls,1);
 const network=createVirapinClient({apiKey:key,ordersEnabled:true,fetchImpl:async()=>{calls++;throw Error(key);}});await assert.rejects(network.createOrder(input),e=>e.code==='network'&&!e.message.includes(key));assert.equal(calls,2);
});
test('uncertain order submissions can be reconciled by the original client_ref using a GET',async()=>{
 const {api,calls}=client({id:'VR123',status:'done',client_ref:'vaynexo-123'});assert.equal((await api.getOrderByRef('vaynexo-123')).status,'done');assert.ok(calls[0].url.endsWith('/orders/by-ref/vaynexo-123'));assert.equal(calls[0].options.method,'GET');
});
test('webhooks require a fresh constant-time HMAC over exact raw bytes',()=>{
 const raw=Buffer.from('{"event":"order.updated","data":{"id":"VR123"}}');const ts='1793043000',secret='whsec_test-secret';
 const sig='sha256='+crypto.createHmac('sha256',secret).update(Buffer.concat([Buffer.from(ts+'.'),raw])).digest('hex');
 assert.equal(verifyVirapinWebhook(raw,ts,sig,secret,Number(ts)),true);
 for(const [b,t,s,k,n]of [[Buffer.from(raw.toString()+' '),ts,sig,secret,Number(ts)],[raw,ts,sig,secret,Number(ts)+301],[raw,ts,sig,'wrong',Number(ts)],[raw,ts,null,secret,Number(ts)]])assert.equal(verifyVirapinWebhook(b,t,s,k,n),false);
});
