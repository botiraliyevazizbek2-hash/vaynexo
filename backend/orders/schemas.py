from pydantic import BaseModel, ConfigDict, Field


class CreateOrder(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_id: str = Field(min_length=1, max_length=64)
    player_id: str = Field(pattern=r"^[0-9]{4,20}$")
    zone_id: str = Field(pattern=r"^[0-9]{2,10}$")
    expected_price_uzs: int = Field(gt=0)
