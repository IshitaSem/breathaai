import asyncio
import json
import pytest
from app.models.schemas import ChatContextSchema
from app.services import ai_service


def _patch_mock_gemini(monkeypatch: pytest.MonkeyPatch, raw_text: str) -> None:
    """Stub Gemini client to return a fixed raw text payload."""

    class MockResponse:
        text = raw_text

    class MockModels:
        async def generate_content(self, **kwargs):
            return MockResponse()

    class MockAio:
        models = MockModels()

    class MockClient:
        aio = MockAio()

    monkeypatch.setattr(ai_service, "get_gemini_api_key", lambda: "test-key")
    monkeypatch.setattr(ai_service, "_get_gemini_client", lambda key: MockClient())


@pytest.mark.parametrize(
    "payload",
    [
        {"text": None, "cards": [["Title", "Why"]]},
        {"cards": [["Title", "Why"]]},
        {"text": 123, "cards": []},
        {"text": True, "cards": []},
        {"text": ["not", "a", "string"], "cards": []},
        {"text": "", "cards": []},
        {"text": "   \n\t  ", "cards": []},
    ],
)
def test_gemini_invalid_text_triggers_contextual_fallback(monkeypatch, payload):
    _patch_mock_gemini(monkeypatch, json.dumps(payload))
    ctx = ChatContextSchema(loc="Delhi", aqi=220, pm25=95.0, pm10=165.0)
    res = asyncio.run(ai_service.generate_ai_response("Is it safe to go outside?", ctx))

    assert res.is_live_genai is False
    assert res.model_used == ai_service.FALLBACK_MODEL_NAME
    assert res.text != "None"
    assert "Delhi" in res.text
    assert len(res.cards) >= 2


def test_gemini_valid_string_text_strips_whitespace(monkeypatch):
    payload = {
        "text": "  Limit outdoor trips today and wear an N95 mask.  ",
        "cards": [["Wear an N95", "Filters fine PM2.5 particles."]],
    }
    _patch_mock_gemini(monkeypatch, json.dumps(payload))
    ctx = ChatContextSchema(loc="Ludhiana", aqi=250, pm25=110.0, pm10=190.0)
    res = asyncio.run(ai_service.generate_ai_response("What should I do?", ctx))

    assert res.is_live_genai is True
    assert res.text == "Limit outdoor trips today and wear an N95 mask."
    assert res.cards == [("Wear an N95", "Filters fine PM2.5 particles.")]
