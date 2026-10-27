const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {parseAIInput,createAIClient}=require('../lib/ai/client.ts');
const {claimAIRequest}=require('../lib/ai/limits.ts');const {PGlite}=require('@electric-sql/pglite');
test('AI validates conversation roles, input lengths and language',()=>{
 assert.deepEqual(parseAIInput({messages:[{role:'user',content:' hi '}],language:'uz'}),{messages:[{role:'user',content:'hi'}],language:'uz'});
 for(const data of [{messages:[{role:'system',content:'evil'}],language:'uz'},{messages:[{role:'user',content:'a'.repeat(2001)}],language:'en'},{messages:[],language:'en'},{messages:[{role:'assistant',content:'hi'}],language:'uz'},{messages:[{role:'user',content:'hi'}],language:'bad'}])assert.throws(()=>parseAIInput(data));
});
test('AI provider call keeps auth server-side, bounds tokens and disables stored responses',async()=>{
 let call;const api=createAIClient({apiKey:'test-private-key',fetchImpl:async(url,options)=>{call={url,options};return Response.json({output:[{content:[{type:'output_text',text:'Salom'}]}]});}});
 assert.equal(await api.reply(parseAIInput({messages:[{role:'user',content:'Hi'}],language:'uz'})),'Salom');
 assert.equal(call.url,'https://api.openai.com/v1/responses');assert.equal(call.options.headers.Authorization,'Bearer test-private-key');const body=JSON.parse(call.options.body);assert.equal(body.store,false);assert.equal(body.max_output_tokens,1200);assert.equal(body.model,'gpt-6.1-terra');assert.equal(body.input[0].role,'user');assert.equal(body.user,undefined);
 const bad=createAIClient({apiKey:'test-private-key',fetchImpl:async()=>new Response('test-private-key',{status:401})});await assert.rejects(bad.reply({messages:[{role:'user',content:'Hi'}],language:'en'}),e=>e.code==='provider_auth'&&!e.message.includes('private-key'));
});
test('shared PostgreSQL AI quota enforces cooldown and daily limit',async()=>{
 const db=new PGlite();try{await db.exec(fs.readFileSync('migrations/miniapp/004_ai_limits.sql','utf8'));const q=(s,v)=>db.query(s,v);assert.equal(await claimAIRequest(q,42),true);assert.equal(await claimAIRequest(q,42),false);await db.query("UPDATE vaynexo_ai_limits SET next_request_at=now()-interval '1 second',requests=100 WHERE telegram_id=42");assert.equal(await claimAIRequest(q,42),false);await db.query("UPDATE vaynexo_ai_limits SET usage_day=CURRENT_DATE-1 WHERE telegram_id=42");assert.equal(await claimAIRequest(q,42),true);assert.equal((await db.query('SELECT requests FROM vaynexo_ai_limits WHERE telegram_id=42')).rows[0].requests,1);}finally{await db.close();}
});
test('AI route rejects unsigned callers before provider or database work',async()=>{
 const {POST}=require('../app/api/ai/chat/route.ts');assert.equal((await POST(new Request('https://test',{method:'POST',body:'{}'}))).status,401);
});

test('provider quota and rate limits are distinct and never expose response details',async()=>{
 for(const [body,code] of [[{error:{code:'insufficient_quota',message:'private details'}},'provider_quota'],[{error:{code:'rate_limit_exceeded',message:'private details'}},'provider_limit']]){
 const api=createAIClient({apiKey:'test-private-key',fetchImpl:async()=>Response.json(body,{status:429})});
 await assert.rejects(api.reply({messages:[{role:'user',content:'Hi'}],language:'en'}),e=>e.code===code&&!e.message.includes('private'));
 }
});
