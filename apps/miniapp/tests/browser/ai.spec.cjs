const {test,expect}=require('@playwright/test');
test('AI tab contains only a working chat and sends signed conversation history',async({page})=>{
 await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));await page.addInitScript(()=>{window.Telegram={WebApp:{initData:'signed-ai-fixture',ready(){},expand(){}}};});
 await page.route('**/api/preferences/language',r=>r.fulfill({json:{ok:true,language:'en'}}));let calls=[];
 await page.route('**/api/ai/chat',r=>{calls.push(r.request().postDataJSON());expect(r.request().headers()['x-telegram-init-data']).toBe('signed-ai-fixture');return r.fulfill({json:{ok:true,text:'Hello from AI'}});});
 await page.goto('/?tab=coach&lang=en');await expect(page.locator('.v-ai-chat')).toBeVisible();await expect(page.locator('.v-section-ad,.coach-side,.page-intro,.suggestion-row')).toHaveCount(0);await page.getByPlaceholder('Type a message...').fill('Hello');await page.getByRole('button',{name:'Send',exact:true}).click();await expect(page.locator('.v-ai-message.assistant')).toContainText('Hello from AI');expect(calls[0].messages).toEqual([{role:'user',content:'Hello'}]);
 await page.getByPlaceholder('Type a message...').fill('Next');await page.getByRole('button',{name:'Send',exact:true}).click();await expect.poll(()=>calls.length).toBe(2);expect(calls[1].messages).toHaveLength(3);
});
test('news has a compact section advertisement and no old poster',async({page})=>{
 await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));await page.goto('/?tab=news&lang=en');await expect(page.locator('.news-feature')).toHaveCount(0);await expect(page.locator('.v-section-ad.news')).toBeVisible();await expect(page.locator('.news-grid .news-card')).toHaveCount(4);
});
test('provider limits show a clear error and preserve the unsent question',async({page})=>{
 await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));
 await page.addInitScript(()=>{window.Telegram={WebApp:{initData:'signed-ai-fixture',ready(){},expand(){}}};});
 await page.route('**/api/preferences/language',r=>r.fulfill({json:{ok:true,language:'en'}}));
 await page.route('**/api/ai/chat',r=>r.fulfill({status:503,json:{ok:false,error:'provider_quota'}}));
 await page.goto('/?tab=coach&lang=en');
 await page.getByPlaceholder('Type a message...').fill('Keep my question');
 await page.getByRole('button',{name:'Send',exact:true}).click();
 await expect(page.getByRole('alert')).toHaveText('The AI service limit has been reached. Please try again later.');
 await expect(page.getByPlaceholder('Type a message...')).toHaveValue('Keep my question');
 await expect(page.locator('.v-ai-message.assistant')).toHaveCount(0);
});
