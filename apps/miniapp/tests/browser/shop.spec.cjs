const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));});
async function choose(page){await page.goto('/?tab=shop&lang=en');await page.locator('.catalog-grid .product-card').first().getByRole('button',{name:'Buy',exact:true}).click();}
async function fillPlayer(page){await page.locator('#mlbb-id').fill('842190334');await page.locator('#server-id').fill('5143');await page.getByRole('button',{name:'Check format',exact:true}).click();}
test('invalid IDs, confirmation and edits gate checkout; snapshots and history survive navigation and reload',async({page})=>{
 await choose(page);
 const submit=page.getByRole('button',{name:'Create demo order',exact:true});
 await expect(page.locator('#mlbb-id')).toBeEmpty();await expect(submit).toBeDisabled();
 await page.locator('#mlbb-id').fill('1234x');await page.locator('#server-id').fill('0');
 await page.getByRole('button',{name:'Check format',exact:true}).click();
 await expect(page.locator('#mlbb-id')).toHaveAttribute('aria-invalid','true');await expect(submit).toBeDisabled();
 await fillPlayer(page);await expect(submit).toBeDisabled();
 await page.getByRole('button',{name:'Increase',exact:true}).click();await expect(page.locator('.checkout-total')).toContainText('28 000 UZS');
 await page.locator('.shop-confirm input').check();await expect(submit).toBeEnabled();
 await page.locator('#server-id').fill('5144');await expect(submit).toBeDisabled();await expect(page.locator('.shop-confirm input')).not.toBeChecked();
 await page.getByRole('button',{name:'Check format',exact:true}).click();await page.locator('.shop-confirm input').check();await submit.dblclick();
 await expect(page.locator('.demo-history .history-row')).toHaveCount(1);await expect(page.locator('.order-summary-card')).toContainText('28 000 UZS');
 await expect(page.locator('.shop-order-player')).toContainText('5144');
 const reference=await page.locator('.order-reference b').innerText();
 await page.locator('.side-nav').getByRole('button',{name:'Shop',exact:true}).click();
 await page.locator('#mlbb-id').fill('999999999');
 await page.locator('.side-nav').getByRole('button',{name:'Orders',exact:true}).click();
 await expect(page.locator('.shop-order-player')).toContainText('842190334');
 await page.reload();await page.locator('.side-nav').getByRole('button',{name:'Orders',exact:true}).click();
 await expect(page.locator('.order-reference b')).toHaveText(reference);await expect(page.locator('.demo-history .history-row')).toHaveCount(1);
 await page.locator('.side-nav').getByRole('button',{name:'Profile',exact:true}).click();await expect(page.locator('.demo-history .history-row')).toHaveCount(1);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('translated search, empty filters and sorting work together',async({page})=>{
 await page.goto('/?tab=shop&lang=en');
 await page.getByLabel('Sort',{exact:true}).selectOption('high');await expect(page.locator('.catalog-grid h3').first()).toHaveText('568 + 56 Diamonds');
 await page.getByPlaceholder('Search products...').fill('nonexistent');await expect(page.getByRole('heading',{name:'No products found'})).toBeVisible();
 await page.getByRole('button',{name:'Clear filters'}).click();await expect(page.locator('.catalog-grid .product-card')).toHaveCount(6);
 await page.locator('.category-pills').getByRole('button',{name:'Passes',exact:true}).click();await expect(page.locator('.catalog-grid .product-card')).toHaveCount(2);
 await page.locator('.topbar select').selectOption('ru');await expect(page.getByLabel('Сортировка')).toBeVisible();
});
test('storage failures are visible instead of claiming persistence',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new Error('blocked')};});
 await choose(page);await fillPlayer(page);await page.locator('.shop-confirm input').check();await page.getByRole('button',{name:'Create demo order',exact:true}).click();
 await expect(page.getByText('Could not save to this device. New demo orders may be lost when you close the page.')).toBeVisible();
});
test('local Telegram demo histories stay separate between accounts',async({page,context})=>{
 await page.addInitScript(()=>{window.Telegram={WebApp:{initDataUnsafe:{user:{id:42}},ready(){},expand(){}}};});
 await choose(page);await fillPlayer(page);await page.locator('.shop-confirm input').check();await page.getByRole('button',{name:'Create demo order',exact:true}).click();
 await expect(page.locator('.demo-history .history-row')).toHaveCount(1);
 const other=await context.newPage();await other.route('https://telegram.org/**',r=>r.fulfill({body:''}));
 await other.addInitScript(()=>{window.Telegram={WebApp:{initDataUnsafe:{user:{id:99}},ready(){},expand(){}}};});
 await other.goto('/?tab=order&lang=en');await expect(other.getByText('No demo orders yet.')).toBeVisible();await expect(other.locator('.demo-history .history-row')).toHaveCount(0);
 await page.reload();await page.locator('.side-nav').getByRole('button',{name:'Orders',exact:true}).click();await expect(page.locator('.demo-history .history-row')).toHaveCount(1);
});
