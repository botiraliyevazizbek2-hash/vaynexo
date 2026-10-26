import { validateInitData } from '../../../../lib/telegram/auth';
import { getSavedLanguage, saveLanguage } from '../../../../lib/telegram/bot';
import { isLanguage } from '../../../../lib/i18n/core';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function POST(request:Request){
 const user=validateInitData(request.headers.get('X-Telegram-Init-Data')??'',process.env.TELEGRAM_BOT_TOKEN??'');
 if(!user)return Response.json({ok:false},{status:401,headers});
 let body;try{const raw=await request.text();if(raw.length>1024)return Response.json({ok:false},{status:413,headers});body=JSON.parse(raw);}catch{return Response.json({ok:false},{status:400,headers});}
 if(!body||!['get','set'].includes(body.action)||(body.action==='set'&&!isLanguage(body.language)))return Response.json({ok:false},{status:400,headers});
 try{
  if(body.action==='set')await saveLanguage(user.id,body.language);
  const language=body.action==='set'?body.language:await getSavedLanguage(user.id,user.language_code);
  return Response.json({ok:true,language},{headers});
 }catch{return Response.json({ok:false},{status:503,headers});}
}
