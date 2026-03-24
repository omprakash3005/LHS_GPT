# # routers/unified_router.py
# import uuid
# import random
# from datetime import datetime, timedelta

# from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
# from fastapi.responses import JSONResponse
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy.future import select

# from core.database import get_db
# from core.groq_client import ask_ai
# from models.payload_model import PayloadLog
# from models.session_model import SessionLog
# from services.file_parser import detect_and_parse
# from services.utils import file_to_base64

# router = APIRouter(prefix="/api/genai", tags=["LHS GenAI — Unified"])

# DOMAIN            = "ai.lighthouseindia.com"
# LOCAL_BASE        = "http://127.0.0.1:8000"
# SESSION_TTL_HOURS = 24


# # ─────────────────────────────────────────────────────────
# # Helpers
# # ─────────────────────────────────────────────────────────

# def clean(val, default=None):
#     """Strip Swagger placeholder values and empty strings."""
#     if val in (None, "", "string", "null", "none", "None"):
#         return default
#     return str(val).strip()


# def generate_user_ref_no() -> str:
#     ts = int(datetime.utcnow().timestamp() * 1000)
#     return f"{ts}{random.randint(0, 9)}"


# def generate_session_id() -> str:
#     return str(uuid.uuid4()).replace("-", "")


# def build_canonical_url(ai_keyword: str, project: str, endpoint: str) -> str:
#     parts = [p.lower().replace(" ", "_").strip("/")
#              for p in [ai_keyword, project, endpoint]]
#     return f"https://{DOMAIN}/api/{'/'.join(parts)}"


# def build_access_url(ai_keyword: str, project: str, endpoint: str) -> str:
#     parts = [p.lower().replace(" ", "_").strip("/")
#              for p in [ai_keyword, project, endpoint]]
#     return f"{LOCAL_BASE}/api/{'/'.join(parts)}"


# async def save_payload(db, ident, payload_data) -> PayloadLog:
#     result = await db.execute(
#         select(PayloadLog).where(PayloadLog.user_code == ident["user_code"])
#     )
#     existing = result.scalar_one_or_none()
#     if existing:
#         return existing

#     entry = PayloadLog(
#         user_ref_no      = generate_user_ref_no(),
#         user_code        = ident["user_code"],
#         calling_app_name = ident["calling_app_name"],
#         group_code       = ident["group_code"],
#         appkey           = ident["appkey"],
#         user_timestamp   = ident["user_timestamp"] or datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
#         client_ip        = ident["client_ip"],
#         client_hostname  = ident["client_hostname"],
#         client_browser   = ident["client_browser"],
#         payload_data     = payload_data,
#     )
#     db.add(entry)
#     await db.commit()
#     await db.refresh(entry)
#     return entry


# async def create_session(db, user_ref_no, user_code, mode, session_data) -> SessionLog:
#     session = SessionLog(
#         session_id   = generate_session_id(),
#         user_ref_no  = user_ref_no,
#         user_code    = user_code,
#         mode         = mode,
#         is_active    = True,
#         session_data = session_data,
#         expires_at   = datetime.utcnow() + timedelta(hours=SESSION_TTL_HOURS),
#     )
#     db.add(session)
#     await db.commit()
#     await db.refresh(session)
#     return session


# async def optimize_prompt_text(raw_prompt: str) -> str:
#     from prompt_optimizer_v7.optimizer import prompt_optimizer
#     try:
#         from fastapi.concurrency import run_in_threadpool
#         return await run_in_threadpool(prompt_optimizer, raw_prompt)
#     except Exception:
#         return raw_prompt   # fallback to original


# # ─────────────────────────────────────────────────────────
# # MAIN UNIFIED ENDPOINT
# # POST /api/genai/lhsgpt/connect
# # ─────────────────────────────────────────────────────────

# @router.post("/lhsgpt/connect")
# async def lhsgpt_connect(
#     # Payload identifier
#     mode               : str        = Form(...),
#     user_code          : str        = Form(...),
#     calling_app_name   : str        = Form("LHSGPT"),
#     group_code         : str        = Form("LI"),
#     appkey             : str        = Form("LHSGPT"),
#     client_ip          : str        = Form("0.0.0.0"),
#     client_hostname    : str        = Form(""),
#     client_browser     : str        = Form(""),
#     user_timestamp     : str        = Form(None),

#     # Backend fields
#     prompt             : str        = Form(None),
#     model_provider     : str        = Form("groq"),
#     model_name         : str        = Form(None),
#     optimize_prompt    : bool       = Form(True),

#     # Frontend fields
#     ai_keyword         : str        = Form("genai"),
#     app_project_name   : str        = Form(None),
#     app_endpoint       : str        = Form(None),

#     # Optional file
#     file               : UploadFile = File(None),

#     db                 : AsyncSession = Depends(get_db),
# ):
#     # ── Sanitize all optional string inputs ──────────────
#     model_name       = clean(model_name)
#     model_provider   = clean(model_provider, "groq")
#     ai_keyword       = clean(ai_keyword, "genai")
#     app_project_name = clean(app_project_name)
#     app_endpoint     = clean(app_endpoint)
#     user_timestamp   = clean(user_timestamp)
#     client_ip        = clean(client_ip, "0.0.0.0")
#     client_hostname  = clean(client_hostname, "")
#     client_browser   = clean(client_browser, "")

#     # ── Build identifier dict ─────────────────────────────
#     ident = {
#         "user_code"       : user_code,
#         "calling_app_name": calling_app_name,
#         "group_code"      : group_code,
#         "appkey"          : appkey,
#         "client_ip"       : client_ip,
#         "client_hostname" : client_hostname,
#         "client_browser"  : client_browser,
#         "user_timestamp"  : user_timestamp,
#     }

#     # ── Save payload ──────────────────────────────────────
#     payload_entry = await save_payload(db, ident, {})

#     # ══════════════════════════════════════════════════════
#     # BACKEND MODE
#     # ══════════════════════════════════════════════════════
#     if mode == "backend":

#         if not clean(prompt):
#             raise HTTPException(status_code=422, detail="'prompt' is required for backend mode.")

#         # Step 1 — Optimize prompt
#         final_prompt = prompt
#         optimized    = None
#         if optimize_prompt:
#             optimized    = await optimize_prompt_text(prompt)
#             final_prompt = optimized or prompt

#         # Step 2 — Parse file if uploaded
#         document_text = ""
#         filename      = None
#         file_b64      = None
#         if file and clean(file.filename):
#             file_bytes = await file.read()
#             if file_bytes:
#                 document_text = detect_and_parse(file.filename, file_bytes)
#                 file_b64      = file_to_base64(file_bytes)
#                 filename      = file.filename

#         # Step 3 — Call AI (model_name is None if not provided — uses default)
#         ai_output = ask_ai(
#             user_prompt   = final_prompt,
#             document_text = document_text,
#             model_source  = model_provider,   # "groq" or "openai"
#             model_name    = model_name,        # None → uses default model
#         )

#         # Step 4 — Create session
#         session = await create_session(
#             db,
#             user_ref_no  = payload_entry.user_ref_no,
#             user_code    = user_code,
#             mode         = "backend",
#             session_data = {
#                 "prompt"          : prompt,
#                 "optimized_prompt": optimized,
#                 "model_provider"  : model_provider,
#                 "model_name"      : model_name,
#                 "filename"        : filename,
#                 "ai_output"       : ai_output,
#             },
#         )

#         used_model = f"{model_provider}/{model_name}" if model_name else f"{model_provider}/default"

#         return JSONResponse({
#             "status"          : "success",
#             "user_ref_no"     : payload_entry.user_ref_no,
#             "session_id"      : session.session_id,
#             "message"         : "Backend mode: AI processing completed successfully.",
#             "optimized_prompt": optimized,
#             "ai_output"       : ai_output,
#             "model_used"      : used_model,
#             "filename"        : filename,
#             "file_base64"     : file_b64,
#             "created_at"      : str(session.created_at),
#             "session_expires" : str(session.expires_at),
#         })

#     # ══════════════════════════════════════════════════════
#     # FRONTEND MODE
#     # ══════════════════════════════════════════════════════
#     elif mode == "frontend":

#         if not app_project_name or not app_endpoint:
#             raise HTTPException(
#                 status_code=422,
#                 detail="'app_project_name' and 'app_endpoint' are required for frontend mode."
#             )

#         canonical_url = build_canonical_url(ai_keyword, app_project_name, app_endpoint)
#         access_url    = build_access_url(ai_keyword, app_project_name, app_endpoint)

#         session = await create_session(
#             db,
#             user_ref_no  = payload_entry.user_ref_no,
#             user_code    = user_code,
#             mode         = "frontend",
#             session_data = {
#                 "canonical_url"   : canonical_url,
#                 "access_url"      : access_url,
#                 "ai_keyword"      : ai_keyword,
#                 "app_project_name": app_project_name,
#                 "app_endpoint"    : app_endpoint,
#             },
#         )

#         return JSONResponse({
#             "status"         : "success",
#             "user_ref_no"    : payload_entry.user_ref_no,
#             "session_id"     : session.session_id,
#             "message"        : "Frontend mode: URL generated successfully. Click access_url to open the full application.",
#             "canonical_url"  : canonical_url,
#             "access_url"     : access_url,
#             "created_at"     : str(session.created_at),
#             "session_expires": str(session.expires_at),
#         })

#     else:
#         raise HTTPException(
#             status_code=400,
#             detail=f"Invalid mode '{mode}'. Use 'backend' or 'frontend'."
#         )


# # ─────────────────────────────────────────────────────────
# # SESSION ROUTES
# # ─────────────────────────────────────────────────────────

# @router.get("/session/{session_id}", tags=["Session"])
# async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
#     result = await db.execute(
#         select(SessionLog).where(SessionLog.session_id == session_id)
#     )
#     session = result.scalar_one_or_none()
#     if not session:
#         raise HTTPException(status_code=404, detail="Session not found.")
#     return {
#         "session_id"  : session.session_id,
#         "user_ref_no" : session.user_ref_no,
#         "user_code"   : session.user_code,
#         "mode"        : session.mode,
#         "is_active"   : session.is_active,
#         "session_data": session.session_data,
#         "created_at"  : str(session.created_at),
#         "expires_at"  : str(session.expires_at),
#     }


# @router.get("/sessions/{user_code}", tags=["Session"])
# async def get_user_sessions(user_code: str, db: AsyncSession = Depends(get_db)):
#     result = await db.execute(
#         select(SessionLog).where(SessionLog.user_code == user_code)
#     )
#     sessions = result.scalars().all()
#     if not sessions:
#         raise HTTPException(status_code=404, detail=f"No sessions for '{user_code}'.")
#     return {
#         "user_code": user_code,
#         "total"    : len(sessions),
#         "sessions" : [
#             {
#                 "session_id": s.session_id,
#                 "mode"      : s.mode,
#                 "is_active" : s.is_active,
#                 "created_at": str(s.created_at),
#                 "expires_at": str(s.expires_at),
#             } for s in sessions
#         ],
#     }


# @router.delete("/session/{session_id}", tags=["Session"])
# async def invalidate_session(session_id: str, db: AsyncSession = Depends(get_db)):
#     result = await db.execute(
#         select(SessionLog).where(SessionLog.session_id == session_id)
#     )
#     session = result.scalar_one_or_none()
#     if not session:
#         raise HTTPException(status_code=404, detail="Session not found.")
#     session.is_active = False
#     await db.commit()
#     return {"status": "success", "message": f"Session '{session_id}' invalidated."}