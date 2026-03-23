# schemas/payload_schema.py
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


class PayloadRequest(BaseModel):
    payload_identifier : PayloadIdentifier
    payload_data       : Optional[Dict[str, Any]] = {}


class PayloadResponse(BaseModel):
    status          : str
    user_ref_no     : str
    user_code       : str
    message         : str
    created_at      : Optional[str] = None


# ── NEW ──────────────────────────────────────────────
class ModeRequest(BaseModel):
    """
    Single request body for both backend and frontend modes.
    """
    mode               : str                          # "backend" | "frontend"
    payload_identifier : PayloadIdentifier
    payload_data       : Optional[Dict[str, Any]] = {}

    # AI extract fields (optional – only used when mode=backend)
    prompt             : Optional[str] = None
    model_source       : Optional[str] = None         # "groq"|"openai"|"local"
    model_name         : Optional[str] = None

    # URL builder fields (optional – only used when mode=frontend)
    app_type           : Optional[str] = "api"        # "api"
    ai_keyword         : Optional[str] = "genai"      # genai|pyai|agentai|visionai
    app_project_name   : Optional[str] = None         # e.g. invoice_ocr
    app_endpoint       : Optional[str] = None         # e.g. process


class BackendModeResponse(BaseModel):
    status      : str
    user_ref_no : str
    message     : str
    ai_output   : Optional[str] = None
    created_at  : Optional[str] = None


class FrontendModeResponse(BaseModel):
    status        : str
    user_ref_no   : str
    message       : str
    canonical_url : str
    created_at    : Optional[str] = None