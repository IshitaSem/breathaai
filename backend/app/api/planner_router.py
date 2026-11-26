from datetime import date
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.db_models import PlannerTaskDB
from ..models.schemas import (
    PlannerTaskItemSchema,
    PlannerToggleRequest,
    PlannerSummaryResponse,
)

router = APIRouter(prefix="/planner", tags=["Planner"])

DEFAULT_TASKS = [
    {"id": "m1", "timeOfDay": "Morning", "description": "Check today’s AQI before leaving; plan outdoor time after 11 am", "co2eKg": 0.0},
    {"id": "m2", "timeOfDay": "Morning", "description": "Keep windows shut during early-morning smog peak", "co2eKg": 0.1},
    {"id": "m3", "timeOfDay": "Morning", "description": "Cook with the chimney/exhaust fan on and use induction or LPG over wood/coal", "co2eKg": 0.6},
    {"id": "m4", "timeOfDay": "Morning", "description": "Commute by metro, bus or carpool instead of a solo drive", "co2eKg": 1.8},
    {"id": "a1", "timeOfDay": "Afternoon", "description": "Ventilate briefly (10 min) when AQI dips most", "co2eKg": 0.0},
    {"id": "a2", "timeOfDay": "Afternoon", "description": "Wet-mop floors and wipe surfaces instead of dry sweeping", "co2eKg": 0.0},
    {"id": "a3", "timeOfDay": "Afternoon", "description": "Set AC to 24–26 °C and clean its filter", "co2eKg": 0.5},
    {"id": "e1", "timeOfDay": "Evening", "description": "Walk or cycle for short errands (under 2 km)", "co2eKg": 0.4},
    {"id": "e2", "timeOfDay": "Evening", "description": "Switch off standby devices and unused lights", "co2eKg": 0.3},
    {"id": "e3", "timeOfDay": "Evening", "description": "Run the purifier in the bedroom 30 min before sleep", "co2eKg": 0.0},
]


@router.get("/tasks", response_model=PlannerSummaryResponse)
def get_daily_tasks(date_str: str = None, db: Session = Depends(get_db)):
    target_date = date_str or date.today().isoformat()
    db_items = db.query(PlannerTaskDB).filter(PlannerTaskDB.date_str == target_date).all()
    completed_map = {item.task_id: item.completed for item in db_items}

    items_list: List[PlannerTaskItemSchema] = []
    total_co2e = 0.0
    completed_count = 0

    for t in DEFAULT_TASKS:
        is_completed = completed_map.get(t["id"], False)
        if is_completed:
            completed_count += 1
            total_co2e += t["co2eKg"]
        items_list.append(
            PlannerTaskItemSchema(
                id=t["id"],
                timeOfDay=t["timeOfDay"],
                description=t["description"],
                co2eKg=t["co2eKg"],
                completed=is_completed,
            )
        )

    return PlannerSummaryResponse(
        date_str=target_date,
        completed_count=completed_count,
        total_tasks=len(DEFAULT_TASKS),
        co2e_avoided_kg=round(total_co2e, 2),
        tasks=items_list,
    )


@router.post("/toggle", response_model=PlannerSummaryResponse)
def toggle_task(req: PlannerToggleRequest, db: Session = Depends(get_db)):
    target_date = req.date_str or date.today().isoformat()

    task_match = next((t for t in DEFAULT_TASKS if t["id"] == req.task_id), None)
    co2e_val = task_match["co2eKg"] if task_match else 0.0

    record = (
        db.query(PlannerTaskDB)
        .filter(PlannerTaskDB.date_str == target_date, PlannerTaskDB.task_id == req.task_id)
        .first()
    )

    if record:
        record.completed = req.completed
    else:
        record = PlannerTaskDB(
            task_id=req.task_id,
            date_str=target_date,
            completed=req.completed,
            co2e_kg=co2e_val,
        )
        db.add(record)

    db.commit()
    return get_daily_tasks(target_date, db)


@router.post("/reset", response_model=PlannerSummaryResponse)
def reset_daily_tasks(date_str: str = None, db: Session = Depends(get_db)):
    target_date = date_str or date.today().isoformat()
    db.query(PlannerTaskDB).filter(PlannerTaskDB.date_str == target_date).delete()
    db.commit()
    return get_daily_tasks(target_date, db)
