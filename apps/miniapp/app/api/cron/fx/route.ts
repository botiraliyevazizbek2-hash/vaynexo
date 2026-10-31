import { timingSafeEqual } from 'node:crypto';
import { checkAndNotifyRate } from '../../../../lib/catalog/fx-approval';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const expected=process.env.CRON_SECRET;
 const received=request.headers.get('authorization')??'';
 if(!expected)return Response.json({ok:false,error:'cron_not_configured'},{status:503});
 const a=Buffer.from(received),b=Buffer.from('Bearer '+expected);
 if(a.length!==b.length||!timingSafeEqual(a,b))return Response.json({ok:false},{status:401});
 try{return Response.json(await checkAndNotifyRate());}
 catch{console.error('[fx] Rate check failed');return Response.json({ok:false,error:'rate_check_failed'},{status:503});}
}
