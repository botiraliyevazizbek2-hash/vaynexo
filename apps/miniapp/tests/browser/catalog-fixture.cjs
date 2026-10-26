const products=[
 {id:'rsc:global:12',title:'12 Diamonds',subtitle:'Mobile Legends (Global)',diamonds:'12',icon:'diamond',price:3258,supplier:'resellcodes'},
 {id:'rsc:global:19',title:'19 Diamonds',subtitle:'Mobile Legends (Global)',diamonds:'19',icon:'diamond',price:5132,supplier:'resellcodes'},
 {id:'rsc:global:28',title:'28 Diamonds',subtitle:'Mobile Legends (Global)',diamonds:'28',icon:'diamond',price:7460,supplier:'resellcodes'},
 {id:'rsc:global:weekly',title:'Weekly Diamond Pass',subtitle:'Mobile Legends (Global)',diamonds:'Pass',icon:'ticket',price:11723,supplier:'resellcodes'},
];
const foreignProducts=[
 {id:'rsc:mobile_legends_indonesia:5',title:'5 Diamonds',subtitle:'Mobile Legends (Indonesia)',diamonds:'5',icon:'diamond',price:1377,supplier:'resellcodes'},
 {id:'rsc:mobile_legends_singapore:5',title:'5 Diamonds',subtitle:'Mobile Legends (Singapore)',diamonds:'5',icon:'diamond',price:1377,supplier:'resellcodes'},
 {id:'rsc:mobile_legends_ru:50',title:'50 Diamonds',subtitle:'Mobile Legends (RU)',diamonds:'50',icon:'diamond',price:9000,supplier:'resellcodes'},
 {id:'rsc:mobile_legends_turkey:11',title:'11 Diamonds',subtitle:'Mobile Legends (Turkey)',diamonds:'11',icon:'diamond',price:3500,supplier:'resellcodes'},
];
async function mockCatalog(page){await page.route('**/api/catalog',r=>r.fulfill({json:{ok:true,status:'ready',products}}));}
module.exports={products,foreignProducts,mockCatalog};
