import { validateInitData } from '../../../../lib/telegram/auth';
import { isCatalogAdmin,parsePricing } from '../../../../lib/catalog/pricing';
import { catalogDatabase } from '../../../../lib/catalog/database';
import { catalogService } from '../../../../lib/catalog/service';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=300;
const headers={'Cache-Control':'no-store'};
function identity(request:Request){return validateInitData(request.headers.get('X-Telegram-Init-Data')??'',process.env.TELEGRAM_BOT_TOKEN??'');}
export async function GET(request:Request){
 const user=identity(request);
 if(!user||!isCatalogAdmin(user.id))return Response.json({ok:false,error:'forbidden',...(user?{telegramId:user.id}:{})},{status:403,headers});
 try{const db=catalogDatabase();const s=catalogService((q,v)=>db.query(q,v));await s.refresh();return Response.json({ok:true,...await s.read(true)},{headers});}catch{return Response.json({ok:false,error:'unavailable'},{status:503,headers});}
}
export async function POST(request:Request){
 const user=identity(request);
 if(!user||!isCatalogAdmin(user.id))return Response.json({ok:false,error:'forbidden'},{status:403,headers});
 let data,parsed;
 try{const raw=await request.text();if(Buffer.byteLength(raw)>1024)throw Error();data=JSON.parse(raw);parsed=parsePricing(data.markup,data.rate);if(!Number.isSafeInteger(data.version)||data.version<0)throw Error();}catch{return Response.json({ok:false,error:'invalid_pricing'},{status:400,headers});}
 try{const db=catalogDatabase();const s=catalogService((q,v)=>db.query(q,v));if(!await s.save(user.id,parsed.markupBps,parsed.rate,data.version))return Response.json({ok:false,error:'conflict'},{status:409,headers});return Response.json({ok:true,...await s.read(true)},{headers});}catch{return Response.json({ok:false,error:'unavailable'},{status:503,headers});}
}
