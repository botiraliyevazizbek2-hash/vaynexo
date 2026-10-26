import {validateInitData} from '../../../../lib/telegram/auth';
import {telegramProfilePhoto} from '../../../../lib/account/photo';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;
export async function POST(request:Request){
 const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
 const user=validateInitData(request.headers.get('X-Telegram-Init-Data')??'',process.env.TELEGRAM_BOT_TOKEN??'');
 if(!user)return Response.json({ok:false,error:'unauthorized'},{status:401,headers});
 try{const photo=await telegramProfilePhoto(user.id);return photo?new Response(new Uint8Array(photo.bytes),{headers:{...headers,'Content-Type':photo.type}}):new Response(null,{status:204,headers});}
 catch{return Response.json({ok:false,error:'photo_unavailable'},{status:502,headers});}
}
