from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class AccountCheck:
    supported: bool
    valid: bool | None = None
    nickname: str | None = None


class Supplier(Protocol):
    async def validate_account(self, player_id: str, zone_id: str) -> AccountCheck: ...


class UnconfiguredSupplier:
    async def validate_account(self, player_id: str, zone_id: str) -> AccountCheck:
        # Never invent a nickname or claim a real account was validated.
        return AccountCheck(supported=False)
