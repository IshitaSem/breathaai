import logging
from typing import Iterator
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from .config import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Iterator[Session]:
    """Yield a scoped SQLAlchemy database session for FastAPI request handling."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Register ORM models and create any missing SQLite tables."""
    from ..models import db_models  # noqa: F401
    Base.metadata.create_all(bind=engine)


def commit_session(db: Session, operation: str) -> None:
    """Commit the active transaction or roll back and raise HTTP 500 on failure."""
    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Database error during %s: %s", operation, exc)
        raise HTTPException(
            status_code=500,
            detail=f"Database error while trying to {operation}.",
        ) from exc
