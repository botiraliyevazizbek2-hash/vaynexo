const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),crypto=require('node:crypto');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {PGlite}=require('@electric-sql/pglite');
const {ownContact,createRegistrationService}=require('../lib/registration/service.ts');
const {POST}=require('../app/api/registration/route.ts');
const contact={chat:{id:42,type:'private'},from:{id:42},contact:{user_id:42,phone_number:'+15555550123'}};
const key='ab'.repeat(32);
test('contact verification rejects other users, forwards, groups and malformed numbers',()=>{
 assert.deepEqual(ownContact(contact),{id:42,phone:'+15555550123'});
 for(const bad of [{...contact,contact:{user_id:99,phone_number:'+15555550123'}},{...contact,forward_origin:{}},{...contact,chat:{id:42,type:'group'}},{...contact,from:{id:42,is_bot:true}},{...contact,contact:{phone_number:'+15555550123'}},{...contact,contact:{user_id:42,phone_number:'not a phone'}}])assert.equal(ownContact(bad),null);
});
test('real Postgres registration requires fresh consent, consumes it once and stores encrypted phone only',async()=>{
 const db=new PGlite();
 try{
 await db.exec(fs.readFileSync('migrations/miniapp/001_phone_registration.sql','utf8'));
 const service=createRegistrationService((sql,values)=>db.query(sql,values),key);
 assert.equal(await service.accept(contact),false);
 assert.equal(await service.begin(42),true);assert.equal(await service.begin(42),false);
 assert.equal(await service.accept({...contact,contact:{user_id:99,phone_number:'+15555550123'}}),false);
 assert.equal(await service.accept(contact),true);
 assert.equal(await service.accept(contact),false);
 assert.deepEqual(await service.status(42),{registered:true,maskedPhone:'•••• 0123',pending:false});
 assert.equal((await service.status(99)).registered,false);
 const row=(await db.query('SELECT * FROM vaynexo_phone_registrations WHERE telegram_id=42')).rows[0];
 assert.ok(!row.phone_ciphertext.includes('15555550123'));
 const [,iv,tag,cipher]=row.phone_ciphertext.split('.');const decipher=crypto.createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),Buffer.from(iv,'base64url'));decipher.setAuthTag(Buffer.from(tag,'base64url'));assert.equal(Buffer.concat([decipher.update(Buffer.from(cipher,'base64url')),decipher.final()]).toString(),'+15555550123');
 await service.begin(99);await service.cancel(99);assert.equal(await service.accept({...contact,chat:{id:99,type:'private'},from:{id:99},contact:{user_id:99,phone_number:'+15555550123'}}),false);
 await db.query("UPDATE vaynexo_phone_registrations SET pending_until=NOW()-INTERVAL '1 second' WHERE telegram_id=99");assert.equal(await service.accept({...contact,chat:{id:99,type:'private'},from:{id:99},contact:{user_id:99,phone_number:'+15555550123'}}),false);
 }finally{await db.close();}
});
test('registration API rejects forged identities and missing consent before contacting storage',async()=>{
 process.env.TELEGRAM_BOT_TOKEN='123:test-token';process.env.PHONE_REGISTRATION_ENABLED='true';process.env.DATABASE_URL='postgresql://unused';process.env.PHONE_DATA_KEY=key;
 try{
 assert.equal((await POST(new Request('https://test',{method:'POST',body:'{"action":"begin","consent":true}'}))).status,401);
 const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id:42})});const check=[...p.entries()].sort(([a],[b])=>a<b?-1:1).map(([k,v])=>`${k}=${v}`).join('\n');const secret=crypto.createHmac('sha256','WebAppData').update(process.env.TELEGRAM_BOT_TOKEN).digest();p.set('hash',crypto.createHmac('sha256',secret).update(check).digest('hex'));
 const req=body=>new Request('https://test',{method:'POST',headers:{'X-Telegram-Init-Data':p.toString()},body:JSON.stringify(body)});
 assert.equal((await POST(req({action:'begin',user_id:99}))).status,400);
 delete process.env.DATABASE_URL;assert.equal((await POST(req({action:'status'}))).status,503);
 }finally{delete process.env.PHONE_REGISTRATION_ENABLED;delete process.env.PHONE_DATA_KEY;delete process.env.DATABASE_URL;}
});
