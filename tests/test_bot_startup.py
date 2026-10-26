import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from apps.bot.main import ensure_polling_available


def test_polling_refuses_existing_webhook_without_deleting_it():
    bot = SimpleNamespace(
        get_webhook_info=AsyncMock(return_value=SimpleNamespace(url="https://example.invalid/webhook")),
        delete_webhook=AsyncMock(),
    )
    with pytest.raises(SystemExit, match="webhook is already configured"):
        asyncio.run(ensure_polling_available(bot))
    bot.get_webhook_info.assert_awaited_once()
    bot.delete_webhook.assert_not_awaited()


def test_polling_can_start_when_no_webhook_exists():
    bot = SimpleNamespace(get_webhook_info=AsyncMock(return_value=SimpleNamespace(url="")))
    asyncio.run(ensure_polling_available(bot))
    bot.get_webhook_info.assert_awaited_once()
