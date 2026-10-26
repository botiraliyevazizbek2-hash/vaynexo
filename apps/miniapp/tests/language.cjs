const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),crypto=require('node:crypto');
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);
const {translate}=require('../lib/i18n/core.ts');
const {validateInitData}=require('../lib/telegram/auth.ts');
const bot=require('../lib/telegram/bot.ts');
const webhook=require('../app/api/telegram/webhook/route.ts');
const preferences=require('../app/api/preferences/language/route.ts');
const token='123:test-token';const secret='test-secret';
process.env.TELEGRAM_BOT_TOKEN=token;process.env.TELEGRAM_WEBHOOK_SECRET=secret;
function signed(id=42,date=Math.floor(Date.now()/1000)){
 const params=new URLSearchParams({auth_date:String(date),user:JSON.stringify({id,language_code:'en'}),query_id:'test'});
 const check=[...params.entries()].sort(([a],[b])=>a<b?-1:1).map(([k,v])=>`${k}=${v}`).join('\n');
 const key=crypto.createHmac('sha256','WebAppData').update(token).digest();
 params.set('hash',crypto.createHmac('sha256',key).update(check).digest('hex'));return params.toString();
}
const originalFetch=global.fetch;
test.after(()=>{global.fetch=originalFetch;});
test('all dictionary entries have both translations and placeholders are preserved',()=>{
 const messages=require('../lib/i18n/messages.json');
 for(const [key,m]of Object.entries(messages)){for(const lang of ['ru','en']){assert.ok(m[lang]?.trim(),key);assert.deepEqual(m[lang].match(/\{\w+\}/g)||[],key.match(/\{\w+\}/g)||[]);}}
 assert.equal(translate('ru','56 Olmos'),'56 алмазов');assert.equal(translate('en','Do‘kon'),'Shop');assert.equal(translate('uz','Do‘kon'),'Do‘kon');
});
test('all bot commands, welcome, help and buttons use selected language',()=>{
 for(const l of ['ru','en'])for(const c of ['start','app','shop','coach','arena','news','help','language',null]){
 const r=bot.buildReply(c,'<Name>',true,l);assert.ok(r);assert.ok(!/[‘ʻ]/.test(r.text));
 for(const row of r.reply_markup?.inline_keyboard??[])for(const b of row)if(b.web_app)assert.equal(new URL(b.web_app.url).searchParams.get('lang'),l);
 }
 assert.ok(bot.buildReply('start','<Name>',true,'en').text.includes('&lt;Name&gt;'));
 assert.equal(bot.parseCommand('/start@VaynexoBot'),'start');assert.equal(bot.parseCommand('/start@OtherBot'),null);
 assert.equal(bot.buildReply(null,'A',false),null);
 for(const b of bot.buildReply('start','A',false,'ru').reply_markup.inline_keyboard.flat())assert.equal(b.web_app,undefined);
});
test('signed Telegram identity rejects tampering, duplicates, old and future sessions',()=>{
 assert.equal(validateInitData(signed(),token).id,42);
 assert.equal(validateInitData(signed().replace('42','43'),token),null);
 assert.equal(validateInitData(signed()+'&auth_date=1',token),null);
 assert.equal(validateInitData(signed(42,1),token),null);
 assert.equal(validateInitData(signed(42,Math.floor(Date.now()/1000)+120),token),null);
 assert.equal(validateInitData(signed(),'wrong'),null);
});
test('unauthenticated preference changes never call Telegram',async()=>{
 global.fetch=()=>{throw Error('must not call');};
 assert.equal((await preferences.POST(new Request('https://test/api',{method:'POST',body:JSON.stringify({action:'set',language:'ru',user_id:9})}))).status,401);
});
test('preference API only changes the signed user and persists through Telegram menus',async()=>{
 const menus=new Map();const calls=[];
 global.fetch=async(url,options)=>{const body=JSON.parse(options.body);calls.push({url,body});if(url.endsWith('/setChatMenuButton'))menus.set(body.chat_id,body.menu_button);return Response.json({ok:true,result:url.endsWith('/getChatMenuButton')?menus.get(body.chat_id)||{type:'default'}:true});};
 const req=b=>new Request('https://test/api',{method:'POST',headers:{'X-Telegram-Init-Data':signed()},body:JSON.stringify(b)});
 assert.equal((await preferences.POST(req({action:'set',language:'ru',user_id:999}))).status,200);
 assert.equal((await (await preferences.POST(req({action:'get'}))).json()).language,'ru');
 assert.ok(calls.every(c=>!c.body.chat_id||c.body.chat_id===42));
 assert.equal(await bot.getSavedLanguage(99,'en'),'en');
 assert.equal((await preferences.POST(req({action:'set',language:'xx'}))).status,400);
});
test('webhook locale callbacks persist preference and subsequent commands retain it',async()=>{
 let menu={type:'default'};const sent=[];
 global.fetch=async(url,options)=>{const b=JSON.parse(options.body);let result=true;if(url.endsWith('/setChatMenuButton'))menu=b.menu_button;if(url.endsWith('/getChatMenuButton'))result=menu;if(url.endsWith('/sendMessage'))sent.push(b);return Response.json({ok:true,result});};
 const req=b=>new Request('https://test/webhook',{method:'POST',headers:{'x-telegram-bot-api-secret-token':secret},body:JSON.stringify(b)});
 assert.equal((await webhook.POST(req({update_id:1,callback_query:{id:'c',data:'lang:ru',from:{id:42,first_name:'A'},message:{message_id:1,chat:{id:42,type:'private'}}}}))).status,200);
 await webhook.POST(req({update_id:2,message:{message_id:2,chat:{id:42,type:'private'},from:{id:42,language_code:'en'},text:'/help'}}));
 assert.ok(sent[0].text.includes('Добро пожаловать'));assert.ok(sent[1].text.includes('Помощь'));
 assert.equal(new URL(menu.web_app.url).searchParams.get('lang'),'ru');
});
test('webhook rejects wrong secret and malformed JSON; accepts safe empty probes',async()=>{
 assert.equal((await webhook.POST(new Request('https://test',{method:'POST',body:'{}'}))).status,401);
 assert.equal((await webhook.POST(new Request('https://test',{method:'POST',headers:{'x-telegram-bot-api-secret-token':secret},body:'{'}))).status,400);
 assert.equal((await webhook.POST(new Request('https://test',{method:'POST',headers:{'x-telegram-bot-api-secret-token':secret},body:'{"update_id":0}'}))).status,200);
});
