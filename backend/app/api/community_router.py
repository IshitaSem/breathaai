from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.db_models import CommunityChallengeDB, PlannerTaskDB
from ..models.schemas import (
    CommunityStatsResponse,
    CommunityChallengeItemSchema,
    CommunityChallengeToggleRequest,
)

router = APIRouter(prefix="/community", tags=["Community"])

BASE_CHALLENGES = [
    {"id": 0, "title": "No-burn week", "description": "Avoid burning waste or leaves for 7 days", "participants": 412},
    {"id": 1, "title": "Car-free Friday", "description": "Use public transport or walk every Friday", "participants": 287},
    {"id": 2, "title": "Switch off standby", "description": "Unplug idle devices nightly", "participants": 356},
]
VALID_CHALLENGE_IDS = {c["id"] for c in BASE_CHALLENGES}

WEEKLY_HISTORY: List[Dict[str, object]] = [
    {"label": "Mon", "value": 18},
    {"label": "Tue", "value": 24},
    {"label": "Wed", "value": 31},
    {"label": "Thu", "value": 27},
    {"label": "Fri", "value": 35},
    {"label": "Sat", "value": 42},
    {"label": "Sun", "value": 38},
]

MONTHLY_HISTORY: List[Dict[str, object]] = [
    {"label": "Wk 1", "value": 96},
    {"label": "Wk 2", "value": 118},
    {"label": "Wk 3", "value": 140},
    {"label": "Wk 4", "value": 171},
]

BASE_AVOIDED_KG = sum(int(item["value"]) for item in WEEKLY_HISTORY)  # 215 kg


@router.get("/stats", response_model=CommunityStatsResponse)
def get_community_stats(db: Session = Depends(get_db)):
    # Aggregate user's completed actions directly in SQL without hydrating ORM rows
    user_done_count, user_co2e_sum = (
        db.query(
            func.count(PlannerTaskDB.id),
            func.coalesce(func.sum(PlannerTaskDB.co2e_kg), 0.0),
        )
        .filter(PlannerTaskDB.completed == True)  # noqa: E712
        .one()
    )

    # Challenge membership
    records = db.query(CommunityChallengeDB).all()
    joined_map = {r.challenge_id: r.is_joined for r in records}

    challenges_list = [
        CommunityChallengeItemSchema(
            id=c["id"],
            title=c["title"],
            description=c["description"],
            participants=c["participants"] + (1 if joined_map.get(c["id"], False) else 0),
            is_joined=joined_map.get(c["id"], False),
        )
        for c in BASE_CHALLENGES
    ]

    total_avoided = round(BASE_AVOIDED_KG + float(user_co2e_sum or 0.0), 1)

    return CommunityStatsResponse(
        user_actions_this_week=int(user_done_count) + 21,
        community_participants=1284,
        total_co2e_avoided_kg=total_avoided,
        weekly_history=WEEKLY_HISTORY,
        monthly_history=MONTHLY_HISTORY,
        challenges=challenges_list,
    )


@router.post("/challenge/toggle", response_model=CommunityStatsResponse)
def toggle_community_challenge(req: CommunityChallengeToggleRequest, db: Session = Depends(get_db)):
    if req.challenge_id not in VALID_CHALLENGE_IDS:
        raise HTTPException(status_code=404, detail="Challenge not found")

    rec = db.query(CommunityChallengeDB).filter(CommunityChallengeDB.challenge_id == req.challenge_id).first()
    if rec:
        rec.is_joined = req.is_joined
    else:
        rec = CommunityChallengeDB(challenge_id=req.challenge_id, is_joined=req.is_joined)
        db.add(rec)
    db.commit()
    return get_community_stats(db)
