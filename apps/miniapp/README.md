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
