const products=[
 {id:'rsc:global:12',title:'12 Diamonds',subtitle:'Mobile Legends (Global)',diamonds:'12',icon:'diamond',price:3258,supplier:'resellcodes'},
 {id:'rsc:global:19',title:'19 Diamonds',subtitle:'Mobile Legends (Global)',diamonds:'19',icon:'diamond',price:5132,supplier:'resellcodes'},
 {id:'rsc:global:28',title:'28 Diamonds',subtitle:'Mobile Legends (Global)',diamonds:'28',icon:'diamond',price:7460,supplier:'resellcodes'},
 {id:'rsc:global:weekly',title:'Weekly Diamond Pass',subtitle:'Mobile Legends (Global)',diamonds:'Pass',icon:'ticket',price:11723,supplier:'resellcodes'},
];
async function mockCatalog(page){await page.route('**/api/catalog',r=>r.fulfill({json:{ok:true,status:'ready',products}}));}
module.exports={products,mockCatalog};
