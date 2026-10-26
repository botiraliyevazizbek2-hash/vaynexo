import { validateInitData } from '../../../lib/telegram/auth';
import { registrationReady, registrationService } from '../../../lib/registration/database';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function POST(request:Request) {
 const user=validateInitData(request.headers.get('X-Telegram-Init-Data')??'',process.env.TELEGRAM_BOT_TOKEN??'');
 if(!user)return Response.json({ok:false,error:'unauthorized'},{status:401,headers});
 if(!registrationReady())return Response.json({ok:false,error:'unavailable'},{status:503,headers});
 let data;
 try {const raw=await request.text();if(Buffer.byteLength(raw)>1024)return Response.json({ok:false},{status:413,headers});data=JSON.parse(raw);}catch{return Response.json({ok:false},{status:400,headers});}
 if(!data||!['status','begin','cancel'].includes(data.action)||(data.action==='begin'&&data.consent!==true))return Response.json({ok:false},{status:400,headers});
 try {
  const service=registrationService();
  if(data.action==='begin') {
   const status=await service.status(user.id);
   if(status.registered)return Response.json({ok:true,...status},{headers});
   if(!await service.begin(user.id))return Response.json({ok:false,error:'rate_limited'},{status:429,headers:{...headers,'Retry-After':'30'}});
  }
  if(data.action==='cancel')await service.cancel(user.id);
  return Response.json({ok:true,...await service.status(user.id)},{headers});
 }catch{return Response.json({ok:false,error:'unavailable'},{status:503,headers});}
}
