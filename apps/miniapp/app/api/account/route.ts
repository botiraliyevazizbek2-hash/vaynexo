import { validateInitData } from '../../../lib/telegram/auth';
import { catalogDatabase } from '../../../lib/catalog/database';
import { signedPhotoUrl } from '../../../lib/account/photo';
import { accountService } from '../../../lib/account/service';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};
 const user=validateInitData(request.headers.get('X-Telegram-Init-Data')??'',process.env.TELEGRAM_BOT_TOKEN??'');
 if(!user)return Response.json({ok:false,error:'unauthorized'},{status:401,headers});
 try{const db=catalogDatabase();const account=await accountService((s,v)=>db.query(s,v)).open(user);return Response.json({ok:true,account:{...account,photoUrl:signedPhotoUrl(user.photo_url)}},{headers});}
 catch{return Response.json({ok:false,error:'unavailable'},{status:503,headers});}
}
