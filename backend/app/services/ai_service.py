import os
import json
import re
from typing import Optional, List, Tuple
from ..core.config import settings
from ..models.schemas import ChatContextSchema, ChatResponse


def get_gemini_api_key() -> str:
    return (
        settings.GEMINI_API_KEY
        or os.environ.get("GEMINI_API_KEY", "")
        or os.environ.get("GOOGLE_API_KEY", "")
    ).strip()


def run_contextual_fallback(question: str, context: ChatContextSchema) -> ChatResponse:
    q = question.lower()
    loc = context.loc
    aqi = context.aqi
    pm25 = context.pm25
    fam = context.fam
    sens = context.sens

    hi = aqi > 200
    category_name = (
        "Good" if aqi <= 50
        else "Satisfactory" if aqi <= 100
        else "Moderate" if aqi <= 200
        else "Poor" if aqi <= 300
        else "Very Poor" if aqi <= 400
        else "Severe"
    )

    prefix = f"In {loc}, the Indian NAQI is currently {aqi} ({category_name}) with PM2.5 at {pm25} µg/m³. "

    if re.search(r"outside|safe|go out|walk|jog", q):
        text = prefix + (
            "Given the elevated fine particulate concentrations today, I advise keeping outdoor duration short and essential."
            if hi else
            "Outdoor air quality is currently manageable. Morning and midday activities are generally safe, with standard precautions for sensitive individuals."
        )
        cards: List[Tuple[str, str]] = [
            ("Wear a certified N95 or FFP2 respirator", "Standard cloth and surgical masks cannot seal properly against fine PM2.5 particles."),
            ("Schedule essential outdoor trips around midday", "Surface temperature warming between 12 PM and 3 PM lifts the ground-level nocturnal smog layer."),
        ]
        return ChatResponse(text=text, cards=cards, is_live_genai=False, model_used="Contextual Fallback Engine")

    if re.search(r"family|child|kid|elder|baby|asthma|heart", q):
        text = (
            prefix +
            f"For your household of {fam} people—especially with {sens.lower()}—respiratory vulnerability is heightened. Focus on maintaining clean indoor air sanctuaries."
        )
        cards: List[Tuple[str, str]] = [
            ("Keep windows sealed during early morning & late night", "Cold stagnant air traps vehicular and burning emissions close to ground level."),
            ("Run a true HEPA air purifier in the primary bedroom", "Significantly reduces fine particulate burden during 7 to 9 continuous hours of sleep."),
            ("Transition active play indoors", "Children breathe higher volumes of air per kilogram of body weight compared to adults."),
        ]
        return ChatResponse(text=text, cards=cards, is_live_genai=False, model_used="Contextual Fallback Engine")

    if re.search(r"exercise|workout|run|gym|training", q):
        text = prefix + (
            "I advise moving your cardiovascular training indoors today."
            if hi else
            "Outdoor exercise is acceptable, but prefer early afternoon over rush hour intervals."
        )
        cards: List[Tuple[str, str]] = [
            ("Avoid high-intensity outdoor workouts when AQI > 200", "Deep mouth-breathing bypasses nasal filtration and deposits ultrafine particles into pulmonary alveoli."),
            ("Stay at least 300 meters away from high-traffic roadways", "Nitrogen dioxide (NO2) and particulate matter spike sharply along vehicular corridors."),
        ]
        return ChatResponse(text=text, cards=cards, is_live_genai=False, model_used="Contextual Fallback Engine")

    if re.search(r"indoor|home|purifier|room|clean|filter", q):
        text = prefix + "Indoor air tracks outdoor pollution unless active filtration and source containment measures are maintained."
        cards: List[Tuple[str, str]] = [
            ("Conduct brief 10-minute ventilation during midday", "Air exchange when outdoor AQI dips prevents stale CO2 buildup without overloading your indoor air."),
            ("Adopt damp wiping and wet-mopping", "Dry broom sweeping re-suspends fine settled dust directly into your family's breathing zone."),
            ("Operate the kitchen exhaust chimney during and after cooking", "Frying and unvented gas stoves release significant volatile organics and PM2.5."),
        ]
        return ChatResponse(text=text, cards=cards, is_live_genai=False, model_used="Contextual Fallback Engine")

    if re.search(r"pm2|pm 2|high|particulate", q):
        text = prefix + "Fine particulate matter (PM2.5) consists of microscopic combustion particles capable of penetrating deep into blood vessels."
        cards: List[Tuple[str, str]] = [
            ("Fit a certified N95/FFP2 respirator securely", "Ensures electrostatic filtration of sub-micron particles when venturing outside."),
            ("Eliminate secondary indoor smoke sources", "Refrain from lighting incense sticks (agarbatti), mosquito coils, or decorative candles."),
            ("Inspect and vacuum purifier pre-filters", "Preserves airflow efficiency and prolongs main HEPA filter operational life."),
        ]
        return ChatResponse(text=text, cards=cards, is_live_genai=False, model_used="Contextual Fallback Engine")

    if re.search(r"reduce|emission|carbon|footprint|green|sustainable", q):
        text = "Personal daily choices create meaningful collective environmental benefits. Note: Carbon values represent estimated lifestyle factors, not measured air quality changes."
        cards: List[Tuple[str, str]] = [
            ("Shift to shared metro, bus, or carpool", "Avoids approximately 1.8 kg CO2e per 15 km commute compared to solo passenger driving."),
            ("Cook with closed lids and induction or LPG", "Optimizes thermal efficiency and cuts indoor carbonaceous soot emissions."),
            ("Eliminate standby vampire power", "Powering down idle appliances nightly curtails continuous grid electricity consumption."),
        ]
        return ChatResponse(text=text, cards=cards, is_live_genai=False, model_used="Contextual Fallback Engine")

    # General default response
    text = (
        prefix +
        f"I am tuned to your personal profile ({context.life}, {fam} members, sensitive to {sens.lower()}). "
        "Ask about exercise windows, child protection, indoor HEPA usage, or reducing your personal emissions footprint."
    )
    cards = [
        ("Time your outdoor errands around 12 PM – 3 PM", "Takes advantage of diurnal boundary layer expansion and reduced surface smog concentrations."),
        ("Seal gaps under doors and window sills", "Minimizes outdoor particulate infiltration into living spaces during overnight peak smog."),
    ]
    return ChatResponse(text=text, cards=cards, is_live_genai=False, model_used="Contextual Fallback Engine")


def clean_json_markdown(raw: str) -> str:
    """Strips markdown code fences and cleans JSON output."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
        raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()


async def generate_ai_response(question: str, context: Optional[ChatContextSchema] = None) -> ChatResponse:
    ctx = context or ChatContextSchema()
    api_key = get_gemini_api_key()

    if not api_key:
        return run_contextual_fallback(question, ctx)

    # Gemini API Live Execution using official google-genai SDK
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        system_instruction = (
            "You are BreatheWise AI, an expert urban air quality, environmental health, and climate action advisor. "
            "You provide practical, empathetic, and evidence-grounded guidance for citizens dealing with urban air pollution. "
            "Always factor in the user's specific context: city, current Indian NAQI, PM2.5/PM10 concentrations, household size, commute pattern, and health sensitivities. "
            "Give practical, cautious advice (e.g. N95/FFP2 masks, avoiding exercise during peak smog, midday 10-min airing, True HEPA purifiers, damp mopping, kitchen exhaust). "
            "CRITICAL: Do not make medical diagnoses or clinical prescriptions; advise consulting licensed medical professionals for specific medical concerns. "
            "Your output MUST be strictly valid JSON without conversational prefixes outside the JSON, formatted as: "
            "{\"text\": \"2 to 4 concise conversational sentences answering the query directly with context\", "
            "\"cards\": [[\"Short Imperative Title\", \"Scientific or environmental rationale explaining why\"]]}"
        )

        user_prompt = (
            f"Context for {ctx.loc}:\n"
            f"- Current Indian NAQI: {ctx.aqi}\n"
            f"- PM2.5: {ctx.pm25} µg/m³\n"
            f"- PM10: {ctx.pm10} µg/m³\n"
            f"- Household Size: {ctx.fam} people\n"
            f"- Health Sensitivity: {ctx.sens}\n"
            f"- Commute Lifestyle: {ctx.life}\n\n"
            f"User Question: {question}\n\n"
            f"Output JSON with 'text' and 'cards' keys only."
        )

        target_model = settings.GEMINI_MODEL or "gemini-2.5-flash"
        response = client.models.generate_content(
            model=target_model,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.25,
                max_output_tokens=650,
            ),
        )

        cleaned_text = clean_json_markdown(response.text)
        data = json.loads(cleaned_text)

        text_content = data.get("text", "")
        raw_cards = data.get("cards", [])
        formatted_cards: List[Tuple[str, str]] = []
        for c in raw_cards:
            if isinstance(c, (list, tuple)) and len(c) >= 2:
                formatted_cards.append((str(c[0]), str(c[1])))
            elif isinstance(c, dict):
                formatted_cards.append((str(c.get("title", "")), str(c.get("why", ""))))

        if text_content:
            return ChatResponse(
                text=text_content,
                cards=formatted_cards,
                is_live_genai=True,
                model_used=f"{target_model} (Live GenAI)",
            )
    except Exception as exc:
        print(f"[AI Service] Gemini API call handled exception: {exc}. Reverting to contextual fallback.")

    return run_contextual_fallback(question, ctx)
