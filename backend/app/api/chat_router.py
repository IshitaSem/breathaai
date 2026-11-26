import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.schemas import ChatRequest, ChatResponse
from ..models.db_models import ChatLogDB
from ..services.ai_service import generate_ai_response

router = APIRouter(prefix="/chat", tags=["AI Assistant"])


@router.post("", response_model=ChatResponse)
async def chat_with_assistant(
    req: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Provides context-aware conversational environmental guidance.
    Integrates Google Gemini 2.5 Flash GenAI when an API key is configured,
    or falls back seamlessly to the local scientific context engine.
    Persists interaction log to SQLite.
    """
    response = await generate_ai_response(req.question, req.context)

    # Persist interaction log to SQLite
    try:
        log_entry = ChatLogDB(
            location=req.context.loc if req.context else "Unknown",
            user_question=req.question,
            ai_response=response.text,
            cards_json=json.dumps(response.cards),
            is_live_genai=response.is_live_genai,
            model_used=response.model_used,
        )
        db.add(log_entry)
        db.commit()
    except Exception as err:
        print(f"[Chat Router] Error persisting chat log: {err}")
        db.rollback()

    return response
