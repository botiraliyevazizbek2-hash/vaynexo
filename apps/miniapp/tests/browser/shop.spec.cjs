const {test,expect}=require('@playwright/test');
const {products,mockCatalog}=require('./catalog-fixture.cjs');
test.beforeEach(async({page})=>{await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));await mockCatalog(page);});
test('one supplier catalog supports search, filters, sorting and selection with no duplicate demo grid',async({page})=>{
 await page.goto('/?tab=shop&lang=en');
 await expect(page.locator('.catalog-grid')).toHaveCount(1);await expect(page.locator('.product-card')).toHaveCount(4);await expect(page.getByRole('heading',{name:'56 Diamonds',exact:true})).toHaveCount(0);await expect(page.locator('.live-catalog')).toHaveCount(0);
 await expect(page.getByLabel('Sort',{exact:true})).toHaveCount(0);await expect(page.locator('.shop-promo')).toHaveCount(0);await expect(page.locator('.catalog-grid h3').first()).toHaveText('12 Diamonds');
 await page.getByPlaceholder('Search products...').fill('19');await expect(page.locator('.product-card')).toHaveCount(1);await page.getByRole('button',{name:'Select',exact:true}).click();await expect(page.locator('.selected-product-name')).toContainText('19 Diamonds');await expect(page.locator('.checkout-total')).toContainText('5 132 UZS');
 await page.getByRole('button',{name:'Increase',exact:true}).click();await expect(page.locator('.checkout-total')).toContainText('10 264 UZS');await expect(page.getByRole('button',{name:'Payments coming soon'})).toBeDisabled();await expect(page.locator('.shop-payment')).toHaveCount(0);
 await page.locator('#mlbb-id').fill('123x');await page.getByRole('button',{name:'Check format',exact:true}).click();await expect(page.locator('#mlbb-id')).toHaveAttribute('aria-invalid','true');
 await page.getByPlaceholder('Search products...').fill('missing');await expect(page.getByRole('heading',{name:'No products found'})).toBeVisible();await page.getByRole('button',{name:'Clear filters'}).click();
 await page.locator('.category-pills').getByRole('button',{name:'Passes',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(1);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 const color=await page.locator('.product-card p').first().evaluate(e=>getComputedStyle(e).color);expect(color).toBe('rgb(138, 154, 185)');
});
test('home Mobile Legends card opens the supplier catalog',async({page})=>{
 await page.goto('/?lang=en');await page.locator('.v-service-card').filter({hasText:'Mobile Legends'}).click();await expect(page.locator('.catalog-grid .product-card')).toHaveCount(4);await expect(page.locator('.catalog-grid')).toContainText('12 Diamonds');
});
test('refresh updates selected retail price and clears offers removed by supplier',async({page})=>{
 let current=products;
 await page.route('**/api/catalog',r=>r.fulfill({json:{ok:true,status:'ready',products:current}}));
 await page.clock.install();await page.goto('/?tab=shop&lang=en');await page.locator('.product-card').first().getByRole('button',{name:'Select',exact:true}).click();await expect(page.locator('.checkout-total')).toContainText('3 258 UZS');
 current=products.map((p,i)=>i===0?{...p,price:4000}:p);await page.clock.fastForward(61000);await expect(page.locator('.checkout-total')).toContainText('4 000 UZS');
 current=[];await page.clock.fastForward(61000);await expect(page.locator('.product-card')).toHaveCount(0);await expect(page.locator('.selected-product')).toHaveCount(0);
});
test('unconfigured, failed and empty catalog states never restore demo offers',async({page})=>{
 for(const status of ['awaiting_pricing','unavailable','ready']){
  await page.route('**/api/catalog',r=>r.fulfill({json:{ok:true,status,products:[]}}));await page.goto('/?tab=shop&lang=en');await expect(page.locator('.empty-state')).toBeVisible();await expect(page.locator('.product-card')).toHaveCount(0);
 }
});
test('legacy demo history remains readable after catalog replacement',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('vaynexo.demo-orders.v1.browser',JSON.stringify({version:1,orders:[{id:'5c47d67c-a6c9-4086-a932-a85567e83afa',createdAt:'2026-10-26T10:00:00Z',productId:'d56',quantity:1,unitPrice:14000,userId:'842190334',serverId:'5143',payment:'click'}]})));
 await page.goto('/?tab=order&lang=en');await expect(page.locator('.demo-history .history-row')).toHaveCount(1);await expect(page.locator('.order-summary-card')).toContainText('14 000 UZS');
});
test('server row defaults to Global, isolates duplicate packages and clears selection when server changes',async({page})=>{
 const {foreignProducts}=require('./catalog-fixture.cjs');
 await page.route('**/api/catalog',r=>r.fulfill({json:{ok:true,status:'ready',products:[...foreignProducts,...products]}}));
 await page.goto('/?tab=shop&lang=en');const tabs=page.getByRole('group',{name:'Servers',exact:true});
 await expect(tabs.getByRole('button',{name:'Global',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.locator('.product-card')).toHaveCount(4);await expect(page.locator('.catalog-grid')).not.toContainText('Indonesia');
 await page.locator('.product-card').first().getByRole('button',{name:'Select',exact:true}).click();await expect(page.locator('.selected-product-name')).toContainText('12 Diamonds');
 await tabs.getByRole('button',{name:'SG',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(1);await expect(page.locator('.product-card')).toContainText('Singapore');await expect(page.locator('.selected-product')).toHaveCount(0);
 await page.getByPlaceholder('Search products...').fill('missing');await tabs.getByRole('button',{name:'RU',exact:true}).click();await expect(page.getByPlaceholder('Search products...')).toBeEmpty();await expect(page.locator('.product-card')).toContainText('Mobile Legends (RU)');
 await page.locator('.side-nav').getByRole('button',{name:'Home',exact:true}).click();await page.locator('.v-service-card').filter({hasText:'Mobile Legends'}).click();await expect(page.locator('.catalog-grid .product-card')).toHaveCount(1);await expect(page.locator('.catalog-grid')).toContainText('50 Diamonds');
 await page.locator('.side-nav').getByRole('button',{name:'Shop',exact:true}).click();await expect(tabs.getByRole('button',{name:'RU',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.setViewportSize({width:390,height:844});await tabs.getByRole('button',{name:'Turkey',exact:true}).click();await expect(page.locator('.product-card')).toContainText('11 Diamonds');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:'../server-tabs-review.png',fullPage:true,timeout:10000});
});
