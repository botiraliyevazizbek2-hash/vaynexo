# Telegram: qaysi kod qayerda ishlaydi?

2026-10-26 kungi tekshiruv:

| Qism | Hozirgi holat |
| --- | --- |
| Ushbu GitHub repo | FastAPI + React/Vite + Aiogram polling, SQLite, test buyurtmalar |
| Mavjud Vercel `null` loyihasi | Alohida Next.js dasturi va `/api/telegram/webhook` |
| Ochiq manzil | https://null-alpha-orcin.vercel.app/ |
| GitHub → Vercel | Ushbu reponing Python botidagi o‘zgarishlar mavjud Next.js deployment’ga avtomatik qo‘llanmaydi |
| Webhook siri | Production muhitiga to‘g‘rilangan; kalitsiz so‘rov 401 qaytarishi tekshirilgan |
| Haqiqiy `/start` javobi | Faqat HTTP 401 tekshiruvi bilan tasdiqlab bo‘lmaydi; Telegram ro‘yxatdan o‘tishi va javob yuborishi alohida tekshiriladi |

### 2026-10-26 tekshiruv natijasi

Server ichidagi `getMe` token aynan `@VaynexoBot`niki ekanini tasdiqladi.
`getWebhookInfo` dastlab webhook umuman ro‘yxatdan o‘tmaganini ko‘rsatdi.
Mavjud webhook sirining formati ham Telegram talabiga mos kelmagan.
Sir yangi URL-safe tasodifiy qiymatga almashtirildi, Production qayta joylashtirildi
va shu server qiymati bilan `setWebhook` bajarildi. Kalit qiymatlari GitHub’ga
yoki hisobotga yozilmadi.

Qayta tekshiruvda `webhookMatches=true`, `messagesEnabled=true`,
`callbacksEnabled=true`, `handlerChecksPassed=true` qaytdi. Kalitsiz POST 401,
to‘g‘ri sirli xabarsiz update 2xx va to‘g‘ri sirli buzilgan JSON 400 bo‘lishi
tekshirildi. Telegram oxirgi yetkazish xatosini qaytarmadi. Bu tekshiruv
foydalanuvchining Telegram ichida javobni olganini hali tasdiqlamaydi.

Bir bot uchun webhook va polling bir paytda ishlatilmaydi. Python bot endi
faol webhook borligini ko‘rsa, uni o‘chirmasdan aniq xabar bilan to‘xtaydi.
Vercel’dagi botni tuzatish uchun shu repodagi polling’ni parallel ishga tushirmang.

## Vercel uchun kerakli nomlar

- `TELEGRAM_BOT_TOKEN`: aynan @VaynexoBot tokeni, Production, Secret.
- `TELEGRAM_WEBHOOK_SECRET`: Production, Secret; Telegram `setWebhook`ga berilgan qiymat bilan bir xil.
- `TELEGRAM_WEBAPP_URL`: ixtiyoriy sayt manzili; mavjud Next.js botining sozlamasi.

Python/Docker varianti esa `BOT_TOKEN` va `MINI_APP_URL` nomlarini ishlatadi.
Kalit nomlarini ikki loyiha o‘rtasida aralashtirmang.

## Bir martalik xavfsiz tekshiruv

Node.js 22+; qo‘shimcha npm paketi kerak emas. Skriptni faqat loyiha egasining
ishonchli terminalida yoki ruxsat berilgan server ishga tushirish bosqichida bajaring.
Token va sirni buyruq argumentiga, GitHub’ga, chatga yoki frontend’ga yozmang.
Skript mavjud server muhit o‘zgaruvchilaridan foydalanadi.

```sh
node scripts/telegram-webhook.mjs --inspect
```

Bu faqat `getMe` va `getWebhookInfo`ni chaqiradi, hech narsani o‘zgartirmaydi.

| `state` | Mazmuni |
| --- | --- |
| `registered` | To‘g‘ri bot, manzil va kerakli update turlari mavjud; haqiqiy javob hali alohida tekshiriladi |
| `webhook_not_registered` | Telegram’da webhook yo‘q |
| `webhook_url_mismatch` | Telegram boshqa manzilga yuboryapti |
| `update_types_missing` | `message` yoki `callback_query` olinmayapti |
| `wrong_bot_identity` | Token boshqa botniki; skript sozlamani o‘zgartirmaydi |
| `bot_token_rejected` | Telegram tokenni qabul qilmadi |
| `invalid_webhook_secret_format` | Sir yo‘q yoki Telegram ruxsat bermaydigan belgilar bor |

Kerak bo‘lsa, quyidagi buyruq aynan shu loyiha uchun webhook’ni o‘rnatadi:

```sh
node scripts/telegram-webhook.mjs --register
```

Avval bot nomi va jonli handler tekshiriladi: kalitsiz so‘rov 401,
to‘g‘ri sir bilan xabarsiz update 2xx, buzilgan JSON 400 qaytarishi kerak.
Keyin webhook manzili va sir server ichidan Telegram’ga yuboriladi.
`drop_pending_updates=false`: navbatdagi xabarlar o‘chirilmaydi.
Skript hech kimga test xabari yubormaydi.

`--report <yo‘l>` faqat oldindan belgilangan, sirlar va shaxsiy xabarlar
bo‘lmagan JSON hisobotni yozadi. Bu rejim tekshiruv natijasini faylga yozish
uchun xato holatida ham jarayonni muvaffaqiyatli tugatadi; avtomatik tekshiruv
hisobotdagi `state`ni baholashi kerak. `liveReplyVerified` doimo `false`:
foydalanuvchi `/start` yuborib, javobni olmaguncha to‘liq ishlaydi deb bo‘lmaydi.
Oxirgi Telegram yetkazish xatosi tarixiy bo‘lishi mumkin.

## Tekshiruvlar

```sh
node --test tests/telegram-webhook.test.mjs
pytest -q
ruff check .
```

## Kodlarni birlashtirish sharti

Mavjud Next.js saytning to‘liq manba kodini ruxsatli eksport yoki uning Git
repozitoriysidan olish kerak. Uni tekshirmasdan hozirgi React/Vite papkasini
Vercel loyihasiga ulash sayt dizayni va ishlayotgan route’larni almashtirib yuboradi.
Ushbu tuzatish bunday almashtirishni bajarmaydi.

Rasmiy Telegram hujjati: https://core.telegram.org/bots/api#setwebhook
