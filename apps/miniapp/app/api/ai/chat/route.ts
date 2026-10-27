import {validateInitData} from '../../../../lib/telegram/auth';
import {catalogDatabase} from '../../../../lib/catalog/database';
import {parseAIInput,createAIClient} from '../../../../lib/ai/client';
import {claimAIRequest} from '../../../../lib/ai/limits';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};
 const user=validateInitData(request.headers.get('X-Telegram-Init-Data')??'',process.env.TELEGRAM_BOT_TOKEN??'');
 if(!user)return Response.json({ok:false,error:'unauthorized'},{status:401,headers});
 let input;try{const raw=await request.text();if(raw.length>24000)throw Error();input=parseAIInput(JSON.parse(raw));}catch{return Response.json({ok:false,error:'invalid_input'},{status:400,headers});}
 try{const api=createAIClient();const db=catalogDatabase();if(!await claimAIRequest((s,v)=>db.query(s,v),user.id))return Response.json({ok:false,error:'rate_limited'},{status:429,headers:{...headers,'Retry-After':'5'}});
 return Response.json({ok:true,text:await api.reply(input)},{headers});
 }catch(e){const code=e instanceof Error&&e.name==='AIError'?e.message:'unavailable';console.error('[ai-chat]',code);return Response.json({ok:false,error:code},{status:503,headers});}
}
