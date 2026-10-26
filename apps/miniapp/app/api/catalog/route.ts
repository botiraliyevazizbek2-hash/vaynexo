import { catalogDatabase } from '../../../lib/catalog/database';
import { catalogService } from '../../../lib/catalog/service';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=300;
export async function GET() {
 const headers={'Cache-Control':'no-store'};
 try {const db=catalogDatabase();const service=catalogService((s,v)=>db.query(s,v));await service.refresh();return Response.json({ok:true,...await service.read()},{headers});}
 catch{return Response.json({ok:false,status:'unavailable',products:[]},{status:503,headers});}
}
