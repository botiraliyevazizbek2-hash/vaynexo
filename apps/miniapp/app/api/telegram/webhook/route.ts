import { registrationReady, registrationService } from '../../../../lib/registration/database';
import { buildReply, getSavedLanguage, isValidSecret, parseCommand, saveLanguage, sendMessage, telegramCall, type TelegramUpdate } from '../../../../lib/telegram/bot';
import { isLanguage, normalizeLanguage } from '../../../../lib/i18n/core';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!process.env.TELEGRAM_BOT_TOKEN||!process.env.TELEGRAM_WEBHOOK_SECRET)return Response.json({ok:false},{status:503});
 if(!isValidSecret(request.headers.get('x-telegram-bot-api-secret-token')))return Response.json({ok:false},{status:401});
 let update:TelegramUpdate;
 try{const raw=await request.text();if(Buffer.byteLength(raw)>65536)return Response.json({ok:false},{status:413});update=JSON.parse(raw);if(!update||typeof update!=='object'||Array.isArray(update))throw new Error();}catch{return Response.json({ok:false},{status:400});}
 try{
  const callback=update.callback_query;
  if(callback){
   const message=callback.message,language=callback.data?.startsWith('lang:')?callback.data.slice(5):null;
   if(!callback.from?.is_bot&&message?.chat.type==='private'&&message.chat.id===callback.from?.id&&isLanguage(language)){
    await saveLanguage(callback.from.id,language);
    await telegramCall('answerCallbackQuery',{callback_query_id:callback.id});
    const reply=buildReply('start',callback.from.first_name,true,language)!;
    // Send a fresh localized message. Earlier messages remain ordinary chat history.
    await sendMessage(message.chat.id,reply);
   }else if(callback.id)await telegramCall('answerCallbackQuery',{callback_query_id:callback.id});
   return Response.json({ok:true});
  }
  const message=update.message;
  if(message?.contact){
   if(registrationReady())await registrationService().accept(message);
   return Response.json({ok:true});
  }
  if(!message?.text||message.from?.is_bot||!message.chat)return Response.json({ok:true});
  const isPrivate=message.chat.type==='private',command=parseCommand(message.text);
  if(!isPrivate&&!command)return Response.json({ok:true});
  let language=normalizeLanguage(message.from?.language_code);
  if(isPrivate)language=await getSavedLanguage(message.chat.id,message.from?.language_code);
  const reply=buildReply(command,message.from?.first_name,isPrivate,language);
  if(reply)await sendMessage(message.chat.id,reply);
  return Response.json({ok:true});
 }catch{console.error('[telegram] Update processing failed');return Response.json({ok:false},{status:502});}
}
