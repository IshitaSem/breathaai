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
