export type AIMessage={role:'user'|'assistant';content:string};
export class AIError extends Error { constructor(readonly code:string){super(code);this.name='AIError';} }
export function parseAIInput(data:unknown):{messages:AIMessage[];language:'uz'|'ru'|'en'}{
 if(!data||typeof data!=='object')throw new AIError('invalid_input');
 const d=data as {messages?:unknown;language?:unknown};
 if(!['uz','ru','en'].includes(String(d.language))||!Array.isArray(d.messages)||d.messages.length<1||d.messages.length>20)throw new AIError('invalid_input');
 let size=0;const messages=d.messages.map((m:unknown)=>{if(!m||typeof m!=='object')throw new AIError('invalid_input');const p=m as AIMessage;if(!['user','assistant'].includes(p.role)||typeof p.content!=='string'||!p.content.trim()||p.content.length>(p.role==='user'?2000:8000))throw new AIError('invalid_input');size+=p.content.length;return {role:p.role,content:p.content.trim()};});
 if(size>16000||messages[0].role!=='user'||messages[messages.length-1].role!=='user')throw new AIError('invalid_input');
 return {messages,language:d.language as 'uz'|'ru'|'en'};
}
export function createAIClient(options:{apiKey?:string;model?:string;fetchImpl?:typeof fetch}={}){
 if(typeof window!=='undefined')throw new AIError('unavailable');
 const key=options.apiKey??process.env.OPENAI_API_KEY;if(!key)throw new AIError('not_configured');
 const model=options.model??process.env.OPENAI_MODEL??'gpt-6.1-terra';
 return {async reply(input:ReturnType<typeof parseAIInput>){
  let response:Response;
  try{response=await (options.fetchImpl??fetch)('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model,store:false,instructions:'You are VAYNEXO, a helpful AI assistant. Answer clearly and naturally in '+({uz:'Uzbek',ru:'Russian',en:'English'}[input.language])+'. You can help with general questions and Mobile Legends. Prefer concise, useful answers. Do not claim current facts, verified game account details or actions you have not performed. Follow explicit language requests from the user.',input:input.messages,max_output_tokens:1200,reasoning:{effort:/gpt-6(?:\.1)?-(?:astra|sol)/.test(model)?'low':'none'}}),redirect:'error',signal:AbortSignal.timeout(45000)});}catch{throw new AIError('network');}
  if(!response.ok){
   let quota=false;
   if(response.status===429){try{const err=await response.json();quota=err?.error?.code==='insufficient_quota';}catch{}}
   throw new AIError(quota?'provider_quota':response.status===429?'provider_limit':response.status===401||response.status===403?'provider_auth':'provider_error');
  }
  let d;try{const raw=await response.text();if(raw.length>1000000)throw Error();d=JSON.parse(raw);}catch{throw new AIError('invalid_response');}
  const text=Array.isArray(d.output)?d.output.flatMap((o:{content?:{type?:string;text?:string}[]})=>Array.isArray(o.content)?o.content.filter(p=>p.type==='output_text'&&typeof p.text==='string').map(p=>p.text):[]).join('\n').trim():'';
  if(!text)throw new AIError('empty_response');return text.slice(0,8000);
 }};
}
