// Private build/CLI check: GET only. No purchases, credentials or personal details in output.
const fs = require('node:fs');
for (const file of ['.env.local', '.env']) if (fs.existsSync(file)) process.loadEnvFile(file);
(async () => {
  const { createResellcodesClient } = await import('../lib/suppliers/resellcodes.ts');
  const client = createResellcodesClient();
  const profile = await client.getProfile();
  if (!profile.active) { process.exitCode = 63; return; }
  const categories = await client.getTopupCategories();
  const mlbb = categories.filter(p => /mobile[\s_-]*legends|\bmlbb\b/i.test(p.id + ' ' + p.name));
  if (!mlbb.length || mlbb.length > 20) { process.exitCode = 64; return; }
  let offers = 0;
  const products = [];
  for (const p of mlbb) {
    // Sequential reads respect the default 30 requests/min account limit.
    const catalog = await client.getTopupOffers(p.id);
    offers += catalog.offers.length;
    products.push({ id: p.id, name: p.name, offerCount: catalog.offers.length, requiredFields: catalog.fields });
  }
  console.log(JSON.stringify({ provider: 'resellcodes', authenticated: true, active: true, mlbbProducts: products, validatedPriceCurrency: 'USD', paidOrdersSent: 0, uzbekAccountDelivery: 'not_yet_tested' }));
  if (!offers) process.exitCode = 64;
})().catch(error => {
  console.error('ReSellCodes check failed:', error?.name === 'ResellcodesError' ? error.code : 'unexpected_error');
  process.exitCode = ({ not_configured: 60, unauthorized: 61, forbidden: 63, invalid_response: 65, network: 66, rate_limited: 67 })[error?.code] ?? 68;
});
