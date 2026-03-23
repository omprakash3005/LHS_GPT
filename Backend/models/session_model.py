# models/session_model.py
from sqlalchemy import Column, String, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from core.database import Base


class SessionLog(Base):
    __tablename__ = "session_logs"

    session_id   = Column(String(64), primary_key=True, index=True)
    user_ref_no  = Column(String(20), nullable=False)
    user_code    = Column(String(50), nullable=False, index=True)
    mode         = Column(String(20), nullable=False)          # backend | frontend
    is_active    = Column(Boolean, default=True)
    session_data = Column(JSON, nullable=True, default={})
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    expires_at   = Column(DateTime(timezone=True), nullable=True)