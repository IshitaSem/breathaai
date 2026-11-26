from typing import Dict, List, Literal, Optional, Tuple
from pydantic import BaseModel, Field


# ---------------- AIR QUALITY SCHEMAS ---------------- #

class AQICategorySchema(BaseModel):
    maxVal: int
    name: str
    color: str
    advice: str
    healthRisk: str


class PollutantsSchema(BaseModel):
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    so2: Optional[float] = None
    co: Optional[float] = None
    o3: Optional[float] = None
    nh3: Optional[float] = None  # Missing from Open-Meteo, represented as None, never 0.0
    pb: Optional[float] = None   # Missing from Open-Meteo, represented as None, never 0.0
    pm25_24h_avg: Optional[float] = None
    pm10_24h_avg: Optional[float] = None
    no2_24h_avg: Optional[float] = None
    so2_24h_avg: Optional[float] = None
    co_8h_avg: Optional[float] = None
    o3_8h_avg: Optional[float] = None


class HourlyReadingSchema(BaseModel):
    hour: str
    aqi: int
    pm25: Optional[float] = None
    pm10: Optional[float] = None


class DailyForecastSchema(BaseModel):
    day: str
    aqi: int
    category: str


class StationSchema(BaseModel):
    name: str
    aqi: int
    category: str
    color: str
    x: float
    y: float


class AirQualityResponse(BaseModel):
    loc: str
    aqi: int
    usAqi: Optional[int] = None
    indexStandard: str = "Indicative CPCB-Method Estimate (Modelled Data)"
    category: AQICategorySchema
    dominantPollutant: Optional[str] = "PM2.5"
    pollutants: PollutantsSchema
    hourly: List[HourlyReadingSchema]
    daily: List[DailyForecastSchema]
    stations: List[StationSchema]
    lastUpdated: str
    measurementTime: Optional[str] = None
    isLive: bool
    source: str
    modelProvider: str = "Copernicus Atmosphere Monitoring Service (CAMS) Global / Open-Meteo"
    modelResolution: str = "~0.4° (~40 km) Spatial / 1-hour Temporal"
    averagingMethod: str = "Trailing 24-hr rolling mean (PM2.5/PM10/NO2/SO2) & 8-hr rolling mean (CO/O3) on modelled data (not strict CPCB daily station equivalence)"
    dataClassification: str = "Modelled Atmospheric Telemetry (Not Ground CAAQMS Stations)"
    cpcbSufficient: bool = True
    averagingCoverageComplete: Optional[bool] = None
    coordinates: Optional[Dict[str, float]] = None


# ---------------- CHAT SCHEMAS ---------------- #

class ChatContextSchema(BaseModel):
    loc: str = "Ludhiana"
    aqi: int = 150
    pm25: float = 85.0
    pm10: float = 140.0
    fam: int = 4
    sens: str = "Children / elderly at home"
    life: str = "Mixed commute"


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    context: Optional[ChatContextSchema] = None


class ChatResponse(BaseModel):
    text: str
    cards: List[Tuple[str, str]] = Field(default_factory=list)
    is_live_genai: bool = False
    model_used: str = "Contextual Fallback Engine"


# ---------------- PLANNER SCHEMAS ---------------- #

class PlannerTaskItemSchema(BaseModel):
    id: str
    timeOfDay: str
    description: str
    co2eKg: float
    completed: bool = False


class PlannerToggleRequest(BaseModel):
    task_id: str = Field(..., min_length=1, max_length=50)
    completed: bool
    date_str: Optional[str] = Field(default=None, max_length=10)


class PlannerSummaryResponse(BaseModel):
    date_str: str
    completed_count: int
    total_tasks: int
    co2e_avoided_kg: float
    tasks: List[PlannerTaskItemSchema]


# ---------------- COMMUNITY SCHEMAS ---------------- #

class CommunityChallengeItemSchema(BaseModel):
    id: int
    title: str
    description: str
    participants: int
    is_joined: bool = False


class HistoryPointSchema(BaseModel):
    label: str
    value: int


class CommunityStatsResponse(BaseModel):
    user_actions_this_week: int
    community_participants: int
    total_co2e_avoided_kg: float
    weekly_history: List[HistoryPointSchema]
    monthly_history: List[HistoryPointSchema]
    challenges: List[CommunityChallengeItemSchema]


class CommunityChallengeToggleRequest(BaseModel):
    challenge_id: int
    is_joined: bool


# ---------------- USER SETTINGS SCHEMAS ---------------- #

class NotificationPrefs(BaseModel):
    alert: bool = True
    daily: bool = True
    weekly: bool = False


class PrivacyPrefs(BaseModel):
    share: bool = False
    anon: bool = True


class UserSettingsSchema(BaseModel):
    name: str = Field(default="Ishita", min_length=1, max_length=100)
    email: Optional[str] = Field(default="", max_length=150)
    loc: str = Field(default="Ludhiana", min_length=1, max_length=100)
    fam: int = Field(default=4, ge=1, le=20)
    life: str = Field(default="Mixed commute", max_length=100)
    sens: str = Field(default="Children / elderly at home", max_length=150)
    theme: Literal["auto", "light", "dark"] = "auto"
    nt: NotificationPrefs = Field(default_factory=NotificationPrefs)
    priv: PrivacyPrefs = Field(default_factory=PrivacyPrefs)
