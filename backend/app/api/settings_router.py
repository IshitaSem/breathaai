from typing import Tuple
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import commit_session, get_db
from ..models.db_models import UserSettingsDB
from ..models.schemas import UserSettingsSchema, NotificationPrefs, PrivacyPrefs

router = APIRouter(prefix="/settings", tags=["Settings"])


def _get_or_create_settings(db: Session) -> Tuple[UserSettingsDB, bool]:
    """Fetch the singleton user settings ORM row or stage a default row."""
    record = db.query(UserSettingsDB).first()
    if record:
        return record, False
    record = UserSettingsDB()
    db.add(record)
    return record, True


def _settings_to_schema(record: UserSettingsDB) -> UserSettingsSchema:
    """Serialize a UserSettingsDB ORM instance to the public response schema."""
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


@router.get("", response_model=UserSettingsSchema)
def get_user_settings(db: Session = Depends(get_db)) -> UserSettingsSchema:
    """Return stored user preferences, creating defaults on first access."""
    record, created = _get_or_create_settings(db)
    if created:
        commit_session(db, "initialize user settings")
        db.refresh(record)
    return _settings_to_schema(record)


@router.post("", response_model=UserSettingsSchema)
def save_user_settings(
    payload: UserSettingsSchema,
    db: Session = Depends(get_db),
) -> UserSettingsSchema:
    """Persist updated user profile, notification, privacy, and theme preferences."""
    record, _ = _get_or_create_settings(db)

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

    commit_session(db, "save user settings")
    db.refresh(record)
    return _settings_to_schema(record)
