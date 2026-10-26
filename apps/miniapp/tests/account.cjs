const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),crypto=require('node:crypto');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {PGlite}=require('@electric-sql/pglite');
const {accountService}=require('../lib/account/service.ts');
test('automatic Telegram account is idempotent, updates names and requires no phone record',async()=>{
 const db=new PGlite();try{
 const migration=fs.readFileSync('migrations/miniapp/003_telegram_accounts.sql','utf8');await db.exec(migration);await db.exec(migration);
 const service=accountService((s,v)=>db.query(s,v));const first=await service.open({id:42,first_name:'Ozodbek',username:'first'});assert.equal(first.telegramId,42);
 await service.open({id:42,first_name:'Updated',username:'new'});assert.equal((await db.query('SELECT * FROM vaynexo_accounts')).rows.length,1);
 assert.equal((await service.open({id:42,first_name:'Updated',username:'new'})).username,'new');
 const r=await service.open({id:99,first_name:123,username:'a'.repeat(100)});assert.equal(r.firstName,'');assert.equal(r.username.length,64);
 await assert.rejects(service.open({id:-1}));
 }finally{await db.close();}
});
test('account API trusts only signed Telegram identity and never request-body identity',async()=>{
 const db=new PGlite(),database=require('../lib/catalog/database.ts'),original=database.catalogDatabase;
 const oldToken=process.env.TELEGRAM_BOT_TOKEN;process.env.TELEGRAM_BOT_TOKEN='test:account-token';
 try{
 await db.exec(fs.readFileSync('migrations/miniapp/003_telegram_accounts.sql','utf8'));database.catalogDatabase=()=>({query:(s,v)=>db.query(s,v)});
 const {POST}=require('../app/api/account/route.ts');assert.equal((await POST(new Request('https://test',{method:'POST',body:'{"id":42}'}))).status,401);
 const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id:42,first_name:'Verified',username:'owner',photo_url:'https://t.me/i/userpic/320/test.jpg'})});const check=[...p.entries()].sort(([a],[b])=>a<b?-1:1).map(([k,v])=>`${k}=${v}`).join('\n');const key=crypto.createHmac('sha256','WebAppData').update(process.env.TELEGRAM_BOT_TOKEN).digest();p.set('hash',crypto.createHmac('sha256',key).update(check).digest('hex'));
 const request=()=>new Request('https://test',{method:'POST',headers:{'X-Telegram-Init-Data':p.toString()},body:JSON.stringify({id:99,first_name:'Forged'})});
 const result=await POST(request());assert.equal(result.status,200);assert.deepEqual((await result.json()).account,{telegramId:42,firstName:'Verified',lastName:'',username:'owner',photoUrl:'https://t.me/i/userpic/320/test.jpg'});
 assert.equal((await POST(request())).status,200);assert.equal((await db.query('SELECT * FROM vaynexo_accounts')).rows.length,1);
 assert.equal((await db.query('SELECT * FROM vaynexo_accounts WHERE telegram_id=99')).rows.length,0);
 p.set('user',JSON.stringify({id:99}));assert.equal((await POST(request())).status,401);
 }finally{database.catalogDatabase=original;if(oldToken===undefined)delete process.env.TELEGRAM_BOT_TOKEN;else process.env.TELEGRAM_BOT_TOKEN=oldToken;await db.close();}
});
