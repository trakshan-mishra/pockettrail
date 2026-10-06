from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class MissionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    minutes: Literal[10, 20, 30] = 20
    setting: Literal["park", "garden", "neighborhood", "window"] = "park"
    interest: Literal["calm", "curious", "create"] = "calm"
    condition: Literal["daytime", "evening", "rainy"] = "daytime"
    constraints: str = Field(default="", max_length=280)
    avoid: list[Literal["camera", "drawing"]] = Field(default_factory=lambda: ["camera", "drawing"], max_length=2)
    sample: bool = False


class ModelActivity(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    activity_id: str = Field(min_length=1, max_length=40)
    focus: str = Field(min_length=5, max_length=160)


class ModelPack(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=3, max_length=70)
    activities: list[ModelActivity] = Field(min_length=3, max_length=3)


class NarrationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    pack_id: str = Field(pattern=r"^[a-f0-9]{32}$")
    activity_id: str = Field(min_length=1, max_length=40)
