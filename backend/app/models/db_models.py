from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text
from ..core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class UserSettingsDB(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="Ishita")
    email = Column(String(150), default="")
    location = Column(String(100), default="Ludhiana")
    family_size = Column(Integer, default=4)
    commute_lifestyle = Column(String(100), default="Mixed commute")
    health_sensitivity = Column(String(150), default="Children / elderly at home")
    alert_notif = Column(Boolean, default=True)
    daily_notif = Column(Boolean, default=True)
    weekly_notif = Column(Boolean, default=False)
    share_privacy = Column(Boolean, default=False)
    anon_privacy = Column(Boolean, default=True)
    theme = Column(String(20), default="auto")
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


class PlannerTaskDB(Base):
    __tablename__ = "planner_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String(50), index=True)
    date_str = Column(String(20), index=True)
    completed = Column(Boolean, default=False)
    co2e_kg = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


class CommunityChallengeDB(Base):
    __tablename__ = "community_challenges"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, unique=True, index=True)
    is_joined = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


class ChatLogDB(Base):
    __tablename__ = "chat_logs"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String(100))
    user_question = Column(Text)
    ai_response = Column(Text)
    cards_json = Column(Text, default="[]")
    is_live_genai = Column(Boolean, default=False)
    model_used = Column(String(100), default="Local Fallback")
    created_at = Column(DateTime, default=utcnow)
