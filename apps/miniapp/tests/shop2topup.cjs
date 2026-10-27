const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript'), crypto = require('node:crypto');
require.extensions['.ts'] = (m,f) => m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const { verifyShop2TopupWebhook, createShop2TopupClient } = require('../lib/suppliers/shop2topup.ts');
test('Shop2Topup authenticates exact bytes and rejects missing or changed signatures', () => {
  const raw=Buffer.from('{"event":"webhook.test"}'), secret='test-secret';
  const sig='sha256='+crypto.createHmac('sha256',secret).update(raw).digest('hex');
  assert.equal(verifyShop2TopupWebhook(raw,sig,secret),true);
  assert.equal(verifyShop2TopupWebhook(Buffer.from('{}'),sig,secret),false);
  for(const value of [null,'','sha256=abc']) assert.equal(verifyShop2TopupWebhook(raw,value,secret),false);
  assert.equal(verifyShop2TopupWebhook(raw,sig,undefined),false);
});
test('Shop2Topup read client confines key to provider and has no order method', async () => {
  const calls=[]; const api=createShop2TopupClient({apiKey:'test.secret',fetchImpl:async(u,o)=>{calls.push([u,o]);return Response.json({success:true});}});
  await api.getAccount(); assert.equal(calls[0][1].method,'GET'); assert.equal(calls[0][1].redirect,'error');
  assert.equal(calls[0][1].headers.Authorization,'Bearer test.secret'); assert.equal(api.createOrder,undefined);
  assert.throws(()=>createShop2TopupClient({apiKey:'test.secret',baseUrl:'https://example.com'}));
});
test('Webhook registration probe never accepts an unsigned order', async () => {
  const {POST}=require('../app/api/shop2topup/webhook/route.ts');
  const old=process.env.SHOP2TOPUP_WEBHOOK_SECRET; delete process.env.SHOP2TOPUP_WEBHOOK_SECRET;
  const send=(body)=>POST(new Request('https://example.com/api/shop2topup/webhook',{method:'POST',body:JSON.stringify(body)}));
  try {
    assert.equal((await send({event:'webhook.test'})).status,200);
    assert.equal((await send({event:'order.completed',data:{order_id:'abc'}})).status,503);
    process.env.SHOP2TOPUP_WEBHOOK_SECRET='test';
    assert.equal((await send({event:'webhook.test'})).status,401);
  } finally {if(old===undefined)delete process.env.SHOP2TOPUP_WEBHOOK_SECRET;else process.env.SHOP2TOPUP_WEBHOOK_SECRET=old;}
});
test('Shop2Topup catalog maps direct topups and preserves six decimal USD prices', async () => {
 const replies={
  '/account':{success:true,account:{enabled:true,wallet:'0.000000'}},
  '/catalog/categories':{success:true,categories:[{id:12,name:'Mobile Legends Global'}]},
  '/catalog/subcategories?categoryId=12':{success:true,subcategories:[{item_id:99,category_id:12,category_name:'Mobile Legends Global',name:'55 Diamonds',price:'0.950001',product_type:'topup'},{item_id:100,category_id:12,name:'Voucher',price:'1.00',product_type:'voucher'}]},
 };
 const api=createShop2TopupClient({apiKey:'test.secret',fetchImpl:async url=>Response.json(replies[new URL(url).pathname.replace('/api/endpoints/v1','')+new URL(url).search])});
 assert.equal((await api.getProfile()).active,true);
 assert.equal((await api.getTopupCategories())[0].id,'12');
 const category=await api.getTopupOffers('12');
 assert.equal(category.supplier,'shop2topup');assert.equal(category.offers.length,1);
 assert.equal(category.offers[0].supplierPriceUSD,'0.950001');
 const {sellingPrice}=require('../lib/catalog/pricing.ts');
 assert.equal(sellingPrice('0.950001',0,'10000'),9501);
});
