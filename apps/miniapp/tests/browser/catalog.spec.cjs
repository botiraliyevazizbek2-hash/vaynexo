const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));});
test('admin is denied without server-verified permission',async({page})=>{
 await page.goto('/admin?lang=en');await expect(page.locator('.pricing-shell [role=alert]')).toHaveText('Admin access only.');await expect(page.getByRole('button',{name:'Save and apply prices'})).toHaveCount(0);
});
test('admin markup form submits decimal strings and shop renders only retail price',async({page})=>{
 const item={id:'rsc:global:55',title:'55 Diamonds',subtitle:'Mobile Legends Global',supplierPriceUSD:'1.0000',price:14300};
 let saved;
 await page.route('**/api/admin/pricing',async r=>{if(r.request().method()==='POST')saved=r.request().postDataJSON();await r.fulfill({json:{ok:true,settings:{markup:'10',rate:'13000',version:saved?1:0},products:[item],status:'ready'}});});
 await page.goto('/admin?lang=en');await page.getByLabel('Markup (%)',{exact:true}).fill('10.25');await page.getByLabel('1 USD = how many UZS?').fill('13500.1234');await page.getByRole('button',{name:'Save and apply prices'}).click();await expect(page.getByRole('status')).toContainText('Saved.');expect(saved).toEqual({markup:'10.25',rate:'13500.1234',version:0});
 await page.route('**/api/catalog',r=>r.fulfill({json:{ok:true,status:'ready',products:[{...item,supplierPriceUSD:undefined}]}}));
 await page.goto('/?tab=shop&lang=en');await expect(page.locator('.live-catalog')).toContainText('55 Diamonds');await expect(page.locator('.live-catalog')).toContainText('14 300 UZS');await expect(page.locator('.live-catalog')).not.toContainText('1.0000');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
