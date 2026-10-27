const {spawn}=require('node:child_process'),{createHmac,randomInt}=require('node:crypto'),assert=require('node:assert/strict'),{Client}=require('pg');
(async()=>{
 const token=process.env.TELEGRAM_BOT_TOKEN;if(!token||!process.env.OPENAI_API_KEY)throw Error('not_configured');
 const id=4000000000000000+randomInt(1000000000),db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000});let server,created=false;
 try{
 await db.connect();assert.equal((await db.query('SELECT telegram_id FROM vaynexo_ai_limits WHERE telegram_id=$1',[id])).rowCount,0);
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3198'],{stdio:'ignore',env:{...process.env,NODE_ENV:'production'}});
 let ready=false;for(let i=0;i<40;i++){try{const r=await fetch('http://127.0.0.1:3198/api/ai/chat',{method:'POST',signal:AbortSignal.timeout(1000)});if(r.status===401){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 const params=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id})}),check=[...params.entries()].sort(([a],[b])=>a<b?-1:1).map(([k,v])=>k+'='+v).join('\n');
 params.set('hash',createHmac('sha256',createHmac('sha256','WebAppData').update(token).digest()).update(check).digest('hex'));created=true;
 const response=await fetch('http://127.0.0.1:3198/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json','X-Telegram-Init-Data':params.toString()},body:JSON.stringify({messages:[{role:'user',content:'Reply with exactly OK.'}],language:'en'}),signal:AbortSignal.timeout(55000)});
 const data=await response.json();if(!response.ok||typeof data.text!=='string'||!data.text.trim())throw Error('ai_probe_'+String(data.error??response.status));
 console.log('AI verification PASS: signed HTTP request, PostgreSQL quota and real provider reply.');
 }finally{try{if(created)await db.query('DELETE FROM vaynexo_ai_limits WHERE telegram_id=$1',[id]);}finally{server?.kill('SIGTERM');await db.end();}}
})().catch(e=>{console.error('AI verification FAILED:',/^ai_probe_[a-z0-9_]+$/.test(e.message)?e.message:'configuration_or_network');process.exitCode=1;});
