# schemas/payload_schema.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class PayloadIdentifier(BaseModel):
    calling_app_name : str = "LHSGPT"
    group_code       : str = "LI"
    appkey           : str = "LHSGPT"
    user_code        : str                        # unique, required
    user_timestamp   : Optional[str] = None       # auto-filled if not sent
    client_ip        : Optional[str] = "0.0.0.0"
    client_hostname  : Optional[str] = ""
    client_browser   : Optional[str] = ""


class PayloadRequest(BaseModel):
    payload_identifier : PayloadIdentifier
    payload_data       : Optional[Dict[str, Any]] = {}


class PayloadResponse(BaseModel):
    status          : str
    user_ref_no     : str                         # auto-generated
    user_code       : str
    message         : str
    created_at      : Optional[str] = None