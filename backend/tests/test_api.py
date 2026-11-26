import pytest
from datetime import date
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import init_db, SessionLocal
from app.services.aqi_service import calculate_cpcb_naqi, get_aqi_category
from app.models.db_models import UserSettingsDB, PlannerTaskDB, CommunityChallengeDB

init_db()
client = TestClient(app)


# ---------------- 1. HEALTH CHECK ---------------- #

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "BreatheWise AI Backend"
    assert "database" in data
    assert "gemini_configured" in data


# ---------------- 2. AIR QUALITY & CPCB NAQI ---------------- #

def test_air_quality_api_live_or_fallback():
    response = client.get("/api/air-quality?city=Delhi")
    assert response.status_code == 200
    data = response.json()
    assert data["loc"] == "Delhi"
    assert data["aqi"] > 0
    assert "category" in data
    assert "name" in data["category"]
    assert "color" in data["category"]
    assert "pollutants" in data
    assert "pm25" in data["pollutants"]
    assert "pm10" in data["pollutants"]
    assert "no2" in data["pollutants"]
    assert "so2" in data["pollutants"]
    assert "co" in data["pollutants"]
    assert "o3" in data["pollutants"]
    assert "dominantPollutant" in data
    assert len(data["hourly"]) > 0
    assert len(data["daily"]) > 0
    assert len(data["stations"]) > 0
    assert "source" in data
    assert "measurementTime" in data


def test_cpcb_naqi_calculation_matrix():
    # Case 1: Clean ambient air
    aqi, dominant, sufficient, sub_map = calculate_cpcb_naqi(pm25=15.0, pm10=30.0, no2=20.0, so2=10.0, co=0.5, o3=25.0)
    assert aqi <= 50
    assert sufficient is True
    cat = get_aqi_category(aqi)
    assert cat.name == "Good"

    # Case 2: Severe PM2.5
    aqi, dominant, sufficient, sub_map = calculate_cpcb_naqi(pm25=280.0, pm10=180.0, no2=50.0, so2=15.0, co=1.2, o3=30.0)
    assert aqi > 400
    assert dominant == "PM2.5"
    cat = get_aqi_category(aqi)
    assert cat.name == "Severe"

    # Case 3: High NO2 driving AQI
    aqi, dominant, sufficient, sub_map = calculate_cpcb_naqi(pm25=25.0, pm10=40.0, no2=250.0, so2=10.0, co=0.8, o3=20.0)
    assert aqi >= 201  # Poor
    assert dominant == "NO2"

    # Case 4: Missing optional pollutants handling
    aqi, dominant, sufficient, sub_map = calculate_cpcb_naqi(pm25=85.0, pm10=140.0, no2=None, so2=None, co=None, o3=None)
    assert aqi > 0
    assert dominant in ["PM2.5", "PM10"]


# ---------------- 3. GENAI ASSISTANT & FALLBACK ---------------- #

def test_chat_assistant_flow():
    payload = {
        "question": "Is it safe to go for a run outside today?",
        "context": {
            "loc": "Delhi",
            "aqi": 180,
            "pm25": 90.0,
            "pm10": 160.0,
            "fam": 4,
            "sens": "Children / elderly at home",
            "life": "Mixed commute"
        }
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "text" in data
    assert len(data["text"]) > 10
    assert "cards" in data
    assert len(data["cards"]) >= 2
    assert "model_used" in data
    # Health guidance must not diagnose clinical conditions
    assert "prescription" not in data["text"].lower()


def test_chat_empty_question_validation():
    # Empty question validation
    response = client.post("/api/chat", json={"question": ""})
    assert response.status_code == 422


# ---------------- 4. PLANNER & TIMEZONE / DATE ISOLATION ---------------- #

def test_planner_date_isolation():
    today_str = date.today().isoformat()
    tomorrow_str = "2029-01-01"

    # 1. Reset today's tasks
    client.post(f"/api/planner/reset?date_str={today_str}")

    # 2. Toggle task m1 today
    res1 = client.post("/api/planner/toggle", json={"task_id": "m1", "completed": True, "date_str": today_str})
    assert res1.status_code == 200
    today_data = res1.json()
    m1_today = next(t for t in today_data["tasks"] if t["id"] == "m1")
    assert m1_today["completed"] is True

    # 3. Fetch tomorrow -> m1 should NOT be completed
    res_tomorrow = client.get(f"/api/planner/tasks?date_str={tomorrow_str}")
    assert res_tomorrow.status_code == 200
    tomorrow_data = res_tomorrow.json()
    m1_tomorrow = next(t for t in tomorrow_data["tasks"] if t["id"] == "m1")
    assert m1_tomorrow["completed"] is False


# ---------------- 5. SETTINGS & INPUT VALIDATION ---------------- #

def test_settings_validation_invalid_family_size():
    # Family size outside 1-20
    invalid_payload = {
        "name": "Ishita",
        "loc": "Delhi",
        "fam": 45,  # Invalid: le=20
        "life": "Mixed commute",
        "sens": "None",
        "theme": "auto"
    }
    response = client.post("/api/settings", json=invalid_payload)
    assert response.status_code == 422


def test_settings_persistence_across_sessions():
    update_payload = {
        "name": "Ishita Semwal Verified",
        "email": "ishita.verified@hack2skill.org",
        "loc": "Bengaluru",
        "fam": 3,
        "life": "Public transport user",
        "sens": "Asthma or lung condition",
        "theme": "dark",
        "nt": {"alert": True, "daily": True, "weekly": False},
        "priv": {"share": True, "anon": True}
    }
    save_res = client.post("/api/settings", json=update_payload)
    assert save_res.status_code == 200

    # Simulate fresh database connection / server restart
    db = SessionLocal()
    try:
        record = db.query(UserSettingsDB).first()
        assert record is not None
        assert record.name == "Ishita Semwal Verified"
        assert record.location == "Bengaluru"
        assert record.family_size == 3
        assert record.health_sensitivity == "Asthma or lung condition"
    finally:
        db.close()


# ---------------- 6. COMMUNITY CHALLENGES PERSISTENCE ---------------- #

def test_community_persistence_across_sessions():
    # Toggle challenge 1 (Car-free Friday)
    toggle_res = client.post("/api/community/challenge/toggle", json={"challenge_id": 1, "is_joined": True})
    assert toggle_res.status_code == 200

    # Query directly from database
    db = SessionLocal()
    try:
        rec = db.query(CommunityChallengeDB).filter(CommunityChallengeDB.challenge_id == 1).first()
        assert rec is not None
        assert rec.is_joined is True
    finally:
        db.close()
