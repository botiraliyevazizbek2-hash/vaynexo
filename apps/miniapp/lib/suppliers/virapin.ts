import { createHmac, timingSafeEqual } from 'node:crypto';
const BASE='https://reseller.virapin.uz/api/reseller';
export type VirapinFailure='not_configured'|'orders_disabled'|'invalid_input'|'unauthorized'|'subscription_required'|'insufficient_balance'|'forbidden'|'not_found'|'conflict'|'rate_limited'|'provider_error'|'invalid_response'|'network';
export class VirapinError extends Error {
 readonly code:VirapinFailure; readonly status:number;
 constructor(code:VirapinFailure,status=0){super(`Virapin: ${code}`);this.name='VirapinError';this.code=code;this.status=status;}
}
export type VirapinProduct={id:string;name:string;tiers:{id:number;label:string;wholesalePriceUZS:number}[]};
export type VirapinOrderInput={productId:string;tierId:number;deliveryId:string;serverId?:string;quantity:number;clientRef:string};
export type VirapinLookup={supported:boolean;found:boolean;nickname?:string;region?:string;reason?:string};
const statuses=['processing','done','failed','refunded'] as const;
function record(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value);}
function text(value:unknown,max=200):value is string{return typeof value==='string'&&value.trim().length>0&&value.length<=max;}
function price(value:unknown):value is number{return typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1e12;}
function productId(value:unknown):value is string{return text(value,64)&&/^[A-Za-z0-9_.:-]+$/.test(value);}
export function createVirapinClient(options:{apiKey?:string;ordersEnabled?:boolean;fetchImpl?:typeof fetch}={}) {
 if(typeof window!=='undefined')throw new VirapinError('forbidden');
 const key=options.apiKey??process.env.VIRAPIN_API_KEY;
 if(!key||!/^vrk_live_[A-Za-z0-9_-]{16,256}$/.test(key))throw new VirapinError('not_configured');
 const send=options.fetchImpl??fetch;
 const ordersEnabled=options.ordersEnabled??process.env.VIRAPIN_ORDERS_ENABLED==='true';
 async function request(path:string,body?:unknown):Promise<unknown>{
  let response:Response;
  try{response=await send(BASE+path,{method:body===undefined?'GET':'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});}
  catch{throw new VirapinError('network');}
  let data:unknown;
  try{const raw=await response.text();if(Buffer.byteLength(raw)>2_000_000)throw Error();data=JSON.parse(raw);}catch{throw new VirapinError('invalid_response',response.status);}
  if(!response.ok){
   const codes:Record<number,VirapinFailure>={401:'unauthorized',402:'insufficient_balance',403:'forbidden',404:'not_found',409:'conflict',429:'rate_limited'};
   throw new VirapinError(record(data)&&data.code==='subscription_required'?'subscription_required':codes[response.status]??'provider_error',response.status);
  }
  return data;
 }
 return {
  async getProfile(){
   const data=await request('/me');
   if(!record(data)||!price(data.balance)||!text(data.status,64)||!text(data.api_status,64))throw new VirapinError('invalid_response');
   return {status:data.status,apiStatus:data.api_status,balanceUZS:data.balance,subscriptionActive:record(data.subscription)&&data.subscription.active===true};
  },
  async getCatalog():Promise<VirapinProduct[]>{
   const data=await request('/catalog');if(!Array.isArray(data)||data.length>10000)throw new VirapinError('invalid_response');
   return data.map(p=>{
    if(!record(p)||!productId(String(p.id??''))||!text(p.name)||!Array.isArray(p.tiers)||p.tiers.length>1000)throw new VirapinError('invalid_response');
    return {id:String(p.id),name:p.name,tiers:p.tiers.map(t=>{
     if(!record(t)||!Number.isSafeInteger(t.id)||Number(t.id)<=0||!text(t.label)||!price(t.price))throw new VirapinError('invalid_response');
     return {id:Number(t.id),label:t.label,wholesalePriceUZS:t.price};
    })};
   });
  },
  async lookup(input:{productId:string;deliveryId:string;serverId?:string}):Promise<VirapinLookup>{
   if(!productId(input.productId)||!text(input.deliveryId,64)||input.deliveryId.length<3||(input.serverId!==undefined&&!text(input.serverId,32)))throw new VirapinError('invalid_input');
   const data=await request('/lookup',{product_id:input.productId,delivery_id:input.deliveryId,...(input.serverId?{server_id:input.serverId}:{})});
   if(!record(data)||typeof data.supported!=='boolean'||(data.found!==undefined&&typeof data.found!=='boolean'))throw new VirapinError('invalid_response');
   if(data.found===true&&(!data.supported||!text(data.nickname)))throw new VirapinError('invalid_response');
   return {supported:data.supported,found:data.found===true,...(text(data.nickname)?{nickname:data.nickname}:{}),...(text(data.region)?{region:data.region}:{}),...(text(data.reason,64)?{reason:data.reason}:{})};
  },
  async createOrder(input:VirapinOrderInput){
   if(!ordersEnabled)throw new VirapinError('orders_disabled');
   if(!productId(input.productId)||!Number.isSafeInteger(input.tierId)||input.tierId<=0||!text(input.deliveryId,64)||input.deliveryId.length<3
    ||!Number.isInteger(input.quantity)||input.quantity<1||input.quantity>20||!text(input.clientRef,64)||!/^[A-Za-z0-9_.:-]{1,64}$/.test(input.clientRef)
    ||(input.serverId!==undefined&&!text(input.serverId,32)))throw new VirapinError('invalid_input');
   // No automatic retries: a retry must retain the same persisted client_ref.
   const data=await request('/orders',{product_id:input.productId,tier_id:input.tierId,delivery_id:input.deliveryId,qty:input.quantity,client_ref:input.clientRef,pay_currency:'som',...(input.serverId?{server_id:input.serverId}:{})});
   if(!record(data)||!text(data.order_id,64)||!statuses.includes(data.status as typeof statuses[number])||!price(data.amount)||data.pay_currency!=='som')throw new VirapinError('invalid_response');
   return {id:data.order_id,status:data.status as typeof statuses[number],amountUZS:data.amount,duplicate:data.duplicate===true};
  },
  async getOrderByRef(clientRef:string){
   if(!text(clientRef,64)||!/^[A-Za-z0-9_.:-]{1,64}$/.test(clientRef))throw new VirapinError('invalid_input');
   const data=await request('/orders/by-ref/'+encodeURIComponent(clientRef));
   if(!record(data)||!text(data.id,64)||data.client_ref!==clientRef||!statuses.includes(data.status as typeof statuses[number]))throw new VirapinError('invalid_response');
   return {id:data.id,status:data.status as typeof statuses[number],clientRef};
  },
  async getOrder(id:string){
   if(!productId(id))throw new VirapinError('invalid_input');
   const data=await request('/orders/'+encodeURIComponent(id));
   if(!record(data)||data.id!==id||!statuses.includes(data.status as typeof statuses[number]))throw new VirapinError('invalid_response');
   return {id,status:data.status as typeof statuses[number],clientRef:text(data.client_ref,64)?data.client_ref:null};
  }
 };
}
export function verifyVirapinWebhook(raw:Buffer,timestamp:string|null,signature:string|null,secret:string|undefined,now=Math.floor(Date.now()/1000)){
 if(!secret||raw.length>65536||!timestamp||!/^\d{10,11}$/.test(timestamp)||Math.abs(now-Number(timestamp))>300||!signature||!/^sha256=[a-f0-9]{64}$/.test(signature))return false;
 const actual=createHmac('sha256',secret).update(Buffer.concat([Buffer.from(timestamp+'.'),raw])).digest();
 return timingSafeEqual(actual,Buffer.from(signature.slice(7),'hex'));
}
