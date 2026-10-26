const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {validPlayer,validQuantity,parseHistory}=require('../lib/shop/checkout.ts');
const order={id:'5c47d67c-a6c9-4086-a932-a85567e83afa',createdAt:'2026-10-26T10:00:00Z',productId:'d56',quantity:3,unitPrice:14000,userId:'842190334',serverId:'5143',payment:'click'};
const saved=orders=>JSON.stringify({version:1,orders});
test('player input rejects malformed IDs instead of silently changing them',()=>{
 assert.ok(validPlayer('842190334','5143'));
 for(const [id,zone]of [['',''],['01234','5143'],['12345','01'],['12345x','5143'],[' 12345','5143'],['12345','1'],['12345','123456789']])assert.equal(validPlayer(id,zone),false);
 for(const n of [0,-1,1.5,11,NaN])assert.equal(validQuantity(n),false);
});
test('local history keeps snapshots, rejects corrupt entries and bounds storage',()=>{
 assert.deepEqual(parseHistory(saved([order])),[order]);
 assert.equal(parseHistory(saved([order,order])).length,1);
 for(const override of [{quantity:11},{unitPrice:-2},{productId:'missing'},{userId:'bad'},{payment:'bank'},{createdAt:'bad'}])assert.deepEqual(parseHistory(saved([{...order,...override}])),[]);
 for(const raw of [null,'{}','null','{','x'.repeat(50001),JSON.stringify({version:2,orders:[order]})])assert.deepEqual(parseHistory(raw),[]);
 const many=Array.from({length:30},(_,i)=>({...order,id:`5c47d67c-a6c9-4086-a932-${String(i).padStart(12,'0')}`}));
 assert.equal(parseHistory(saved(many)).length,20);
});
