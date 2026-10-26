# VAYNEXO Mini App va Telegram bot

Haqiqiy v0 eksporti asosidagi Next.js ilova. Uch til: o‘zbekcha, ruscha va inglizcha. Do‘kon, mahsulotlar, demo buyurtma, profil, xabarnomalar, yangiliklar, arena va AI murabbiy matnlari umumiy til tanloviga amal qiladi. Rasmiy mahsulot nomlari va o‘yin atamalari saqlanadi.

## Ishga tushirish

Node.js 24 va pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Production: `pnpm build` va `pnpm start`. GitHub monoreposida ushbu ilova `apps/miniapp/` ichida. Vercel Root Directory shu papkaga mos bo‘lishi kerak; alohida manba yuklanganda ilova ildizidan build qilinadi.

## Til va Telegram

Brauzerda tanlov localStorage orqali saqlanadi. Telegram ichida imzolangan `initData` tekshirilgach tanlov bot bilan ham sinxronlanadi. Profil yoki yuqori paneldagi tanlov barcha bo‘limlarni darhol yangilaydi. Botdagi `/language` ham uch tilni taklif qiladi.

Bot tanlovi Telegramning har bir shaxsiy chat uchun saqlanadigan menyu URL parametrida saqlanadi. Shu sabab serverless qayta ishga tushishi tanlovni yo‘qotmaydi va alohida baza talab qilinmaydi. Menyu tugmasi va chat buyruqlari ham tanlangan tilda o‘rnatiladi. Keyingi javoblar shu tilda keladi; avval yuborilgan chat tarixi qayta yozilmaydi. Oddiy brauzerda Telegram imzosi yo‘qligi uchun faqat qurilmadagi tanlov saqlanadi.

Production muhitida `TELEGRAM_BOT_TOKEN` va `TELEGRAM_WEBHOOK_SECRET` kerak. Webhook `/api/telegram/webhook` manziliga aynan shu secret bilan ro‘yxatdan o‘tkazilgan bo‘lishi kerak. Mavjud deploymentdagi qiymatlarni saqlang; tokenlarni gitga yozmang. `TELEGRAM_WEBAPP_URL` HTTPS asosiy domenni belgilaydi; standart domen `https://null-alpha-orcin.vercel.app`.

`POST /api/preferences/language` faqat Telegram imzolagan foydalanuvchi uchun ishlaydi; client yuborgan user_id qabul qilinmaydi. Imzo, sessiya muddati, webhook secret va xato javoblari tekshiriladi. Sinxronlash ishlamasa foydalanuvchiga xabar ko‘rsatiladi.

## Tekshirish

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Unit testlar tarjimalar, bot javoblari, imzo tekshiruvi, foydalanuvchilar ajratilishi va webhookni tekshiradi. Brauzer testlari til almashishi, qayta ochish, mahsulot qidiruvi, demo buyurtma, yangilik filtri, jamoalar, murabbiy va mobil ko‘rinishni tekshiradi. Telegram sinxronlash testi tashqi APIni taqlid qiladi; haqiqiy botda tekshirish uchun `/language` orqali til tanlab `/help` yuboring.

Haqiqiy to‘lov, olmos yetkazish, buyurtmalar va AI integratsiyasi ulanmagan — mavjud demo rejimi saqlangan. Next.js xavfsizlik tuzatishlari uchun 16.4.3 versiyasiga yangilangan.

## Do‘kon oqimi

- Katalog bitta `lib/shop/catalog.ts` manbasidan olinadi; qidiruv, kategoriya va narx bo‘yicha saralash birga ishlaydi.
- User ID va Server ID bo‘sh boshlanadi. Tekshiruv faqat format uchun: mos ravishda 5–20 va 2–8 raqam, boshida nol bo‘lmasligi kerak. Bu MOONTON tekshiruvi yoki O‘zbekiston serverini tasdiqlash emas. Ta’minotchi bilan haqiqiy akkaunt tekshiruvi keyingi integratsiya hisoblanadi.
- Miqdor 1–10; summa katalog narxidan hisoblanadi. Tafsilotlarni tasdiqlash shart. ID, server, miqdor yoki to‘lov usuli tahrir qilinsa yakuniy tasdiq bekor bo‘ladi; ID/server tahriri format tasdig‘ini ham bekor qiladi.
- Demo buyurtma o‘zining paket, narx, miqdor, ID va server nusxasini oladi. Keyingi forma tahriri oldingi buyurtmani o‘zgartirmaydi. Takroriy bosish bitta forma uchun yangi nusxa yaratmaydi.
- Oxirgi 20 ta demo yozuv versiyalangan localStorage tarixida saqlanadi; qayta ochilganda Buyurtmalar va Profil orqali ko‘rinadi. Telegram akkaunt ID’si bo‘yicha qurilma ichida ajratilgan, lekin bu server autentifikatsiyasi yoki himoyalangan savdo bazasi emas. Oddiy brauzerdagi tarix shu brauzer profiliga tegishli. Qurilma ma’lumotlari tozalansa tarix o‘chadi; boshqa qurilmaga sinxronlanmaydi.
- Saqlash ishlamasa ogohlantirish chiqadi. Haqiqiy to‘lov, avtomatik yetkazish va server buyurtmalari hali yoqilmagan; narxlar sinov ma’lumotlari.

## Telegram raqami bilan ro‘yxatdan o‘tish

`/register` — uch tildagi ro‘yxatdan o‘tish oynasi. `PHONE_REGISTRATION_ENABLED=true` bo‘lsa asosiy Mini App ham ro‘yxatdan o‘tmagan foydalanuvchiga shu oynani ko‘rsatadi. Alohida SMS ishlatilmaydi: foydalanuvchi rozilik beradi va Telegramning `requestContact` oynasida o‘z raqamini ulashadi.

**Ishga tushirish talablari:** production PostgreSQL ulanishini `DATABASE_URL` ga, maxfiy 32 baytli kalitni 64 ta kichik hex belgisi ko‘rinishida `PHONE_DATA_KEY` ga yozing. `pnpm db:migrate` ni bajaring; keyin `PHONE_REGISTRATION_ENABLED=true` qilib qayta deployment qiling. Mavjud Telegram token va webhook secret saqlanadi. Muhit qiymatlarini chat yoki GitHubga yubormang. Mavjud bazaga xavfsiz, alohida `vaynexo_phone_registrations` jadvali qo‘shiladi; boshqa jadvallar o‘zgarmaydi. Kalitni almashtirishdan oldin shifrlangan raqamlar uchun migratsiya kerak. Ma’lumotlar bilan birga kalitni ham xavfsiz zaxiralang.

Hozir bazasi ulanmagan deploymentda funksiya faollashtirilmagan. `/register` buni ochiq ko‘rsatadi; u muvaffaqiyatli ro‘yxatdan o‘tishni taqlid qilmaydi. Baza ulangach, ro‘yxatdan o‘tmaganlar kirish oynasidan o‘tadi; oldin tasdiqlanganlar serverdagi holati tekshirilgach ochiladi.

Server Mini App initData imzosidan olingan Telegram ID bilan ishlaydi. Kontakt faqat maxfiy webhook orqali qabul qilinadi: shaxsiy chat, jo‘natuvchi ID, kontakt user_id va chat ID bir xil bo‘lishi, forward bo‘lmasligi hamda 5 daqiqalik rozilik so‘rovi faol bo‘lishi shart. So‘rovlar bazada 30 soniyalik limitga ega. Kontakt oynasining callback’i yoki localStorage flag’i ro‘yxatdan o‘tishga dalil hisoblanmaydi. Ilova server holati kelmaguncha ochilmaydi.

Telefon AES-256-GCM bilan shifrlanadi; server faqat oxirgi 4 raqamni qaytaradi. Telefonni URL, log, brauzer localStorage yoki botning menyu URL’iga yozmaymiz. Ro‘yxatdan o‘tish jadvali Telegram hisobiga telefonni bog‘laydi; telefon bilan SMS orqali alohida login, akkauntni tiklash va raqamni almashtirish hali kiritilmagan. Haqiqiy savdo API’lari qo‘shilganda har bir himoyalangan endpoint signed Telegram identity va serverdagi registration holatini tekshirishi kerak; UI oynasi yolg‘iz o‘zi server avtorizatsiyasini almashtirmaydi.

`pnpm test` PGlite ichidagi haqiqiy PostgreSQL mexanizmida rozilik, limit, shifrlash va qayta ishlashni tekshiradi. `pnpm test:e2e:registration` alohida test konfiguratsiyasida (test bazasi URL’i va soxta API javoblari bilan) kontakt callback’i kirishni ocha olmasligi, server tasdig‘i, rad etish, tarjima va oddiy brauzer cheklovini tekshiradi. Bu testlar production ro‘yxatdan o‘tishni faollashtirmaydi.

## Neon CLI setup

The app uses PostgreSQL only; existing signed Telegram identity remains the login provider. `neon.ts` keeps Neon Auth disabled and declares the branch policy generated by `neon init`. PostgreSQL is included with the linked Neon project.

```sh
# Global install is optional; npx works when global installation lacks permission.
npx --yes neon@latest init -y --org-id YOUR_ORG --project-id YOUR_PROJECT --branch production --services postgres
npx --yes neon@latest deploy
```

Finish CLI authentication in the browser when requested. An unauthenticated offline link is not evidence that the project was verified or services deployed. No claimable replacement project is created if login fails.

`neon deploy` pulls secrets to the ignored `.env.local` (or existing `.env`). The application uses the pooled `DATABASE_URL` with `pg`; on Vercel, `attachDatabasePool` manages idle connections before Fluid Compute suspension. Migration scripts load local env files and prefer the direct `DATABASE_URL_UNPOOLED` connection. Run `npm run db:migrate`, then `npm run build`. Environment files and `.neon` are ignored by git. Keep the private encryption key and the existing Telegram secrets outside source control.

## Production registration verification

After private production env variables are configured, deploy with `npm run db:migrate && npm run build && npm run verify:registration`. The last command starts the built application on loopback, authenticates a synthetic test identity in-process, tests registration HTTP endpoints against the real Neon database, verifies contact ownership and encrypted storage, and deletes only its own synthetic record. It never contacts a real Telegram user, publishes test credentials, or adds a diagnostic endpoint. A failed verification exits nonzero so the deployment is not promoted. Phone registration remains dependent on valid Telegram initData and the authenticated contact webhook.

## Virapin supplier adapter

Documentation: https://reseller.virapin.uz/docs.html (reviewed 2026-10-27). The server-only adapter is `lib/suppliers/virapin.ts`; it uses the documented fixed HTTPS API origin and a private bearer key. Set `VIRAPIN_API_KEY` in the Production environment, then run `npm run verify:virapin` privately to inspect account readiness and MLBB product IDs. The check only calls profile/catalog GET endpoints and prints no balance, prices or credentials. No real account request has been made while the key is absent.

Supported adapter methods: profile, wholesale catalogue, player lookup, order by ID or original client_ref, and guarded single-item order submission. Webhook validation verifies HMAC-SHA256 over timestamp plus exact raw body with a 5-minute tolerance and timing-safe comparison. A public supplier webhook handler and customer order routes have not been enabled; durable order ownership, payment verification, pricing/margin, webhook deduplication and status reconciliation must be connected before enabling real fulfilment.

Keep `VIRAPIN_ORDERS_ENABLED=false` until that integration is complete. Order requests always include the persisted client_ref and explicit `pay_currency: som`; they are never automatically retried. Network failure or an invalid response is an unknown outcome, not proof that an order failed: reconcile via the original client_ref before any retry. Supplier prices are named `wholesalePriceUZS` and do not replace the storefront's demo prices.

Virapin documentation requires a shared active subscription for order/lookup access; activation can charge the reseller balance and is not performed by this app. Lookup may return `supported:false`, a provider error, or no region. Those cases must not be displayed as a verified account. Uzbekistan account support must be checked using the actual selected MLBB product and User ID/Zone ID; no region support is inferred from a product name. Provider limits are documented as 60 requests/minute/key and 20 lookups/minute/IP, so user-facing integration needs shared throttling and catalogue caching before release.

Tests cover bearer isolation, schema validation, disabled paid orders, required references, explicit currency, unsupported lookup, secret-safe errors, reconciliation and webhook tampering/stale timestamps. The live supplier connection remains pending a private API key.
