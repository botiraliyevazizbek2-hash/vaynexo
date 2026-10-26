const fs=require('node:fs'),path=require('node:path');const {Client}=require('pg');
for(const file of ['.env.local','.env'])if(fs.existsSync(file))process.loadEnvFile(file);
(async()=>{
 const migrationUrl=process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL;
 if(!migrationUrl){console.log('Database migration skipped: connection is not configured.');return;}
 const client=new Client({connectionString:migrationUrl,connectionTimeoutMillis:5000,statement_timeout:15000});
 try {await client.connect();await client.query(fs.readFileSync(path.join(__dirname,'../migrations/miniapp/001_phone_registration.sql'),'utf8'));console.log('Phone registration migration complete.');}
 finally{await client.end();}
})().catch(()=>{console.error('Database migration failed. Check the private connection configuration.');process.exitCode=1});
