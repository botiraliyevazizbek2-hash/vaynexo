import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
let pool: Pool | undefined;
export function catalogDatabase() {
 if(!process.env.DATABASE_URL)throw Error('unavailable');
 if(!pool){pool=new Pool({connectionString:process.env.DATABASE_URL,max:2,idleTimeoutMillis:10000,connectionTimeoutMillis:5000,statement_timeout:7000});pool.on('error',()=>{});if(process.env.VERCEL)attachDatabasePool(pool);}
 return pool;
}
