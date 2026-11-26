from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.db_models import UserSettingsDB
from ..models.schemas import UserSettingsSchema, NotificationPrefs, PrivacyPrefs

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=UserSettingsSchema)
def get_user_settings(db: Session = Depends(get_db)):
    record = db.query(UserSettingsDB).first()
    if not record:
        record = UserSettingsDB()
        db.add(record)
        db.commit()
        db.refresh(record)

    return UserSettingsSchema(
        name=record.name,
        email=record.email or "",
        loc=record.location,
        fam=record.family_size,
        life=record.commute_lifestyle,
        sens=record.health_sensitivity,
        theme=record.theme,
        nt=NotificationPrefs(
            alert=record.alert_notif,
            daily=record.daily_notif,
            weekly=record.weekly_notif,
        ),
        priv=PrivacyPrefs(
            share=record.share_privacy,
            anon=record.anon_privacy,
        ),
    )


@router.post("", response_model=UserSettingsSchema)
def save_user_settings(payload: UserSettingsSchema, db: Session = Depends(get_db)):
    record = db.query(UserSettingsDB).first()
    if not record:
        record = UserSettingsDB()
        db.add(record)

    record.name = payload.name
    record.email = payload.email or ""
    record.location = payload.loc
    record.family_size = payload.fam
    record.commute_lifestyle = payload.life
    record.health_sensitivity = payload.sens
    record.theme = payload.theme
    record.alert_notif = payload.nt.alert
    record.daily_notif = payload.nt.daily
    record.weekly_notif = payload.nt.weekly
    record.share_privacy = payload.priv.share
    record.anon_privacy = payload.priv.anon

    db.commit()
    db.refresh(record)
    return payload
