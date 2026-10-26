export function parsePricing(markup: unknown, rate: unknown) {
 if(typeof markup!=='string'||!/^\d{1,4}(\.\d{1,2})?$/.test(markup)||typeof rate!=='string'||!/^\d{1,7}(\.\d{1,4})?$/.test(rate))throw Error('invalid_pricing');
 const [whole,fraction='']=markup.split('.');
 const markupBps=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(markupBps>100000||Number(rate)<=0||Number(rate)>1000000)throw Error('invalid_pricing');
 return {markupBps,rate};
}
// USD has four decimals; FX has four decimals. Round upward to a whole UZS.
export function sellingPrice(usd:string,markupBps:number,rate:string) {
 if(!/^\d{1,12}\.\d{4}$/.test(usd)||!Number.isInteger(markupBps)||markupBps<0||markupBps>100000||!/^\d{1,7}(\.\d{1,4})?$/.test(rate)||Number(rate)<=0||Number(rate)>1000000)throw Error('invalid_pricing');
 const [w,f='']=rate.split('.');
 const amount=BigInt(usd.replace('.',''))*(BigInt(w)*BigInt(10000)+BigInt(f.padEnd(4,'0')))*BigInt(10000+markupBps);
 const price=Number((amount+BigInt(1000000000000)-BigInt(1))/BigInt(1000000000000));
 if(!Number.isSafeInteger(price)||price<1)throw Error('invalid_price');
 return price;
}
export function isCatalogAdmin(id:number, configured=process.env.ADMIN_TELEGRAM_IDS??'') {
 return Number.isSafeInteger(id)&&id>0&&configured.split(/[\s,\[\]]+/).some(value=>/^[1-9]\d*$/.test(value)&&value===String(id));
}
