# schemas/unified_schema.py
from pydantic import BaseModel
from typing import Optional, Dict, Any


class PayloadIdentifier(BaseModel):
    calling_app_name : str = "LHSGPT"
    group_code       : str = "LI"
    appkey           : str = "LHSGPT"
    user_code        : str
    user_timestamp   : Optional[str] = None
    client_ip        : Optional[str] = "0.0.0.0"
    client_hostname  : Optional[str] = ""
    client_browser   : Optional[str] = ""


# ── BACKEND MODE REQUEST ──────────────────────────────────────────
class BackendRequest(BaseModel):
    """
    mode = "backend"
    Merged: payload + prompt optimizer + file AI extract + model switching
    """
    mode                : str = "backend"
    payload_identifier  : PayloadIdentifier
    payload_data        : Optional[Dict[str, Any]] = {}

    # AI fields
    prompt              : str                           # required for backend
    model_provider      : Optional[str] = "groq"       # "groq" | "openai"
    model_name          : Optional[str] = None          # specific model override
    optimize_prompt     : Optional[bool] = True         # run prompt optimizer first


class BackendResponse(BaseModel):
    status          : str
    user_ref_no     : str
    session_id      : str
    message         : str
    optimized_prompt: Optional[str] = None
    ai_output       : Optional[str] = None
    model_used      : Optional[str] = None
    created_at      : Optional[str] = None


# ── FRONTEND MODE REQUEST ─────────────────────────────────────────
class FrontendRequest(BaseModel):
    """
    mode = "frontend"
    Generates canonical URL that serves full UI + backend
    """
    mode               : str = "frontend"
    payload_identifier : PayloadIdentifier
    payload_data       : Optional[Dict[str, Any]] = {}

    # URL builder
    ai_keyword         : Optional[str] = "genai"       # genai|pyai|agentai|visionai
    app_project_name   : Optional[str] = "LHSGPT"                       # e.g. invoice_ocr
    app_endpoint       : Optional[str] = "dashboard"                          # e.g. process


class FrontendResponse(BaseModel):
    status        : str
    user_ref_no   : str
    session_id    : str
    message       : str
    canonical_url : str
    access_url    : str                                 # direct clickable URL
    created_at    : Optional[str] = None


# ── UNIFIED REQUEST (single endpoint accepts both) ────────────────
class UnifiedRequest(BaseModel):
    mode               : str                            # "backend" | "frontend"
    payload_identifier : PayloadIdentifier
    payload_data       : Optional[Dict[str, Any]] = {}

    # Backend fields
    prompt             : Optional[str] = None
    model_provider     : Optional[str] = "groq"
    model_name         : Optional[str] = None
    optimize_prompt    : Optional[bool] = True

    # Frontend fields
    ai_keyword         : Optional[str] = "genai"
    app_project_name   : Optional[str] = "LHSGPT"
    app_endpoint       : Optional[str] = "dashboard"