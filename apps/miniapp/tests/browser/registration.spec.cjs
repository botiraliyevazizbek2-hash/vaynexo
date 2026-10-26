const {test,expect}=require('@playwright/test');
const {mockCatalog}=require('./catalog-fixture.cjs');
test.beforeEach(async({page})=>{await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));await mockCatalog(page);});
function fixture(page,shared=true){return page.addInitScript(shared=>{window.Telegram={WebApp:{initData:'signed-fixture',ready(){},expand(){},requestContact(callback){window.contactRequested=(window.contactRequested||0)+1;callback(shared);}}};},shared);}
async function account(page){await page.route('**/api/account',async route=>{expect(route.request().headers()['x-telegram-init-data']).toBe('signed-fixture');await route.fulfill({json:{ok:true,account:{telegramId:42,firstName:'Ozodbek',lastName:'Qosimov',username:'ozodbek'}}});});}
test('app opens immediately, account syncs automatically and phone linking is optional and server-confirmed',async({page})=>{
 await fixture(page);await account(page);let registered=false;const calls=[];
 await page.route('**/api/registration',async route=>{const data=route.request().postDataJSON();calls.push(data);await route.fulfill({json:{ok:true,registered,maskedPhone:registered?'•••• 0123':null}});});
 await page.goto('/?tab=shop&lang=en');await expect(page.locator('.app-shell')).toBeVisible();await expect(page.locator('.registration-shell')).toHaveCount(0);expect(calls).toEqual([]);expect(await page.evaluate(()=>window.contactRequested||0)).toBe(0);
 await page.locator('.side-nav').getByRole('button',{name:'Profile',exact:true}).click();await expect(page.getByRole('heading',{name:'Ozodbek Qosimov',exact:true})).toBeVisible();await expect(page.locator('.profile-hero')).toContainText('Telegram ID: 42');
 await page.getByRole('button',{name:'Add phone number',exact:true}).click();const share=page.getByRole('button',{name:'Share my Telegram number',exact:true});await expect(share).toBeDisabled();await page.locator('.phone-link-form input').check();await share.click();await expect(page.getByRole('button',{name:'Waiting for Telegram confirmation...',exact:true})).toBeVisible();await expect(page.locator('.app-shell')).toBeVisible();
 expect(calls.find(c=>c.action==='begin')).toEqual({action:'begin',consent:true});registered=true;await expect(page.locator('.optional-phone')).toContainText('•••• 0123',{timeout:8000});await expect(page.getByRole('button',{name:'Add phone number',exact:true})).toHaveCount(0);expect(await page.evaluate(()=>Object.values(localStorage))).not.toContain('•••• 0123');
 await page.reload();await expect(page.locator('.app-shell')).toBeVisible();
});
test('declining phone sharing never blocks app navigation and optional form can be closed',async({page})=>{
 await fixture(page,false);await account(page);await page.route('**/api/registration',r=>r.fulfill({json:{ok:true,registered:false}}));
 await page.goto('/?tab=profile&lang=en');await page.getByRole('button',{name:'Add phone number'}).click();await page.locator('.phone-link-form input').check();await page.getByRole('button',{name:'Share my Telegram number',exact:true}).click();await expect(page.locator('.optional-phone [role=alert]')).toContainText('No number was shared');
 await page.getByRole('button',{name:'Later',exact:true}).click();await expect(page.locator('.phone-link-form')).toHaveCount(0);await page.locator('.side-nav').getByRole('button',{name:'Shop',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(4);
});
test('account service failure cannot cover the app with a registration gate',async({page})=>{
 await fixture(page);await page.route('**/api/account',r=>r.fulfill({status:503,json:{ok:false}}));await page.goto('/?tab=shop&lang=en');await expect(page.locator('.product-card')).toHaveCount(4);await page.locator('.side-nav').getByRole('button',{name:'Profile',exact:true}).click();await expect(page.getByText('Could not save your profile. Try again.')).toBeVisible();await expect(page.locator('.registration-shell')).toHaveCount(0);
});
test('browser visits and old register URL open the app without inventing a Telegram account',async({page})=>{
 let calls=0;await page.route('**/api/account',r=>{calls++;return r.fulfill({status:401,json:{ok:false}});});await page.goto('/register?lang=en');await expect(page.locator('.app-shell')).toBeVisible();await expect(page.locator('.profile-name-line')).toContainText(/Mehmon|Guest/);expect(calls).toBe(0);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:'../optional-phone-review.png',fullPage:true});
});
test('profile displays Telegram photo above the name, without duplicate heading or top avatar',async({page})=>{
 await fixture(page);await page.route('**/api/registration',r=>r.fulfill({json:{ok:true,registered:false}}));
 await page.route('**/api/account',r=>r.fulfill({json:{ok:true,account:{telegramId:42,firstName:'Ozodbek',lastName:'Qosimov',username:'ozodbek',photoUrl:'https://t.me/i/userpic/320/test.jpg'}}}));
 await page.route('https://t.me/i/userpic/320/test.jpg',r=>r.fulfill({contentType:'image/jpeg',body:require('node:fs').readFileSync('public/images/hero-banner.jpg')}));
 await page.goto('/?tab=profile&lang=en');await expect(page.getByRole('img',{name:'Telegram profile photo'})).toBeVisible();await expect.poll(()=>page.locator('.profile-avatar img').evaluate(img=>img.naturalWidth>0)).toBeTruthy();await expect(page.locator('.profile-page .page-intro,.top-avatar')).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});const photo=await page.locator('.profile-avatar').boundingBox(),name=await page.locator('.profile-name-line').boundingBox();expect(photo.y+photo.height).toBeLessThan(name.y);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:'../telegram-photo-review.png',fullPage:true});
});
