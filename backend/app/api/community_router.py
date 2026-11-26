from typing import List, Dict
from fastapi import APIRouter, Depends
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


@router.get("/stats", response_model=CommunityStatsResponse)
def get_community_stats(db: Session = Depends(get_db)):
    # User's weekly completed actions from PlannerTaskDB
    completed_rows = db.query(PlannerTaskDB).filter(PlannerTaskDB.completed == True).all()  # noqa: E712
    user_done_count = len(completed_rows)
    user_co2e_sum = sum(row.co2e_kg for row in completed_rows)

    # Challenge membership
    records = db.query(CommunityChallengeDB).all()
    joined_map = {r.challenge_id: r.is_joined for r in records}

    challenges_list: List[CommunityChallengeItemSchema] = []
    for c in BASE_CHALLENGES:
        is_j = joined_map.get(c["id"], False)
        challenges_list.append(
            CommunityChallengeItemSchema(
                id=c["id"],
                title=c["title"],
                description=c["description"],
                participants=c["participants"] + (1 if is_j else 0),
                is_joined=is_j,
            )
        )

    weekly_history: List[Dict[str, object]] = [
        {"label": "Mon", "value": 18},
        {"label": "Tue", "value": 24},
        {"label": "Wed", "value": 31},
        {"label": "Thu", "value": 27},
        {"label": "Fri", "value": 35},
        {"label": "Sat", "value": 42},
        {"label": "Sun", "value": 38},
    ]

    monthly_history: List[Dict[str, object]] = [
        {"label": "Wk 1", "value": 96},
        {"label": "Wk 2", "value": 118},
        {"label": "Wk 3", "value": 140},
        {"label": "Wk 4", "value": 171},
    ]

    base_avoided = sum(item["value"] for item in weekly_history)  # 215 kg
    total_avoided = round(base_avoided + user_co2e_sum, 1)

    return CommunityStatsResponse(
        user_actions_this_week=user_done_count + 21,
        community_participants=1284,
        total_co2e_avoided_kg=total_avoided,
        weekly_history=weekly_history,
        monthly_history=monthly_history,
        challenges=challenges_list,
    )


@router.post("/challenge/toggle", response_model=CommunityStatsResponse)
def toggle_community_challenge(req: CommunityChallengeToggleRequest, db: Session = Depends(get_db)):
    rec = db.query(CommunityChallengeDB).filter(CommunityChallengeDB.challenge_id == req.challenge_id).first()
    if rec:
        rec.is_joined = req.is_joined
    else:
        rec = CommunityChallengeDB(challenge_id=req.challenge_id, is_joined=req.is_joined)
        db.add(rec)
    db.commit()
    return get_community_stats(db)
