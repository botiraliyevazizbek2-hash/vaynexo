import { attachDatabasePool } from '@vercel/functions';
import { Pool } from 'pg';
import { createRegistrationService, validDataKey } from './service';
export function registrationRequired() {return process.env.PHONE_REGISTRATION_ENABLED==='true';}
export function registrationReady() {return registrationRequired()&&!!process.env.DATABASE_URL&&validDataKey(process.env.PHONE_DATA_KEY);}
let pool:Pool|undefined;
export function registrationService() {
 if(!registrationReady())throw Error('Registration unavailable');
 if(!pool){pool=new Pool({connectionString:process.env.DATABASE_URL,max:2,idleTimeoutMillis:10000,connectionTimeoutMillis:5000,statement_timeout:5000,query_timeout:7000});pool.on('error',()=>{});if(process.env.VERCEL)attachDatabasePool(pool);}
 return createRegistrationService(async(sql,values)=>pool!.query(sql,values),process.env.PHONE_DATA_KEY!);
}
