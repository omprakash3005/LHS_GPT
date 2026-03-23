# routers/payload.py
import random
import string
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.database import get_db
from models.payload_model import PayloadLog
from schemas.payload_schema import PayloadRequest, PayloadResponse

router = APIRouter(prefix="/payload", tags=["Payload"])


# -------------------------------------------
# Helper — Generate unique user_ref_no
# Format: timestamp (13 digits) + 1 random digit  → 14 chars total
# e.g.  17738087681606
# -------------------------------------------
def generate_user_ref_no() -> str:
    timestamp_ms = int(datetime.utcnow().timestamp() * 1000)  # 13 digits
    random_suffix = random.randint(0, 9)                       # 1 digit
    return f"{timestamp_ms}{random_suffix}"


# -------------------------------------------
# POST /payload/save
# -------------------------------------------
@router.post("/save", response_model=PayloadResponse)
async def save_payload(
    request: PayloadRequest,
    db: AsyncSession = Depends(get_db)
):
    identifier = request.payload_identifier

    # --- Check user_code uniqueness ---
    result = await db.execute(
        select(PayloadLog).where(PayloadLog.user_code == identifier.user_code)
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"user_code '{identifier.user_code}' already exists."
        )

    # --- Auto-fill timestamp if not provided ---
    user_timestamp = identifier.user_timestamp or datetime.utcnow().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    # --- Auto-generate user_ref_no ---
    user_ref_no = generate_user_ref_no()

    # --- Save to DB ---
    new_entry = PayloadLog(
        user_ref_no      = user_ref_no,
        user_code        = identifier.user_code,
        calling_app_name = identifier.calling_app_name,
        group_code       = identifier.group_code,
        appkey           = identifier.appkey,
        user_timestamp   = user_timestamp,
        client_ip        = identifier.client_ip,
        client_hostname  = identifier.client_hostname,
        client_browser   = identifier.client_browser,
        payload_data     = request.payload_data,
    )

    db.add(new_entry)
    await db.commit()
    await db.refresh(new_entry)

    return PayloadResponse(
        status      = "success",
        user_ref_no = new_entry.user_ref_no,
        user_code   = new_entry.user_code,
        message     = "Payload saved successfully.",
        created_at  = str(new_entry.created_at)
    )


# -------------------------------------------
# GET /payload/{user_code}
# Fetch by unique user_code
# -------------------------------------------
@router.get("/{user_code}", response_model=PayloadResponse)
async def get_payload(
    user_code: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PayloadLog).where(PayloadLog.user_code == user_code)
    )
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(
            status_code=404,
            detail=f"No record found for user_code '{user_code}'"
        )

    return PayloadResponse(
        status      = "success",
        user_ref_no = entry.user_ref_no,
        user_code   = entry.user_code,
        message     = "Record fetched successfully.",
        created_at  = str(entry.created_at)
    )