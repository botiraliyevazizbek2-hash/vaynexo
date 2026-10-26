// Owner-only CLI/build check. Makes GET requests only; never purchases or activates a subscription.
const fs=require('node:fs');
for(const file of ['.env.local','.env'])if(fs.existsSync(file))process.loadEnvFile(file);
(async()=>{
 if(!process.env.VIRAPIN_API_KEY){console.error('Virapin check: VIRAPIN_API_KEY is not configured.');process.exitCode=1;return;}
 const {createVirapinClient}=await import('../lib/suppliers/virapin.ts');
 const client=createVirapinClient();const profile=await client.getProfile();const catalog=await client.getCatalog();
 const mlbb=catalog.filter(p=>/mobile\s*legends|\bmlbb\b/i.test(p.name));
 console.log(JSON.stringify({provider:'virapin',authenticated:true,resellerApproved:profile.status==='approved',apiEnabled:profile.apiStatus==='enabled',subscriptionActive:profile.subscriptionActive,mlbbProducts:mlbb.map(p=>({id:p.id,name:p.name,tierCount:p.tiers.length})),paidOrdersSent:0}));
 if(!mlbb.length||profile.status!=='approved'||profile.apiStatus!=='enabled')process.exitCode=1;
})().catch(error=>{console.error('Virapin check failed:',error?.name==='VirapinError'?error.code:'unexpected_error');process.exitCode=1;});
