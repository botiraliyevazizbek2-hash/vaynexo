# Vaynexo bosqichlari

## 0.1 — ushbu commit
Test xarid oqimi, uch til, saqlanadigan buyurtmalar, admin, audit, Telegram polling adapteri.
Frontend ranglari avval taqdim etilgan dizayn asosida: #10131c, #00e5ff, #0068ed, #ffc860.

## 0.2 — integratsiyalar
Supplier narxi va UZ mosligini tekshirish; bitta real adapter. Nickname validation, SKU/region mapping, holat solishtirish. HTTP timeout bo‘lsa yangi supplierga ko‘r-ko‘rona qayta yubormaslik. Webhook imzosi, idempotency, kechikkan holatlar, monitoring.

To‘lov kanalini Telegram qoidalariga mos tanlash. Serverdan tasdiqlangan webhook, ledger, reconciliation va refund; frontend tugmasi to‘lov isboti bo‘lmaydi. Tannarx, komissiya va marjani saqlash. Hozirgi test buyurtmalarni live hisobdan ajratish.

PostgreSQL, Redis, worker va outbox bilan ishonchli Telegram bildirishnomalari. Zaxira nusxalari, monitoring, real merchant/supplier sinovlari.

## 0.3 — hamjamiyat
Manbali patch yangiliklari, turnirlar, jamoalar, referral va creator dasturi. AI murabbiy uchun versiyalangan knowledge base; tekshirilmagan win rate yoki aniqlik foizlari ko‘rsatilmaydi.
