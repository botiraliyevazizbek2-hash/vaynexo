const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),crypto=require('node:crypto');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {signedPhotoUrl}=require('../lib/account/photo.ts'),{POST}=require('../app/api/account/photo/route.ts');
const token='123:photo-test-secret';
function request(){const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id:42})});const s=[...p.entries()].sort(([a],[b])=>a<b?-1:1).map(([k,v])=>`${k}=${v}`).join('\n');p.set('hash',crypto.createHmac('sha256',crypto.createHmac('sha256','WebAppData').update(token).digest()).update(s).digest('hex'));return new Request('https://test',{method:'POST',headers:{'X-Telegram-Init-Data':p.toString()},body:'{"user_id":99}'});}
test('signed profile photo URL permits HTTPS images and rejects unsafe schemes and credentials',()=>{
 assert.equal(signedPhotoUrl('https://t.me/i/userpic/320/a.svg'),'https://t.me/i/userpic/320/a.svg');
 for(const u of [undefined,'javascript:alert(1)','data:image/png;base64,a','http://t.me/a.jpg','https://user:pass@t.me/a.jpg'])assert.equal(signedPhotoUrl(u),null);
});
test('private avatar route uses only signed user ID, returns image bytes and never exposes bot download URL',async()=>{
 const oldFetch=global.fetch,oldToken=process.env.TELEGRAM_BOT_TOKEN;process.env.TELEGRAM_BOT_TOKEN=token;
 const calls=[];const bytes=Buffer.from([255,216,255,224,0,16]);
 try{
 global.fetch=async(url,options)=>{calls.push({url,options});if(url.endsWith('/getUserProfilePhotos'))return Response.json({ok:true,result:{photos:[[{file_id:'small'},{file_id:'large'}]]}});if(url.endsWith('/getFile'))return Response.json({ok:true,result:{file_path:'photos/file_1.jpg',file_size:bytes.length}});return new Response(bytes,{headers:{'Content-Type':'application/octet-stream'}});};
 assert.equal((await POST(new Request('https://test',{method:'POST'}))).status,401);assert.equal(calls.length,0);
 const response=await POST(request());assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'image/jpeg');assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);
 assert.deepEqual(JSON.parse(calls[0].options.body),{user_id:42,limit:1});assert.deepEqual(JSON.parse(calls[1].options.body),{file_id:'large'});assert.equal(response.headers.get('Location'),null);
 }finally{global.fetch=oldFetch;if(oldToken===undefined)delete process.env.TELEGRAM_BOT_TOKEN;else process.env.TELEGRAM_BOT_TOKEN=oldToken;}
});
test('missing photo returns 204; untrusted paths and provider errors are contained',async()=>{
 const oldFetch=global.fetch,oldToken=process.env.TELEGRAM_BOT_TOKEN;process.env.TELEGRAM_BOT_TOKEN=token;
 try{
 global.fetch=async()=>Response.json({ok:true,result:{photos:[]}});assert.equal((await POST(request())).status,204);
 let calls=0;global.fetch=async url=>{calls++;return Response.json({ok:true,result:url.endsWith('/getUserProfilePhotos')?{photos:[[{file_id:'large'}]]}:{file_path:'../private'}});};
 const response=await POST(request());assert.equal(response.status,502);assert.equal(calls,2);assert.equal((await response.text()).includes(token),false);
 global.fetch=async()=>{throw Error(token);};const failure=await POST(request());assert.equal(failure.status,502);assert.equal((await failure.text()).includes(token),false);
 }finally{global.fetch=oldFetch;if(oldToken===undefined)delete process.env.TELEGRAM_BOT_TOKEN;else process.env.TELEGRAM_BOT_TOKEN=oldToken;}
});
