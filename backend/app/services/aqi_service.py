import logging
import math
import time
from collections import OrderedDict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
import httpx
from ..models.schemas import (
    AirQualityResponse,
    AQICategorySchema,
    PollutantsSchema,
    HourlyReadingSchema,
    DailyForecastSchema,
    StationSchema,
)

logger = logging.getLogger(__name__)

IST_TZ = timezone(timedelta(hours=5, minutes=30), "IST")
DAYS_OF_WEEK = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
AQI_CACHE_TTL_SECONDS = 300.0
AQI_CACHE_MAX_SIZE = 64
_aqi_cache: "OrderedDict[Tuple[str, float, float], Tuple[float, AirQualityResponse]]" = OrderedDict()
_http_client: Optional[httpx.AsyncClient] = None


def _get_cached_aqi(cache_key: Tuple[str, float, float]) -> Optional[AirQualityResponse]:
    entry = _aqi_cache.get(cache_key)
    if entry is None:
        return None
    cached_at, cached_response = entry
    if (time.monotonic() - cached_at) >= AQI_CACHE_TTL_SECONDS:
        _aqi_cache.pop(cache_key, None)
        return None
    _aqi_cache.move_to_end(cache_key)
    return cached_response


def _set_cached_aqi(cache_key: Tuple[str, float, float], response: AirQualityResponse) -> None:
    now = time.monotonic()
    expired_keys = [
        k for k, (ts, _) in _aqi_cache.items() if (now - ts) >= AQI_CACHE_TTL_SECONDS
    ]
    for k in expired_keys:
        _aqi_cache.pop(k, None)
    if cache_key in _aqi_cache:
        _aqi_cache.move_to_end(cache_key)
    elif len(_aqi_cache) >= AQI_CACHE_MAX_SIZE:
        _aqi_cache.popitem(last=False)
    _aqi_cache[cache_key] = (now, response)


def get_http_client() -> httpx.AsyncClient:
    """Return a shared httpx.AsyncClient with connection pooling."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=8.0)
    return _http_client


async def close_http_client() -> None:
    """Close the shared httpx.AsyncClient on application shutdown."""
    global _http_client
    if _http_client is not None and not _http_client.is_closed:
        await _http_client.aclose()
        _http_client = None

# Supported Indian metropolitan coordinates
SUPPORTED_CITIES: Dict[str, Dict[str, Any]] = {
    "Ludhiana": {"lat": 30.9010, "lon": 75.8573, "state": "Punjab"},
    "Delhi": {"lat": 28.6139, "lon": 77.2090, "state": "Delhi"},
    "Lucknow": {"lat": 26.8467, "lon": 80.9462, "state": "Uttar Pradesh"},
    "Mumbai": {"lat": 19.0760, "lon": 72.8777, "state": "Maharashtra"},
    "Bengaluru": {"lat": 12.9716, "lon": 77.5946, "state": "Karnataka"},
    "Kolkata": {"lat": 22.5726, "lon": 88.3639, "state": "West Bengal"},
    "Chennai": {"lat": 13.0827, "lon": 80.2707, "state": "Tamil Nadu"},
    "Hyderabad": {"lat": 17.3850, "lon": 78.4867, "state": "Telangana"},
}

# Offline Benchmark Demo Base Data (24h/8h synthetic baseline)
DEMO_BASELINES: Dict[str, Dict[str, float]] = {
    "Ludhiana": {"aqi": 286, "pm25": 148, "pm10": 241, "no2": 58, "so2": 14, "co": 2.1, "o3": 31},
    "Delhi": {"aqi": 352, "pm25": 201, "pm10": 318, "no2": 74, "so2": 19, "co": 3.4, "o3": 26},
    "Lucknow": {"aqi": 241, "pm25": 119, "pm10": 196, "no2": 49, "so2": 11, "co": 1.8, "o3": 38},
    "Mumbai": {"aqi": 128, "pm25": 52, "pm10": 98, "no2": 36, "so2": 9, "co": 1.1, "o3": 44},
    "Bengaluru": {"aqi": 78, "pm25": 28, "pm10": 54, "no2": 24, "so2": 6, "co": 0.8, "o3": 36},
    "Kolkata": {"aqi": 184, "pm25": 86, "pm10": 142, "no2": 44, "so2": 12, "co": 1.5, "o3": 29},
    "Chennai": {"aqi": 92, "pm25": 38, "pm10": 68, "no2": 26, "so2": 8, "co": 0.9, "o3": 41},
    "Hyderabad": {"aqi": 115, "pm25": 48, "pm10": 88, "no2": 32, "so2": 10, "co": 1.2, "o3": 35},
}

CATEGORIES = [
    AQICategorySchema(maxVal=50, name="Good", color="#2e9e5b", advice="Air is clean. Enjoy outdoor activity.", healthRisk="Low"),
    AQICategorySchema(maxVal=100, name="Satisfactory", color="#8cbf3f", advice="Minor discomfort possible for very sensitive people.", healthRisk="Low"),
    AQICategorySchema(maxVal=200, name="Moderate", color="#e0b020", advice="Sensitive groups should reduce long outdoor exertion.", healthRisk="Moderate"),
    AQICategorySchema(maxVal=300, name="Poor", color="#e8832a", advice="Limit outdoor time; avoid exercise near traffic.", healthRisk="High"),
    AQICategorySchema(maxVal=400, name="Very Poor", color="#d6453d", advice="Stay indoors where possible; wear a well-fitted N95/FFP2 mask if outside.", healthRisk="Severe"),
    AQICategorySchema(maxVal=999, name="Severe", color="#8e2a6b", advice="Avoid going out. Keep windows closed and run an air purifier.", healthRisk="Very Severe"),
]


def get_aqi_category(aqi: int) -> AQICategorySchema:
    for cat in CATEGORIES:
        if aqi <= cat.maxVal:
            return cat
    return CATEGORIES[-1]


# ---------------- CPCB NAQI CALCULATION (OFFICIAL METHODOLOGY - ALL 8 POLLUTANTS) ---------------- #

# Official Central Pollution Control Board (CPCB) breakpoint tables: [B_low, B_high, I_low, I_high]
BREAKPOINTS_CPCB: Dict[str, List[Tuple[float, float, int, int]]] = {
    # 24-hour average in µg/m³
    "pm25": [
        (0.0, 30.0, 0, 50),
        (30.0, 60.0, 51, 100),
        (60.0, 90.0, 101, 200),
        (90.0, 120.0, 201, 300),
        (120.0, 250.0, 301, 400),
        (250.0, 500.0, 401, 500),
    ],
    # 24-hour average in µg/m³
    "pm10": [
        (0.0, 50.0, 0, 50),
        (50.0, 100.0, 51, 100),
        (100.0, 250.0, 101, 200),
        (250.0, 350.0, 201, 300),
        (350.0, 430.0, 301, 400),
        (430.0, 600.0, 401, 500),
    ],
    # 24-hour average in µg/m³
    "no2": [
        (0.0, 40.0, 0, 50),
        (40.0, 80.0, 51, 100),
        (80.0, 180.0, 101, 200),
        (180.0, 280.0, 201, 300),
        (280.0, 400.0, 301, 400),
        (400.0, 500.0, 401, 500),
    ],
    # 24-hour average in µg/m³
    "so2": [
        (0.0, 40.0, 0, 50),
        (40.0, 80.0, 51, 100),
        (80.0, 380.0, 101, 200),
        (380.0, 800.0, 201, 300),
        (800.0, 1600.0, 301, 400),
        (1600.0, 2000.0, 401, 500),
    ],
    # 8-hour average in mg/m³
    "co": [
        (0.0, 1.0, 0, 50),
        (1.0, 2.0, 51, 100),
        (2.0, 10.0, 101, 200),
        (10.0, 17.0, 201, 300),
        (17.0, 34.0, 301, 400),
        (34.0, 50.0, 401, 500),
    ],
    # 8-hour average in µg/m³
    "o3": [
        (0.0, 50.0, 0, 50),
        (50.0, 100.0, 51, 100),
        (100.0, 168.0, 101, 200),
        (168.0, 208.0, 201, 300),
        (208.0, 748.0, 301, 400),
        (748.0, 1000.0, 401, 500),
    ],
    # 24-hour average in µg/m³
    "nh3": [
        (0.0, 200.0, 0, 50),
        (200.0, 400.0, 51, 100),
        (400.0, 800.0, 101, 200),
        (800.0, 1200.0, 201, 300),
        (1200.0, 1800.0, 301, 400),
        (1800.0, 2400.0, 401, 500),
    ],
    # 24-hour average in µg/m³
    "pb": [
        (0.0, 0.5, 0, 50),
        (0.5, 1.0, 51, 100),
        (1.0, 2.0, 101, 200),
        (2.0, 3.0, 201, 300),
        (3.0, 3.5, 301, 400),
        (3.5, 5.0, 401, 500),
    ],
}


def calculate_sub_index(concentration: Optional[float], pollutant_key: str) -> Optional[int]:
    """
    Computes linear sub-index for a specific pollutant according to official CPCB breakpoints:
    I = I_low + [(I_high - I_low) / (B_high - B_low)] * (C - B_low)
    """
    if concentration is None or concentration < 0:
        return None

    breaks = BREAKPOINTS_CPCB.get(pollutant_key)
    if not breaks:
        return None

    for b_low, b_high, i_low, i_high in breaks:
        if b_low <= concentration <= b_high:
            if b_high == b_low:
                return i_low
            return round(i_low + ((i_high - i_low) / (b_high - b_low)) * (concentration - b_low))

    # Concentration above highest defined breakpoint
    last = breaks[-1]
    if concentration > last[1]:
        return min(500, round(last[3] + (concentration - last[1]) * 0.5))

    return 0


def calculate_cpcb_naqi(
    pm25: Optional[float],
    pm10: Optional[float],
    no2: Optional[float] = None,
    so2: Optional[float] = None,
    co: Optional[float] = None,
    o3: Optional[float] = None,
    nh3: Optional[float] = None,
    pb: Optional[float] = None,
) -> Tuple[int, str, bool, Dict[str, Optional[int]]]:
    """
    Calculates overall Indian National AQI from all 8 CPCB pollutants.
    Applies CPCB validation rules:
    - Minimum 3 pollutants required.
    - At least one particulate (PM2.5 or PM10) MUST be available.
    Returns: (overall_aqi, dominant_pollutant_name, cpcb_sufficient, sub_indices_map)
    """
    pollutant_data = {
        "PM2.5": calculate_sub_index(pm25, "pm25"),
        "PM10": calculate_sub_index(pm10, "pm10"),
        "NO2": calculate_sub_index(no2, "no2"),
        "SO2": calculate_sub_index(so2, "so2"),
        "CO": calculate_sub_index(co, "co"),
        "O3": calculate_sub_index(o3, "o3"),
        "NH3": calculate_sub_index(nh3, "nh3"),
        "Pb": calculate_sub_index(pb, "pb"),
    }

    # Filter valid computed sub-indices (strictly excludes None)
    valid_sub_indices = {k: v for k, v in pollutant_data.items() if v is not None}

    # CPCB Minimum Data Criteria
    has_particulate = (pollutant_data["PM2.5"] is not None) or (pollutant_data["PM10"] is not None)
    valid_count = len(valid_sub_indices)
    cpcb_sufficient = has_particulate and (valid_count >= 3)

    if not valid_sub_indices:
        return (50, "PM2.5", False, pollutant_data)

    dominant_pollutant = max(valid_sub_indices, key=lambda k: valid_sub_indices[k])
    overall_aqi = valid_sub_indices[dominant_pollutant]

    return (overall_aqi, dominant_pollutant, cpcb_sufficient, pollutant_data)


# ---------------- DEMO & TELEMETRY BUILDERS ---------------- #

DEMO_STATION_SPECS: Tuple[Tuple[str, float, float, float], ...] = (
    ("Central Urban Grid Point (Modelled)", 1.0, 0.4, 0.4),
    ("Industrial Belt Grid Point (Modelled)", 1.15, 0.75, 0.3),
    ("Northern Residential Grid (Modelled)", 0.88, 0.3, 0.7),
    ("Arterial Transit Grid (Modelled)", 1.2, 0.8, 0.75),
    ("Suburban Outskirts Grid (Modelled)", 0.8, 0.2, 0.25),
)

LIVE_STATION_TEMPLATES: Tuple[Tuple[str, float, float, float], ...] = (
    ("{city} Central Zone (Dispersion Model)", 1.0, 0.42, 0.38),
    ("{city} Industrial Hub (Dispersion Model)", 1.16, 0.76, 0.28),
    ("{city} Sector Green (Dispersion Model)", 0.86, 0.32, 0.68),
    ("{city} Ring Road Transit (Dispersion Model)", 1.22, 0.82, 0.72),
    ("{city} University Enclave (Dispersion Model)", 0.78, 0.18, 0.22),
)


def _opt_float(value: Any) -> Optional[float]:
    return float(value) if value is not None else None


def _opt_round(value: Optional[float], ndigits: int = 1) -> Optional[float]:
    return round(float(value), ndigits) if value is not None else None


def _particulate_aqi(
    pm25: Optional[float],
    pm10: Optional[float],
    fallback_aqi: int,
) -> int:
    """Compute the higher CPCB particulate sub-index (PM2.5/PM10) or fall back cleanly."""
    sub_25 = calculate_sub_index(pm25, "pm25")
    sub_10 = calculate_sub_index(pm10, "pm10")
    valid_subs = [s for s in (sub_25, sub_10) if s is not None]
    return max(valid_subs) if valid_subs else fallback_aqi


def _build_daily_forecast(base_aqi: int, multipliers: Tuple[float, ...]) -> List[DailyForecastSchema]:
    return [
        DailyForecastSchema(
            day=day,
            aqi=(d_aqi := round(base_aqi * multipliers[idx])),
            category=get_aqi_category(d_aqi).name,
        )
        for idx, day in enumerate(DAYS_OF_WEEK)
    ]


def _build_stations(
    base_aqi: int, specs: Tuple[Tuple[str, float, float, float], ...]
) -> List[StationSchema]:
    stations: List[StationSchema] = []
    for name, mult, x, y in specs:
        s_aqi = round(base_aqi * mult)
        s_cat = get_aqi_category(s_aqi)
        stations.append(
            StationSchema(name=name, aqi=s_aqi, category=s_cat.name, color=s_cat.color, x=x, y=y)
        )
    return stations


def _calc_rolling_mean(
    arr: List[Optional[float]],
    curr_idx: int,
    window_hours: int,
    min_coverage_ratio: float = 0.75,
) -> Tuple[Optional[float], bool]:
    """Compute trailing rolling mean and whether valid-hour coverage meets threshold."""
    if not arr or curr_idx < 0:
        return None, False
    start_idx = max(0, curr_idx - window_hours + 1)
    sub = [v for v in arr[start_idx : curr_idx + 1] if v is not None]
    if not sub:
        return None, False
    min_required = math.ceil(window_hours * min_coverage_ratio)
    return (sum(sub) / len(sub)), (len(sub) >= min_required)


def _find_current_hour_index(times: List[str], curr_time: Optional[str]) -> int:
    """Match current timestamp in hourly array without jumping to future forecast days."""
    if not times:
        return -1
    if curr_time:
        if curr_time in times:
            return times.index(curr_time)
        hour_prefix = curr_time[:13]  # YYYY-MM-DDTHH
        for idx, t_str in enumerate(times):
            if t_str.startswith(hour_prefix):
                return idx
    # Fallback to end of past_days=1 (~24h) rather than end of 7-day forecast
    return min(24, len(times) - 1)


def _build_hourly_series(
    times: List[str],
    pm25_arr: List[Optional[float]],
    pm10_arr: List[Optional[float]],
    start_idx: int,
    fallback_aqi: int,
) -> List[HourlyReadingSchema]:
    """Build 24-hour modelled forecast readings starting at the matched current hour."""
    end_idx = start_idx + 24
    hourly_times = times[start_idx:end_idx]
    hourly_pm25s = pm25_arr[start_idx:end_idx]
    hourly_pm10s = pm10_arr[start_idx:end_idx]

    readings: List[HourlyReadingSchema] = []
    for idx, t_str in enumerate(hourly_times):
        hour_label = t_str.split("T")[-1][:5] if "T" in t_str else f"{idx:02d}:00"
        p25_val = hourly_pm25s[idx] if idx < len(hourly_pm25s) else None
        p10_val = hourly_pm10s[idx] if idx < len(hourly_pm10s) else None
        readings.append(
            HourlyReadingSchema(
                hour=hour_label,
                aqi=_particulate_aqi(p25_val, p10_val, fallback_aqi),
                pm25=_opt_round(p25_val),
                pm10=_opt_round(p10_val),
            )
        )
    return readings


def _aggregate_daily_forecast(
    times: List[str],
    pm25_arr: List[Optional[float]],
    pm10_arr: List[Optional[float]],
    start_idx: int,
    fallback_aqi: int,
) -> List[DailyForecastSchema]:
    """Aggregate Open-Meteo hourly forecast into up to 7 local calendar days."""
    by_date: "OrderedDict[str, Tuple[List[float], List[float]]]" = OrderedDict()
    safe_start = max(0, start_idx)
    for idx in range(safe_start, len(times)):
        date_part = times[idx][:10]
        if date_part not in by_date:
            if len(by_date) >= 7:
                break
            by_date[date_part] = ([], [])
        p25 = pm25_arr[idx] if idx < len(pm25_arr) else None
        p10 = pm10_arr[idx] if idx < len(pm10_arr) else None
        if p25 is not None:
            by_date[date_part][0].append(float(p25))
        if p10 is not None:
            by_date[date_part][1].append(float(p10))

    daily_list: List[DailyForecastSchema] = []
    for date_str, (p25_vals, p10_vals) in by_date.items():
        try:
            day_label = datetime.fromisoformat(date_str).strftime("%a")
        except ValueError:
            day_label = date_str
        mean_p25 = (sum(p25_vals) / len(p25_vals)) if p25_vals else None
        mean_p10 = (sum(p10_vals) / len(p10_vals)) if p10_vals else None
        d_aqi = _particulate_aqi(mean_p25, mean_p10, fallback_aqi)
        daily_list.append(
            DailyForecastSchema(day=day_label, aqi=d_aqi, category=get_aqi_category(d_aqi).name)
        )
    return daily_list


def build_demo_air_quality(city: str) -> AirQualityResponse:
    """Build deterministic offline benchmark telemetry for the requested city."""
    base = DEMO_BASELINES.get(city, DEMO_BASELINES["Ludhiana"])
    aqi, dominant, sufficient, _ = calculate_cpcb_naqi(
        pm25=base["pm25"],
        pm10=base["pm10"],
        no2=base["no2"],
        so2=base["so2"],
        co=base["co"],
        o3=base["o3"],
        nh3=None,
        pb=None,
    )
    cat = get_aqi_category(aqi)

    hourly = [
        HourlyReadingSchema(
            hour=f"{h:02d}:00",
            aqi=(val := round(aqi * (0.72 + 0.22 * math.cos((h - 8) / 24 * 6.283) + 0.18 * math.cos((h - 21) / 24 * 6.283) + 0.04 * math.sin(h * 2.3)))),
            pm25=round(val * 0.52),
        )
        for h in range(24)
    ]

    daily = _build_daily_forecast(aqi, (0.82, 0.95, 1.1, 1.04, 0.9, 1.0, 1.0))
    stations = _build_stations(aqi, DEMO_STATION_SPECS)

    city_info = SUPPORTED_CITIES.get(city)
    coords = {"latitude": city_info["lat"], "longitude": city_info["lon"]} if city_info else None

    return AirQualityResponse(
        loc=city,
        aqi=aqi,
        usAqi=round(aqi * 0.85),
        indexStandard="Indicative CPCB-Method Estimate (Modelled Data)",
        category=cat,
        dominantPollutant=dominant,
        pollutants=PollutantsSchema(
            pm25=base["pm25"],
            pm10=base["pm10"],
            no2=base["no2"],
            so2=base["so2"],
            co=base["co"],
            o3=base["o3"],
            nh3=None,
            pb=None,
            pm25_24h_avg=base["pm25"],
            pm10_24h_avg=base["pm10"],
            no2_24h_avg=base["no2"],
            so2_24h_avg=base["so2"],
            co_8h_avg=base["co"],
            o3_8h_avg=base["o3"],
        ),
        hourly=hourly,
        daily=daily,
        stations=stations,
        lastUpdated=datetime.now().strftime("%I:%M %p"),
        measurementTime="Offline Benchmark Reference",
        isLive=False,
        source="Demonstration baseline (offline benchmark)",
        modelProvider="Synthetic Diurnal Benchmark",
        modelResolution="Illustrative Urban Profile",
        averagingMethod="Benchmark Diurnal Profile",
        dataClassification="Demonstration Baseline",
        cpcbSufficient=sufficient,
        coordinates=coords,
    )


def _parse_openmeteo_response(
    city: str,
    target_lat: float,
    target_lon: float,
    data: Dict[str, Any],
) -> AirQualityResponse:
    """Transform an Open-Meteo JSON payload into a validated AirQualityResponse."""
    current = data.get("current", {})
    hourly = data.get("hourly", {})

    curr_time = current.get("time")
    times = hourly.get("time", [])
    pm25_series = hourly.get("pm2_5", [])
    pm10_series = hourly.get("pm10", [])
    curr_idx = _find_current_hour_index(times, curr_time)

    # Compute 24-hour averages for PM2.5, PM10, NO2, SO2 with coverage tracking
    pm25_24h, pm25_cov = _calc_rolling_mean(pm25_series, curr_idx, 24)
    pm10_24h, pm10_cov = _calc_rolling_mean(pm10_series, curr_idx, 24)
    no2_24h, no2_cov = _calc_rolling_mean(hourly.get("nitrogen_dioxide", []), curr_idx, 24)
    so2_24h, so2_cov = _calc_rolling_mean(hourly.get("sulphur_dioxide", []), curr_idx, 24)

    # Compute 8-hour averages for CO (convert µg/m³ to mg/m³) and Ozone (µg/m³)
    co_8h_raw, co_cov = _calc_rolling_mean(hourly.get("carbon_monoxide", []), curr_idx, 8)
    co_8h = (co_8h_raw / 1000.0) if co_8h_raw is not None else None
    o3_8h, o3_cov = _calc_rolling_mean(hourly.get("ozone", []), curr_idx, 8)

    coverage_complete = any((pm25_cov, pm10_cov)) and sum(
        1 for c in (pm25_cov, pm10_cov, no2_cov, so2_cov, co_cov, o3_cov) if c
    ) >= 3

    # Instantaneous snapshot values (preserve None when missing, never treat 0.0 as falsy)
    inst_pm25 = _opt_float(current.get("pm2_5"))
    inst_pm10 = _opt_float(current.get("pm10"))
    inst_no2 = _opt_float(current.get("nitrogen_dioxide"))
    inst_so2 = _opt_float(current.get("sulphur_dioxide"))
    co_raw = _opt_float(current.get("carbon_monoxide"))
    inst_co = _opt_round(co_raw / 1000.0, 2) if co_raw is not None else None
    inst_o3 = _opt_float(current.get("ozone"))
    us_aqi = int(current["us_aqi"]) if current.get("us_aqi") is not None else None

    # Use rolling averages for CPCB NAQI calculation if available, falling back to instantaneous
    eval_pm25 = pm25_24h if pm25_24h is not None else inst_pm25
    eval_pm10 = pm10_24h if pm10_24h is not None else inst_pm10
    eval_no2 = no2_24h if no2_24h is not None else inst_no2
    eval_so2 = so2_24h if so2_24h is not None else inst_so2
    eval_co = co_8h if co_8h is not None else inst_co
    eval_o3 = o3_8h if o3_8h is not None else inst_o3

    # Compute Indian National AQI with all 8 pollutants (NH3 and Pb are None)
    indian_aqi, dominant_pollutant, cpcb_sufficient, _ = calculate_cpcb_naqi(
        pm25=eval_pm25,
        pm10=eval_pm10,
        no2=eval_no2,
        so2=eval_so2,
        co=eval_co,
        o3=eval_o3,
        nh3=None,  # Not provided by Open-Meteo, strictly None
        pb=None,   # Not provided by Open-Meteo, strictly None
    )
    category = get_aqi_category(indian_aqi)

    raw_time = curr_time or ""
    measurement_time = (
        f"{raw_time.replace('T', ' ')} IST"
        if raw_time
        else datetime.now(IST_TZ).strftime("%Y-%m-%d %H:%M IST")
    )

    forecast_start_idx = curr_idx if curr_idx >= 0 else 0
    hourly_list = _build_hourly_series(times, pm25_series, pm10_series, forecast_start_idx, indian_aqi)
    daily_list = _aggregate_daily_forecast(times, pm25_series, pm10_series, forecast_start_idx, indian_aqi)

    stn_specs = tuple(
        (template.format(city=city), mult, x, y)
        for template, mult, x, y in LIVE_STATION_TEMPLATES
    )
    stations_list = _build_stations(indian_aqi, stn_specs)

    return AirQualityResponse(
        loc=city,
        aqi=indian_aqi,
        usAqi=us_aqi,
        category=category,
        dominantPollutant=dominant_pollutant,
        pollutants=PollutantsSchema(
            pm25=_opt_round(inst_pm25),
            pm10=_opt_round(inst_pm10),
            no2=_opt_round(inst_no2),
            so2=_opt_round(inst_so2),
            co=inst_co,
            o3=_opt_round(inst_o3),
            nh3=None,  # Missing from Open-Meteo
            pb=None,   # Missing from Open-Meteo
            pm25_24h_avg=_opt_round(pm25_24h),
            pm10_24h_avg=_opt_round(pm10_24h),
            no2_24h_avg=_opt_round(no2_24h),
            so2_24h_avg=_opt_round(so2_24h),
            co_8h_avg=_opt_round(co_8h, 2),
            o3_8h_avg=_opt_round(o3_8h),
        ),
        hourly=hourly_list,
        daily=daily_list,
        stations=stations_list,
        lastUpdated=datetime.now(IST_TZ).strftime("%I:%M %p IST"),
        measurementTime=measurement_time,
        isLive=True,
        source="Open-Meteo CAMS Global IFS-AER (~0.4° Model)",
        cpcbSufficient=cpcb_sufficient,
        averagingCoverageComplete=coverage_complete,
        coordinates={"latitude": target_lat, "longitude": target_lon},
    )


async def get_air_quality(city: str, lat: Optional[float] = None, lon: Optional[float] = None) -> AirQualityResponse:
    """Fetch live Open-Meteo CAMS telemetry with caching and offline benchmark fallback."""
    if city in SUPPORTED_CITIES:
        target_lat = SUPPORTED_CITIES[city]["lat"]
        target_lon = SUPPORTED_CITIES[city]["lon"]
    elif lat is not None and lon is not None:
        target_lat = lat
        target_lon = lon
    else:
        return build_demo_air_quality(city)

    cache_key = (city, target_lat, target_lon)
    cached_response = _get_cached_aqi(cache_key)
    if cached_response is not None:
        return cached_response

    # Query live telemetry from Open-Meteo Air Quality API (Copernicus CAMS Global IFS-AER domain)
    # Includes past_days=1 and timezone=Asia/Kolkata for IST-aligned rolling averages & 7-day forecast
    url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality?"
        f"latitude={target_lat}&longitude={target_lon}&"
        f"current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&"
        f"hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&"
        f"past_days=1&forecast_days=7&timezone=Asia%2FKolkata"
    )

    try:
        client = get_http_client()
        resp = await client.get(url)
        if resp.status_code == 200:
            result = _parse_openmeteo_response(city, target_lat, target_lon, resp.json())
            _set_cached_aqi(cache_key, result)
            return result
        logger.warning("Open-Meteo returned HTTP %s for %s. Falling back to benchmark.", resp.status_code, city)
    except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
        logger.warning("Live AQI query failed for %s: %s. Falling back to benchmark.", city, exc)
    except Exception as exc:
        logger.exception("Unexpected error during live AQI query for %s: %s. Falling back to benchmark.", city, exc)

    return build_demo_air_quality(city)
