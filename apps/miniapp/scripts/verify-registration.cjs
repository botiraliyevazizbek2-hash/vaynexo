// Run privately during deployment. No diagnostic endpoint or test credential is published.
const {spawn}=require('node:child_process');
const {createHmac,randomInt}=require('node:crypto');
const assert=require('node:assert/strict');
const {Client}=require('pg');
const fs=require('node:fs');
for(const file of ['.env.local','.env'])if(fs.existsSync(file))process.loadEnvFile(file);
async function verify(){
 const {DATABASE_URL,DATABASE_URL_UNPOOLED,TELEGRAM_BOT_TOKEN,TELEGRAM_WEBHOOK_SECRET,PHONE_DATA_KEY,PHONE_REGISTRATION_ENABLED}=process.env;
 assert.ok(DATABASE_URL&&TELEGRAM_BOT_TOKEN&&TELEGRAM_WEBHOOK_SECRET&&/^[a-f0-9]{64}$/.test(PHONE_DATA_KEY??'')&&PHONE_REGISTRATION_ENABLED==='true','Registration configuration is incomplete');
 const db=new Client({connectionString:DATABASE_URL_UNPOOLED||DATABASE_URL,connectionTimeoutMillis:10000,statement_timeout:10000});
 let server,created=false;
 const id=4000000000000000+randomInt(1000000000);
 const base='http://127.0.0.1:3197';
 function initData(userId){
  const params=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id:userId,first_name:'Deployment test',language_code:'en'})});
  const check=[...params.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>`${k}=${v}`).join('\n');
  const key=createHmac('sha256','WebAppData').update(TELEGRAM_BOT_TOKEN).digest();
  params.set('hash',createHmac('sha256',key).update(check).digest('hex'));return params.toString();
 }
 const signed=initData(id);
 async function registration(body,identity=signed){
  const response=await fetch(base+'/api/registration',{method:'POST',headers:{'Content-Type':'application/json','X-Telegram-Init-Data':identity},body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(15000)});
  const data=await response.json();return {response,data};
 }
 async function contact(contactId){
  const response=await fetch(base+'/api/telegram/webhook',{method:'POST',headers:{'Content-Type':'application/json','X-Telegram-Bot-Api-Secret-Token':TELEGRAM_WEBHOOK_SECRET},body:JSON.stringify({update_id:1,message:{message_id:1,chat:{id,type:'private'},from:{id,is_bot:false},contact:{user_id:contactId,phone_number:'+15555550123'}}}),redirect:'error',signal:AbortSignal.timeout(15000)});
  assert.equal(response.status,200,'Contact webhook failed');
 }
 try{
  await db.connect();
  await db.query('SELECT 1');console.log('Registration verification: Neon PostgreSQL connection PASS');
  assert.equal((await db.query('SELECT telegram_id FROM vaynexo_phone_registrations WHERE telegram_id=$1',[id])).rowCount,0,'Test identity collision');
  server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3197'],{stdio:'ignore',env:{...process.env,NODE_ENV:'production'}});
  let exited=false;server.on('exit',()=>{exited=true;});server.on('error',()=>{exited=true;});
  let ready=false;
  for(let attempt=0;attempt<40;attempt++){
   if(exited)throw Error('Local application failed to start');
   try{const response=await fetch(base+'/api/registration',{method:'POST',redirect:'error',signal:AbortSignal.timeout(1000)});if(response.status===401){ready=true;break;}}catch{}
   await new Promise(resolve=>setTimeout(resolve,250));
  }
  assert.ok(ready,'Local application readiness failed');
  assert.equal((await registration({action:'status'},'invalid')).response.status,401);
  assert.equal((await registration({action:'begin'})).response.status,400);
  assert.equal((await registration({action:'status'})).data.registered,false);
  // Only this synthetic ID may be cleaned up; an existing row is never touched.
  created=true;
  assert.equal((await registration({action:'begin',consent:true})).response.status,200);
  assert.equal((await registration({action:'begin',consent:true})).response.status,429);
  await contact(id+1);
  assert.equal((await registration({action:'status'})).data.registered,false);
  await contact(id);
  const registered=await registration({action:'status'});
  assert.equal(registered.response.status,200);assert.equal(registered.data.registered,true);assert.equal(registered.data.maskedPhone,'•••• 0123');
  assert.equal((await registration({action:'status'},initData(id+1))).data.registered,false);
  const row=(await db.query('SELECT phone_ciphertext FROM vaynexo_phone_registrations WHERE telegram_id=$1',[id])).rows[0];
  assert.ok(row.phone_ciphertext.startsWith('v1.')&&!row.phone_ciphertext.includes('15555550123'));
  console.log('Registration verification: HTTP API → real Neon database → registered status PASS');
  console.log('Registration verification: authentication, consent, rate limit, contact ownership and encryption PASS');
 }finally{
  try{if(created){await db.query('DELETE FROM vaynexo_phone_registrations WHERE telegram_id=$1',[id]);console.log('Registration verification: synthetic test record removed');}}
  finally{server?.kill('SIGTERM');await db.end();}
 }
}
verify().catch(()=>{console.error('Registration verification FAILED. Deployment must not be promoted. No credentials were printed.');process.exitCode=1;});
