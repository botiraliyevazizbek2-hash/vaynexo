const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));});
function fixture(page,shared=true){return page.addInitScript(shared=>{window.Telegram={WebApp:{initData:'signed-fixture',ready(){},expand(){},requestContact(callback){window.contactRequested=(window.contactRequested||0)+1;callback(shared);}}};},shared);}
test('contact callback alone cannot open app; server confirmation does, including on reload',async({page})=>{
 await fixture(page);let registered=false;const calls=[];
 await page.route('**/api/registration',async route=>{const data=route.request().postDataJSON();calls.push(data);expect(route.request().headers()['x-telegram-init-data']).toBe('signed-fixture');await route.fulfill({json:{ok:true,registered,maskedPhone:registered?'•••• 0123':null}});});
 await page.goto('/?lang=en');const share=page.getByRole('button',{name:'Share my Telegram number',exact:true});await expect(share).toBeDisabled();await page.locator('.shop-confirm input').check();await share.click();
 await expect(page.getByRole('button',{name:'Waiting for Telegram confirmation...',exact:true})).toBeVisible();await expect(page.locator('.app-shell')).toHaveCount(0);
 expect(calls.find(c=>c.action==='begin')).toEqual({action:'begin',consent:true});
 registered=true;await expect(page.locator('.app-shell')).toBeVisible({timeout:8000});await page.reload();await expect(page.locator('.app-shell')).toBeVisible();
 expect(await page.evaluate(()=>Object.values(localStorage))).not.toContain('•••• 0123');
});
test('cancelled native contact request leaves registration closed and retry is possible',async({page})=>{
 await fixture(page,false);await page.route('**/api/registration',r=>r.fulfill({json:{ok:true,registered:false}}));
 await page.goto('/?lang=en');await page.locator('.shop-confirm input').check();await page.getByRole('button',{name:'Share my Telegram number',exact:true}).click();
 await expect(page.locator('.registration-card').getByRole('alert')).toContainText('No number was shared');await expect(page.locator('.app-shell')).toHaveCount(0);await expect(page.getByRole('button',{name:'Share my Telegram number',exact:true})).toBeEnabled();
 await page.locator('.registration-top select').selectOption('ru');await expect(page.getByRole('heading',{name:'Регистрация по номеру телефона'})).toBeVisible();await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('browser cannot bypass registration with a local storage flag',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('registered','true'));await page.goto('/?lang=en');
 await expect(page.getByRole('link',{name:'Open Telegram bot'})).toBeVisible();await expect(page.locator('.app-shell')).toHaveCount(0);
});
