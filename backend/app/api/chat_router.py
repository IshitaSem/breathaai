import json
import logging
import time
from collections import OrderedDict, deque
from typing import Deque
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.schemas import ChatRequest, ChatResponse
from ..models.db_models import ChatLogDB
from ..services.ai_service import generate_ai_response

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["AI Assistant"])

CHAT_RATE_LIMIT_MAX_REQUESTS = 20
CHAT_RATE_LIMIT_WINDOW_SECONDS = 60.0
CHAT_RATE_LIMIT_MAX_CLIENTS = 1024
_rate_limit_buckets: "OrderedDict[str, Deque[float]]" = OrderedDict()


def _get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _enforce_chat_rate_limit(request: Request) -> None:
    client_ip = _get_client_ip(request)
    now = time.monotonic()
    cutoff = now - CHAT_RATE_LIMIT_WINDOW_SECONDS

    bucket = _rate_limit_buckets.get(client_ip)
    if bucket is None:
        if len(_rate_limit_buckets) >= CHAT_RATE_LIMIT_MAX_CLIENTS:
            _rate_limit_buckets.popitem(last=False)
        bucket = deque()
        _rate_limit_buckets[client_ip] = bucket
    else:
        _rate_limit_buckets.move_to_end(client_ip)

    while bucket and bucket[0] <= cutoff:
        bucket.popleft()

    if len(bucket) >= CHAT_RATE_LIMIT_MAX_REQUESTS:
        retry_after = max(1, int(CHAT_RATE_LIMIT_WINDOW_SECONDS - (now - bucket[0])) + 1)
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please wait before sending another question.",
            headers={"Retry-After": str(retry_after)},
        )

    bucket.append(now)


@router.post("", response_model=ChatResponse)
async def chat_with_assistant(
    req: ChatRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Provides context-aware conversational environmental guidance.
    Integrates Google Gemini 2.5 Flash GenAI when an API key is configured,
    or falls back seamlessly to the local scientific context engine.
    Persists interaction log to SQLite.
    """
    _enforce_chat_rate_limit(request)
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
        logger.warning("Error persisting chat log: %s", err)
        db.rollback()

    return response
