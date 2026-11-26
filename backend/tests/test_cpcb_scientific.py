import pytest
from app.services.aqi_service import (
    calculate_sub_index,
    calculate_cpcb_naqi,
    BREAKPOINTS_CPCB,
    get_aqi_category,
)
from app.core.config import settings
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


# ---------------- 1. ALL EIGHT CPCB POLLUTANT BREAKPOINTS ---------------- #

def test_all_eight_pollutants_present_in_breakpoints():
    expected_pollutants = {"pm25", "pm10", "no2", "so2", "co", "o3", "nh3", "pb"}
    assert set(BREAKPOINTS_CPCB.keys()) == expected_pollutants


def test_pm25_breakpoints_and_boundaries():
    # PM2.5: (0-30: 0-50), (30-60: 51-100), (60-90: 101-200), (90-120: 201-300), (120-250: 301-400), (250-500: 401-500)
    assert calculate_sub_index(0.0, "pm25") == 0
    assert calculate_sub_index(30.0, "pm25") == 50
    assert calculate_sub_index(30.1, "pm25") == 51
    assert calculate_sub_index(60.0, "pm25") == 100
    assert calculate_sub_index(90.0, "pm25") == 200
    assert calculate_sub_index(120.0, "pm25") == 300
    assert calculate_sub_index(250.0, "pm25") == 400
    assert calculate_sub_index(500.0, "pm25") == 500
    assert calculate_sub_index(600.0, "pm25") == 500  # Cap at 500


def test_pm10_breakpoints_and_boundaries():
    # PM10: (0-50: 0-50), (50-100: 51-100), (100-250: 101-200), (250-350: 201-300), (350-430: 301-400), (430-600: 401-500)
    assert calculate_sub_index(0.0, "pm10") == 0
    assert calculate_sub_index(50.0, "pm10") == 50
    assert calculate_sub_index(50.1, "pm10") == 51
    assert calculate_sub_index(100.0, "pm10") == 100
    assert calculate_sub_index(250.0, "pm10") == 200
    assert calculate_sub_index(350.0, "pm10") == 300
    assert calculate_sub_index(430.0, "pm10") == 400
    assert calculate_sub_index(600.0, "pm10") == 500


def test_no2_breakpoints_and_boundaries():
    # NO2: (0-40: 0-50), (40-80: 51-100), (80-180: 101-200), (180-280: 201-300), (280-400: 301-400), (400-500: 401-500)
    assert calculate_sub_index(0.0, "no2") == 0
    assert calculate_sub_index(40.0, "no2") == 50
    assert calculate_sub_index(80.0, "no2") == 100
    assert calculate_sub_index(180.0, "no2") == 200
    assert calculate_sub_index(280.0, "no2") == 300
    assert calculate_sub_index(400.0, "no2") == 400
    assert calculate_sub_index(500.0, "no2") == 500


def test_so2_breakpoints_and_boundaries():
    # SO2: (0-40: 0-50), (40-80: 51-100), (80-380: 101-200), (380-800: 201-300), (800-1600: 301-400), (1600-2000: 401-500)
    assert calculate_sub_index(0.0, "so2") == 0
    assert calculate_sub_index(40.0, "so2") == 50
    assert calculate_sub_index(80.0, "so2") == 100
    assert calculate_sub_index(380.0, "so2") == 200
    assert calculate_sub_index(800.0, "so2") == 300
    assert calculate_sub_index(1600.0, "so2") == 400
    assert calculate_sub_index(2000.0, "so2") == 500


def test_co_breakpoints_and_boundaries():
    # CO in mg/m3: (0-1: 0-50), (1-2: 51-100), (2-10: 101-200), (10-17: 201-300), (17-34: 301-400), (34-50: 401-500)
    assert calculate_sub_index(0.0, "co") == 0
    assert calculate_sub_index(1.0, "co") == 50
    assert calculate_sub_index(2.0, "co") == 100
    assert calculate_sub_index(10.0, "co") == 200
    assert calculate_sub_index(17.0, "co") == 300
    assert calculate_sub_index(34.0, "co") == 400
    assert calculate_sub_index(50.0, "co") == 500


def test_o3_breakpoints_and_boundaries():
    # O3 in µg/m3: (0-50: 0-50), (50-100: 51-100), (100-168: 101-200), (168-208: 201-300), (208-748: 301-400), (748-1000: 401-500)
    assert calculate_sub_index(0.0, "o3") == 0
    assert calculate_sub_index(50.0, "o3") == 50
    assert calculate_sub_index(100.0, "o3") == 100
    assert calculate_sub_index(168.0, "o3") == 200
    assert calculate_sub_index(208.0, "o3") == 300
    assert calculate_sub_index(748.0, "o3") == 400
    assert calculate_sub_index(1000.0, "o3") == 500


def test_nh3_breakpoints_and_boundaries():
    # NH3 in µg/m3: (0-200: 0-50), (200-400: 51-100), (400-800: 101-200), (800-1200: 201-300), (1200-1800: 301-400), (1800-2400: 401-500)
    assert calculate_sub_index(0.0, "nh3") == 0
    assert calculate_sub_index(200.0, "nh3") == 50
    assert calculate_sub_index(400.0, "nh3") == 100
    assert calculate_sub_index(800.0, "nh3") == 200
    assert calculate_sub_index(1200.0, "nh3") == 300
    assert calculate_sub_index(1800.0, "nh3") == 400
    assert calculate_sub_index(2400.0, "nh3") == 500


def test_pb_breakpoints_and_boundaries():
    # Pb in µg/m3: (0-0.5: 0-50), (0.5-1.0: 51-100), (1.0-2.0: 101-200), (2.0-3.0: 201-300), (3.0-3.5: 301-400), (3.5-5.0: 401-500)
    assert calculate_sub_index(0.0, "pb") == 0
    assert calculate_sub_index(0.5, "pb") == 50
    assert calculate_sub_index(1.0, "pb") == 100
    assert calculate_sub_index(2.0, "pb") == 200
    assert calculate_sub_index(3.0, "pb") == 300
    assert calculate_sub_index(3.5, "pb") == 400
    assert calculate_sub_index(5.0, "pb") == 500


# ---------------- 2. MISSING NH3 AND PB (NEVER ZERO) ---------------- #

def test_missing_nh3_and_pb_handling():
    # NH3 and Pb must be None and must not participate in sub-indices
    aqi, dominant, sufficient, sub_map = calculate_cpcb_naqi(
        pm25=45.0,
        pm10=80.0,
        no2=30.0,
        so2=15.0,
        co=1.2,
        o3=40.0,
        nh3=None,
        pb=None,
    )
    assert sub_map["NH3"] is None
    assert sub_map["Pb"] is None
    assert dominant != "NH3"
    assert dominant != "Pb"
    assert sufficient is True


# ---------------- 3. INSUFFICIENT POLLUTANT AVAILABILITY ---------------- #

def test_cpcb_insufficient_data_criteria():
    # Criteria: Minimum 3 pollutants with at least one PM2.5 or PM10

    # Case A: Only 2 pollutants available -> Insufficient
    _, _, sufficient_2pol, _ = calculate_cpcb_naqi(pm25=50.0, pm10=80.0, no2=None, so2=None, co=None, o3=None)
    assert sufficient_2pol is False

    # Case B: 3 pollutants available but NO particulate (no PM2.5, no PM10) -> Insufficient
    _, _, sufficient_nopart, _ = calculate_cpcb_naqi(pm25=None, pm10=None, no2=45.0, so2=20.0, co=1.0)
    assert sufficient_nopart is False

    # Case C: 3 pollutants available including PM2.5 -> Sufficient
    _, _, sufficient_ok, _ = calculate_cpcb_naqi(pm25=50.0, pm10=None, no2=45.0, so2=20.0, co=None)
    assert sufficient_ok is True


# ---------------- 4. CO UNIT CONVERSION ---------------- #

def test_co_unit_conversion():
    # Open-Meteo returns CO in µg/m³ (e.g. 1500 µg/m³).
    # CPCB requires mg/m³: 1500 / 1000 = 1.5 mg/m³.
    raw_openmeteo_co_ug = 1500.0
    cpcb_co_mg = raw_openmeteo_co_ug / 1000.0
    assert cpcb_co_mg == 1.5

    # Sub-index for 1.5 mg/m³ (in band 1.0-2.0 -> 51-100)
    sub_co = calculate_sub_index(cpcb_co_mg, "co")
    assert sub_co == 76  # 51 + (49/1.0)*(0.5) = 75.5 -> 76


# ---------------- 5. ROLLING AVERAGES ---------------- #

def test_rolling_averages_logic():
    # 24-hour window test with sample inputs
    sample_hourly_pm25 = [
        40.0, 42.0, 45.0, 50.0, 55.0, 60.0, 65.0, 70.0,
        75.0, 80.0, 85.0, 80.0, 75.0, 70.0, 65.0, 60.0,
        55.0, 50.0, 45.0, 42.0, 40.0, 38.0, 36.0, 35.0
    ]
    assert len(sample_hourly_pm25) == 24
    expected_24h_mean = sum(sample_hourly_pm25) / 24.0
    assert round(expected_24h_mean, 2) == 56.58

    # 8-hour window test for CO
    sample_hourly_co = [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8]
    assert len(sample_hourly_co) == 8
    expected_8h_co = sum(sample_hourly_co) / 8.0
    assert round(expected_8h_co, 2) == 1.45


# ---------------- 6. MODELLED DATA LABELING & ATTRIBUTION ---------------- #

def test_modelled_data_labeling():
    resp = client.get("/api/air-quality?city=Delhi")
    assert resp.status_code == 200
    data = resp.json()

    # Index standard must state indicative estimate on modelled data
    assert data["indexStandard"] == "Indicative CPCB-Method Estimate (Modelled Data)"
    # Must identify Open-Meteo CAMS Global model
    assert "CAMS Global" in data["source"] or "Copernicus" in data["modelProvider"]
    assert "Global" in data["modelResolution"] or "40 km" in data["modelResolution"] or "~0.4°" in data["modelResolution"]
    # Modelled dispersion zones must not be claimed as physical CAAQMS stations
    assert data["dataClassification"] == "Modelled Atmospheric Telemetry (Not Ground CAAQMS Stations)"
    for stn in data["stations"]:
        assert "Modelled" in stn["name"] or "Dispersion" in stn["name"]


# ---------------- 7. GEMINI CONFIGURATION & FALLBACK ---------------- #

def test_gemini_configured_model():
    assert settings.GEMINI_MODEL in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]


def test_gemini_fallback_on_invalid_key(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "invalid_key_for_testing_12345")
    payload = {
        "question": "What is PM2.5 and why is it dangerous?",
        "context": {"loc": "Delhi", "aqi": 180, "pm25": 90.0, "pm10": 160.0}
    }
    resp = client.post("/api/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_live_genai"] is False
    assert data["model_used"] == "Contextual Fallback Engine"
    assert len(data["cards"]) >= 2


# ---------------- 8. MOCKED UPSTREAM OPEN-METEO ACCURACY & CACHE TESTS ---------------- #

def _make_mock_openmeteo_payload(
    *,
    curr_time="2026-11-26T12:00",
    pm25_curr=0.0,
    pm10_curr=None,
    co_curr=0.0,
    no2_curr=None,
    so2_curr=None,
    o3_curr=None,
    hours_total=192,
    pm25_series=None,
    pm10_series=None,
):
    from datetime import datetime, timedelta
    start = datetime(2026, 11, 25, 0, 0)
    times = [(start + timedelta(hours=i)).strftime("%Y-%m-%dT%H:00") for i in range(hours_total)]
    pm25_vals = pm25_series if pm25_series is not None else [30.0] * hours_total
    pm10_vals = pm10_series if pm10_series is not None else [120.0] * hours_total
    return {
        "current": {
            "time": curr_time,
            "pm2_5": pm25_curr,
            "pm10": pm10_curr,
            "carbon_monoxide": co_curr,
            "nitrogen_dioxide": no2_curr,
            "sulphur_dioxide": so2_curr,
            "ozone": o3_curr,
            "us_aqi": 0,
        },
        "hourly": {
            "time": times,
            "pm2_5": pm25_vals,
            "pm10": pm10_vals,
            "carbon_monoxide": [500.0] * hours_total,
            "nitrogen_dioxide": [40.0] * hours_total,
            "sulphur_dioxide": [10.0] * hours_total,
            "ozone": [30.0] * hours_total,
        },
    }


def test_mocked_zero_and_none_pollutants_and_min_coverage(monkeypatch):
    import asyncio
    from app.services import aqi_service

    aqi_service._aqi_cache.clear()
    payload = _make_mock_openmeteo_payload(
        pm25_curr=0.0,
        pm10_curr=None,
        co_curr=0.0,
        no2_curr=None,
        so2_curr=None,
        o3_curr=None,
        pm25_series=[0.0] * 192,
        pm10_series=[None] * 192,
    )
    # Only 2 pollutants non-null in hourly (pm2_5=0.0, co=0.5, no2/so2/o3=40/10/30) -> let's null out gases in hourly too
    payload["hourly"]["nitrogen_dioxide"] = [None] * 192
    payload["hourly"]["sulphur_dioxide"] = [None] * 192
    payload["hourly"]["ozone"] = [None] * 192
    payload["hourly"]["carbon_monoxide"] = [None] * 192

    captured_urls = []

    class MockResp:
        status_code = 200
        def json(self):
            return payload

    class MockClient:
        async def get(self, url):
            captured_urls.append(url)
            return MockResp()

    monkeypatch.setattr(aqi_service, "get_http_client", lambda: MockClient())
    res = asyncio.run(aqi_service.get_air_quality("Delhi"))

    assert "timezone=Asia%2FKolkata" in captured_urls[0]
    assert res.measurementTime == "2026-11-26 12:00 IST"
    assert res.lastUpdated.endswith("IST")
    # Zero values preserved, None values not fabricated
    assert res.pollutants.pm25 == 0.0
    assert res.pollutants.co == 0.0
    assert res.pollutants.pm10 is None
    assert res.pollutants.no2 is None
    assert res.usAqi == 0
    # Only PM2.5 + CO (2 pollutants < 3) -> cpcbSufficient is False
    assert res.cpcbSufficient is False
    # Zero PM2.5 hourly should yield AQI 0, not 50
    assert res.hourly[0].aqi == 0


def test_mocked_pm10_hourly_averaging_and_7day_forecast(monkeypatch):
    import asyncio
    from app.services import aqi_service

    aqi_service._aqi_cache.clear()
    # Day 0 (past): index 0..23; Day 1 (today 2026-11-26): index 24..47; Days 2..7: index 48..191
    pm25_series = [30.0] * 48 + [90.0] * 144  # Future days jump to 90 -> sub-index 200
    pm10_series = [250.0] * 192  # PM10=250 -> sub-index 200 (would be 45 if 1.5*30 was fabricated!)

    payload = _make_mock_openmeteo_payload(
        curr_time="2026-11-26T12:15",  # Mismatched minute -> should match 2026-11-26T12:00 (idx 36), NOT 191
        pm25_curr=30.0,
        pm10_curr=250.0,
        co_curr=1000.0,
        no2_curr=40.0,
        so2_curr=10.0,
        o3_curr=30.0,
        pm25_series=pm25_series,
        pm10_series=pm10_series,
    )

    class MockResp:
        status_code = 200
        def json(self):
            return payload

    class MockClient:
        async def get(self, url):
            return MockResp()

    monkeypatch.setattr(aqi_service, "get_http_client", lambda: MockClient())
    res = asyncio.run(aqi_service.get_air_quality("Mumbai"))

    # Hourly must use actual pm10=250 (sub-index 200), not 1.5 * 30 = 45
    assert res.hourly[0].pm10 == 250.0
    assert res.hourly[0].aqi == 200
    assert res.averagingCoverageComplete is True
    assert len(res.daily) == 7
    assert res.daily[0].day == "Thu"  # 2026-11-26 is Thursday


def test_mocked_missing_timestamp_does_not_jump_to_future():
    from app.services.aqi_service import _find_current_hour_index
    times = [f"2026-11-26T{h:02d}:00" for h in range(24)] + [f"2026-12-02T{h:02d}:00" for h in range(24)]
    idx = _find_current_hour_index(times, "2099-01-01T00:00")
    assert idx == 24  # Never len(times) - 1 (47)


def test_aqi_cache_hit_expiry_and_max_size(monkeypatch):
    from app.services import aqi_service

    aqi_service._aqi_cache.clear()
    monkeypatch.setattr(aqi_service, "AQI_CACHE_MAX_SIZE", 2)
    monkeypatch.setattr(aqi_service, "AQI_CACHE_TTL_SECONDS", 10.0)

    now = [100.0]
    monkeypatch.setattr(aqi_service.time, "monotonic", lambda: now[0])

    sample = aqi_service.build_demo_air_quality("Delhi")
    aqi_service._set_cached_aqi(("A", 1.0, 1.0), sample)
    aqi_service._set_cached_aqi(("B", 2.0, 2.0), sample)
    assert aqi_service._get_cached_aqi(("A", 1.0, 1.0)) is not None  # Moves A to MRU

    # Adding C evicts LRU (B), keeps A
    aqi_service._set_cached_aqi(("C", 3.0, 3.0), sample)
    assert ("B", 2.0, 2.0) not in aqi_service._aqi_cache
    assert ("A", 1.0, 1.0) in aqi_service._aqi_cache

    # Advance past TTL -> expired entry is evicted on get
    now[0] = 115.0
    assert aqi_service._get_cached_aqi(("A", 1.0, 1.0)) is None
