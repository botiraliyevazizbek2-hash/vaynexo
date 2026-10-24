# Vaynexo

UZ / RU / EN Telegram bot, React Mini App and FastAPI backend for an MLBB store.

**Version 0.1: test commerce foundation. This is not a live top-up service.**
No real money is collected and no diamonds are delivered. Every payment/delivery status is explicitly marked `test_*`. Catalog prices are example retail prices supplied during planning, not supplier quotes.

## Ishlaydigan qismlar

- Uch tilli mobil/desktop do‘kon, paket qidirish va filterlar.
- Telegram Mini App imzosini va amal qilish muddatini serverda tekshirish.
- Alohida test foydalanuvchilari; demo kirish faqat development muhitida.
- Profil tili va MLBB User ID / Zone ID saqlash. Nickname tekshiruvi **ulanmagan**.
- Buyurtma, test to‘lov, bekor qilish, buyurtma tarixi.
- Serverdagi narxdan snapshot; idempotency key; ruxsatli status o‘tishlari.
- `/admin`: narx/faollik, test buyurtma holatlari, foydalanuvchilar, yordam javoblari, audit.
- Aiogram `/start`, `/app`, `/shop`, `/orders`, `/language`, `/help`.
- SQLite saqlash, Alembic migratsiya, Docker Compose va GitHub Actions.

## Tez ishga tushirish — Docker

```sh
cp .env.example .env
# .env ichida SESSION_SECRET va ADMIN_KEY uchun alohida tasodifiy kalitlar kiriting:
python -c "import secrets; print(secrets.token_urlsafe(48))"
docker compose up --build -d
```

Brauzer: http://localhost:8080. Admin: http://localhost:8080/admin.
Admin kaliti `.env` ichidagi `ADMIN_KEY`; bu bot tokeni emas.
`DEMO_LOGIN_ENABLED=true` faqat o‘z kompyuteringizdagi test uchun.
Ma’lumotlar Docker volume ichida saqlanadi; `docker compose down -v` ularni o‘chiradi.

## Docker ishlatmasdan

Python 3.12+, Node 22+.

```sh
python -m venv .venv
# Linux/macOS:
. .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.lock
cp .env.example .env
alembic upgrade head
python -m apps.api.seed
uvicorn apps.api.main:app --reload --host 127.0.0.1 --port 8000
```

Ikkinchi terminal:

```sh
cd apps/frontend
npm ci
npm run dev
```

Vite manzilini oching (odatda http://localhost:5173). `/api` so‘rovlari localhost:8000 ga yuboriladi. API hujjati: http://localhost:8000/docs.

## Telegram bot

1. BotFather tokenini faqat `.env` ichidagi `BOT_TOKEN`ga kiriting.
2. HTTPS bilan ochiladigan web manzilni `MINI_APP_URL`ga kiriting.
3. `SESSION_SECRET`ni doimiy, kamida 32 belgili tasodifiy qiymat qiling.
4. Zarur bo‘lsa `ADMIN_TELEGRAM_IDS=[123456789]` ni o‘z haqiqiy Telegram ID’ingiz bilan sozlang.
5. `docker compose --profile telegram up -d --build` yoki `python -m apps.bot.main`.
6. Botda `/start` → til → do‘kon. Faqat bitta polling bot nusxasini ishlating.

Birinchi versiya polling ishlatadi; webhook hali qo‘shilmagan. Botni shu ish davomida Telegram’da ishga tushirmadik, chunki token berilmagan.

## Testlar

```sh
pytest -q
ruff check .
cd apps/frontend
npm run build
```

### Brauzer sinovi

Python virtual muhitini faollashtiring, keyin:

```sh
cd apps/frontend
npm ci
npx playwright install chromium
npm run test:e2e
```

Test o‘zi API va web serverni ishga tushiradi, alohida `e2e.db` ishlatadi. `E2E_PYTHON` bilan Python executable yo‘lini berish mumkin. Test do‘kon → test to‘lov → admin holati → yordam javobi → profil saqlash va mobil uch tilni tekshiradi. Tashqi Telegram skripti va shriftlar bu testda ajratilgan; haqiqiy Telegram sessiyasi va bot tokeni bilan sinov hali qilinmagan.

## Tuzilma

- `apps/api`: FastAPI kirish nuqtasi va katalog seed.
- `apps/bot`: Aiogram polling adapteri.
- `apps/frontend`: React web/Mini App; `/admin` shu build ichida, server admin ruxsatini tekshiradi.
- `backend`: core, auth, users, catalog, orders, admin, support, audit, suppliers.
- `migrations`: versiyalangan baza sxemasi.
- `infra`: Docker va Nginx.
- `docs/ROADMAP.md`: keyingi bosqichlar.

## Ommaga chiqarishdan oldin

Bu MVP **test rejimidan chiqmaydi**: live to‘lov va supplier adapteri yozilmagan. `APP_ENV=production` faqat xavfsizlik sozlamalarini qat’iylashtiradi, real savdoni yoqmaydi.

- Demo loginni o‘chiring; HTTPS reverse proxy ulang. Docker web porti ataylab localhost bilan cheklangan.
- Admin kalitini password manager’da saqlang; `SESSION_SECRET`ni o‘zgartirish barcha sessiyalarni bekor qiladi.
- Nginx rate limitlarini yoqing. FastAPI portini tashqi internetga ochmang.
- Baza zaxira nusxasi va qayta tiklashni sinang. Ko‘p serverli bosqichda PostgreSQL, Redis va alohida worker joriy qilinadi.
- SQLite bazasini API va bot bitta hostda ishlatadi. Buni ko‘p hostga nusxalab ishlatmang.
- Telegram Stars va tashqi to‘lovlar bo‘yicha Telegram’ning amaldagi qoidalarini real savdo yoqilishidan oldin tekshiring. Bu repo to‘lov usulini hali tanlamaydi.
- AI, turnirlar, yangiliklar, avtomatik bildirishnoma, cashback, referral, haqiqiy ledger/refund va foyda hisobi hali mavjud emas.

O‘yin akkaunti paroli so‘ralmaydi. Demo fayllarda rasmiy Moonton hamkorligi, yetkazish tezligi yoki AI aniqligi haqida tasdiqlanmagan da’volar yo‘q.
