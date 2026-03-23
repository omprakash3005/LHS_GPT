# # routers/mode_router.py
# import random
# from datetime import datetime

# from fastapi import APIRouter, HTTPException, Depends
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy.future import select

# from core.database import get_db
# from core.groq_client import ask_ai
# from models.payload_model import PayloadLog
# from schemas.payload_schema import (
#     ModeRequest,
#     BackendModeResponse,
#     FrontendModeResponse,
# )

# router = APIRouter(
#     prefix="/api/genai",
#     tags=["LHS GenAI"]
# )

# DOMAIN = "ai.lighthouseindia.com"


# # ─────────────────────────────────────────
# # Helpers
# # ─────────────────────────────────────────

# def generate_user_ref_no() -> str:
#     ts = int(datetime.utcnow().timestamp() * 1000)   # 13 digits
#     suffix = random.randint(0, 9)
#     return f"{ts}{suffix}"


# def build_canonical_url(
#     app_type: str,
#     ai_keyword: str,
#     app_project_name: str,
#     app_endpoint: str,
# ) -> str:
#     """
#     Format:
#     https://{DOMAIN}/{app_type}/{ai_keyword}/{app_project_name}/{app_endpoint}
#     e.g.
#     https://ai.lighthouseindia.com/api/genai/invoice_ocr/process
#     """
#     parts = [
#         app_type.lower().strip("/"),
#         ai_keyword.lower().strip("/"),
#         app_project_name.lower().replace(" ", "_").strip("/"),
#         app_endpoint.lower().replace(" ", "_").strip("/"),
#     ]
#     path = "/".join(parts)
#     return f"https://{DOMAIN}/{path}"


# async def save_payload_to_db(
#     db: AsyncSession,
#     identifier,
#     payload_data: dict,
# ) -> PayloadLog:
#     """Check uniqueness, generate ref_no, persist and return the row."""

#     result = await db.execute(
#         select(PayloadLog).where(PayloadLog.user_code == identifier.user_code)
#     )
#     existing = result.scalar_one_or_none()
#     if existing:
#         raise HTTPException(
#             status_code=409,
#             detail=f"user_code '{identifier.user_code}' already exists."
#         )

#     user_ref_no    = generate_user_ref_no()
#     user_timestamp = identifier.user_timestamp or datetime.utcnow().strftime(
#         "%Y-%m-%d %H:%M:%S"
#     )

#     entry = PayloadLog(
#         user_ref_no      = user_ref_no,
#         user_code        = identifier.user_code,
#         calling_app_name = identifier.calling_app_name,
#         group_code       = identifier.group_code,
#         appkey           = identifier.appkey,
#         user_timestamp   = user_timestamp,
#         client_ip        = identifier.client_ip,
#         client_hostname  = identifier.client_hostname,
#         client_browser   = identifier.client_browser,
#         payload_data     = payload_data,
#     )

#     db.add(entry)
#     await db.commit()
#     await db.refresh(entry)
#     return entry


# # ─────────────────────────────────────────
# # POST /api/genai/lhsgpt/connect
# # ─────────────────────────────────────────

# @router.post("/lhsgpt/connect")
# async def lhsgpt_connect(
#     request: ModeRequest,
#     db: AsyncSession = Depends(get_db),
# ):
#     """
#     Single endpoint, two behaviours based on `mode`:

#     ► mode = "backend"
#         • Saves payload to DB
#         • Calls /ai/extract AI pipeline (ask_ai)
#         • Returns success + user_ref_no + ai_output

#     ► mode = "frontend"
#         • Saves payload to DB
#         • Builds canonical LHS URL
#         • Returns success + user_ref_no + canonical_url
#     """

#     # ── BACKEND MODE ─────────────────────────────────
#     if request.mode == "backend":

#         # 1. Validate – prompt is mandatory for backend mode
#         if not request.prompt:
#             raise HTTPException(
#                 status_code=422,
#                 detail="'prompt' is required when mode is 'backend'."
#             )
#         print("Validation passed for backend mode.")
#         # 2. Save to DB
#         entry = await save_payload_to_db(
#             db, request.payload_identifier, request.payload_data
#         )

#         # 3. Call AI extract (connected to /ai/extract pipeline)
#         document_text = str(request.payload_data) if request.payload_data else ""
#         ai_output = ask_ai(
#             user_prompt   = request.prompt,
#             document_text = document_text,
#             model_source  = request.model_source,
#             model_name    = request.model_name,
#         )

#         return BackendModeResponse(
#             status      = "success",
#             user_ref_no = entry.user_ref_no,
#             message     = "Backend mode: payload saved and AI processed successfully.",
#             ai_output   = ai_output,
#             created_at  = str(entry.created_at),
#         )

#     # ── FRONTEND MODE ─────────────────────────────────
#     elif request.mode == "frontend":

#         # 1. Validate URL fields
#         missing = [
#             f for f in ["app_project_name", "app_endpoint"]
#             if not getattr(request, f)
#         ]
#         if missing:
#             raise HTTPException(
#                 status_code=422,
#                 detail=f"Frontend mode requires: {', '.join(missing)}"
#             )

#         # 2. Save to DB
#         entry = await save_payload_to_db(
#             db, request.payload_identifier, request.payload_data
#         )

#         # 3. Build canonical URL
#         canonical_url = build_canonical_url(
#             app_type         = request.app_type or "api",
#             ai_keyword       = request.ai_keyword or "genai",
#             app_project_name = request.app_project_name,
#             app_endpoint     = request.app_endpoint,
#         )

#         return FrontendModeResponse(
#             status        = "success",
#             user_ref_no   = entry.user_ref_no,
#             message       = "Frontend mode: payload saved and URL generated successfully.",
#             canonical_url = canonical_url,
#             created_at    = str(entry.created_at),
#         )

#     # ── INVALID MODE ──────────────────────────────────
#     else:
#         raise HTTPException(
#             status_code=400,
#             detail=f"Invalid mode '{request.mode}'. Must be 'backend' or 'frontend'."
#         )