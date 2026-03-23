# models/payload_model.py
from sqlalchemy import Column, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from core.database import Base


class PayloadLog(Base):
    __tablename__ = "payload_logs"

    user_ref_no     = Column(String(20), primary_key=True, index=True)
    user_code       = Column(String(50), unique=True, nullable=False, index=True)
    calling_app_name = Column(String(100), nullable=True)
    group_code      = Column(String(20), nullable=True)
    appkey          = Column(String(100), nullable=True)
    user_timestamp  = Column(String(50), nullable=True)
    client_ip       = Column(String(50), nullable=True)
    client_hostname = Column(String(200), nullable=True)
    client_browser  = Column(String(200), nullable=True)
    payload_data    = Column(JSON, nullable=True, default={})
    created_at      = Column(DateTime(timezone=True), server_default=func.now())