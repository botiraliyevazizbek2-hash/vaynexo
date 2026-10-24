import asyncio
import logging

from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    BotCommand,
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    MenuButtonWebApp,
    Message,
    WebAppInfo,
)
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from backend.core.config import get_settings
from backend.core.database import SessionLocal
from backend.orders.models import Order
from backend.users.models import User

TEXT = {
    "uz": {
        "welcome": "Vaynexo’ga xush kelibsiz! Tilni tanlang.",
        "open": "Do‘konni ochish",
        "ready": "Vaynexo • TEST REJIMI\nHaqiqiy pul yechilmaydi, olmos yetkazilmaydi.",
        "help": "Yordam uchun Mini App → Yordam bo‘limiga yozing. /language — tilni o‘zgartirish.",
        "empty": "Hozircha buyurtmalar yo‘q.",
        "pending": "Mini App manzili hali sozlanmagan.",
        "unknown": "Do‘kon uchun /app, yordam uchun /help buyrug‘ini yuboring.",
    },
    "ru": {
        "welcome": "Добро пожаловать в Vaynexo! Выберите язык.",
        "open": "Открыть магазин",
        "ready": "Vaynexo • ТЕСТОВЫЙ РЕЖИМ\nДеньги не списываются, алмазы не доставляются.",
        "help": "Поддержка: Mini App → Помощь. /language — сменить язык.",
        "empty": "Заказов пока нет.",
        "pending": "Адрес Mini App ещё не настроен.",
        "unknown": "Магазин: /app. Помощь: /help.",
    },
    "en": {
        "welcome": "Welcome to Vaynexo! Choose your language.",
        "open": "Open shop",
        "ready": "Vaynexo • TEST MODE\nNo money is charged and no diamonds are delivered.",
        "help": "For support, open Mini App → Support. /language — change language.",
        "empty": "No orders yet.",
        "pending": "The Mini App URL is not configured yet.",
        "unknown": "Send /app to open the shop, or /help for support.",
    },
}
STATUS = {
    "uz": {
        "awaiting_test_payment": "Test to‘lov kutilmoqda",
        "test_paid": "Test to‘langan",
        "test_processing": "Test jarayonida",
        "test_completed": "Test bajarilgan",
        "test_failed": "Test bajarilmadi",
        "test_refunded": "Test qaytarilgan",
        "cancelled": "Bekor qilingan",
    },
    "ru": {
        "awaiting_test_payment": "Ожидает тестовой оплаты",
        "test_paid": "Тест оплачен",
        "test_processing": "Тест в обработке",
        "test_completed": "Тест завершён",
        "test_failed": "Тест не выполнен",
        "test_refunded": "Тестовый возврат",
        "cancelled": "Отменён",
    },
    "en": {
        "awaiting_test_payment": "Awaiting test payment",
        "test_paid": "Test paid",
        "test_processing": "Test processing",
        "test_completed": "Test completed",
        "test_failed": "Test failed",
        "test_refunded": "Test refunded",
        "cancelled": "Cancelled",
    },
}


def user_for(tg):
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.telegram_id == tg.id))
        if not user:
            language = tg.language_code if tg.language_code in TEXT else "uz"
            user = User(telegram_id=tg.id, name=tg.first_name[:128], language=language)
            db.add(user)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()
                user = db.scalar(select(User).where(User.telegram_id == tg.id))
        return user


def languages():
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text=label, callback_data=f"lang:{code}")
                for code, label in [("uz", "O‘zbekcha"), ("ru", "Русский"), ("en", "English")]
            ]
        ]
    )


def app_keyboard(language):
    url = get_settings().mini_app_url
    if not url.startswith("https://"):
        return None
    return InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text=TEXT[language]["open"], web_app=WebAppInfo(url=url))]]
    )


def dispatcher():
    dp = Dispatcher()
    dp.message.filter(F.chat.type == "private")

    @dp.message(CommandStart())
    @dp.message(Command("language"))
    async def start(message: Message):
        user = await asyncio.to_thread(user_for, message.from_user)
        await message.answer(TEXT[user.language]["welcome"], reply_markup=languages())

    @dp.callback_query(F.data.startswith("lang:"))
    async def language(callback: CallbackQuery):
        code = callback.data.split(":")[-1]
        if code not in TEXT:
            await callback.answer()
            return

        def save():
            user = user_for(callback.from_user)
            with SessionLocal() as db:
                db.get(User, user.id).language = code
                db.commit()

        await asyncio.to_thread(save)
        await callback.answer()
        await callback.bot.send_message(
            callback.from_user.id, TEXT[code]["ready"], reply_markup=app_keyboard(code)
        )

    @dp.message(Command("app", "shop"))
    async def app(message: Message):
        user = await asyncio.to_thread(user_for, message.from_user)
        keyboard = app_keyboard(user.language)
        await message.answer(TEXT[user.language]["ready" if keyboard else "pending"], reply_markup=keyboard)

    @dp.message(Command("help"))
    async def help_message(message: Message):
        user = await asyncio.to_thread(user_for, message.from_user)
        await message.answer(TEXT[user.language]["help"], reply_markup=app_keyboard(user.language))

    @dp.message(Command("orders"))
    async def orders(message: Message):
        user = await asyncio.to_thread(user_for, message.from_user)

        def read():
            with SessionLocal() as db:
                return db.scalars(
                    select(Order).where(Order.user_id == user.id).order_by(Order.created_at.desc()).limit(5)
                ).all()

        items = await asyncio.to_thread(read)
        text = "\n\n".join(
            f"#{o.id[:8]} · {o.product_names[user.language]}\n{STATUS[user.language][o.status]} · {o.price_uzs:,} UZS"
            for o in items
        )
        await message.answer(text or TEXT[user.language]["empty"], reply_markup=app_keyboard(user.language))

    @dp.message()
    async def fallback(message: Message):
        user = await asyncio.to_thread(user_for, message.from_user)
        await message.answer(TEXT[user.language]["unknown"])

    return dp


async def main():
    settings = get_settings()
    if not settings.bot_token:
        raise SystemExit("Set BOT_TOKEN in .env before starting the bot")
    if not settings.mini_app_url.startswith("https://"):
        raise SystemExit("Set MINI_APP_URL to your HTTPS web deployment")
    bot = Bot(settings.bot_token)
    async with bot:
        for language, text in TEXT.items():
            await bot.set_my_commands(
                [
                    BotCommand(command="app", description=text["open"]),
                    BotCommand(
                        command="orders",
                        description={"uz": "Buyurtmalarim", "ru": "Мои заказы", "en": "My orders"}[language],
                    ),
                    BotCommand(command="language", description="UZ / RU / EN"),
                    BotCommand(
                        command="help",
                        description={"uz": "Yordam", "ru": "Помощь", "en": "Support"}[language],
                    ),
                ],
                language_code=language,
            )
        await bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(text="Vaynexo", web_app=WebAppInfo(url=settings.mini_app_url))
        )
        await dispatcher().start_polling(bot, close_bot_session=False)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
