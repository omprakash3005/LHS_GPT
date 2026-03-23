# # main.py
# import os
# from fastapi import FastAPI
# from fastapi.staticfiles import StaticFiles
# from fastapi.responses import FileResponse
# from fastapi.middleware.cors import CORSMiddleware

# from routers.parser import router as parser_router
# from prompt_optimizer_v7.optimize import router as optimize_router
# from routers.payload import router as payload_router
# from routers.unified_router import router as unified_router   # ← replaces mode_router
# from fastapi import Request


# from core.database import engine, Base
# from models import payload_model, session_model               # register both models

# app = FastAPI(
#     title="LHS AI Platform",
#     description="Lighthouse India — Unified AI Gateway",
#     version="2.0.0"
# )



# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# @app.on_event("startup")
# async def startup():
#     async with engine.begin() as conn:
#         await conn.run_sync(Base.metadata.create_all)

# @app.get("/")
# def health():
#     return {"status": "running", "platform": "LHS AI", "version": "2.0.0"}

# # ── Routers (all before catch-all) ───────────────────────
# app.include_router(parser_router)       # POST /ai/extract  (kept for direct use)
# app.include_router(optimize_router)     # POST /optimize
# app.include_router(payload_router)      # POST /payload/save | GET /payload/{user_code}
# app.include_router(unified_router) 
# app.include_router(payload_router)   # POST /payload/save | GET /payload/{user_code}

# # ── Static Files ─────────────────────────────────────────
# FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "template")
 
# if os.path.exists(FRONTEND_DIR):
#     app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")
 
# # ── Frontend — Dashboard & Canonical URL Routes ──────────
# # Clicking either of these URLs opens the full LHSGPT frontend
 
# @app.get("/api/genai/lhsgpt/dashboard")
# async def dashboard():
#     """
#     Access URL:    http://127.0.0.1:8000/api/genai/lhsgpt/dashboard
#     Canonical URL: https://ai.lighthouseindia.com/api/genai/lhsgpt/dashboard
#     Opens the full LHSGPT frontend with all backend APIs connected.
#     """
#     if os.path.exists(FRONTEND_DIR):
#         return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
#     return {"detail": "Frontend not found. Place frontend/ folder in Backend/."}
 
 
# @app.get("/api/genai/{project}/{endpoint}")
# async def serve_frontend(project: str, endpoint: str):
#     """
#     Catch-all for any canonical URL pattern.
#     e.g. /api/genai/invoice_ocr/process → opens LHSGPT frontend
#     """
#     if os.path.exists(FRONTEND_DIR):
#         return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
#     return {"detail": "Frontend not found."}


# main.py
import os
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from routers.unified_router import router as unified_router
from routers.parser import router
from prompt_optimizer_v7.optimize import router as optimize_router
from routers.payload import router as payload_router
# from routers.mode_router import router as mode_router

from core.database import engine, Base
from models import payload_model

# ── Paths ─────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, "template")
STATIC_DIR   = os.path.join(BASE_DIR, "static")

# ── Auto-create folders (prevents RuntimeError on fresh clone) ──
os.makedirs(TEMPLATE_DIR,                          exist_ok=True)
os.makedirs(STATIC_DIR,                            exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "css"),       exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "js"),        exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "assets"),    exist_ok=True)

# ── Jinja2 Templates ──────────────────────────────────────
templates = Jinja2Templates(directory=TEMPLATE_DIR)

# rest of main.py stays exactly the same ...

# ── App ───────────────────────────────────────────────────
app = FastAPI(
    title="LHS AI Platform",
    description="Lighthouse India — AI Document Processing & GenAI Gateway",
    version="1.0.0"
)

# ── CORS ─────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # restrict in production to your IP/domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static Files ──────────────────────────────────────────
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ── DB Table Creation on Startup ─────────────────────────
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# ── Health Check ─────────────────────────────────────────
@app.get("/")
async def health(request: Request):
    return {
        "status"  : "running",
        "platform": "LHS AI",
        "version" : "1.0.0",
        "host"    : request.client.host
    }

# ── API Routers (MUST be before catch-all GET routes) ─────
app.include_router(router)           # POST /ai/extract
app.include_router(optimize_router)  # POST /optimize
app.include_router(payload_router)   # POST /payload/save | GET /payload/{user_code}
app.include_router(unified_router)    # POST /api/genai/lhsgpt/connect

@app.get("/api/genai/lhsgpt/dashboard")
async def dashboard(request: Request):
    return templates.TemplateResponse(
        request = request,
        name    = "index.html",
        context = {
            "title"       : "LHSGPT — Lighthouse India AI",
            "backend_url" : str(request.base_url).rstrip("/"),
            "version"     : "1.0.0",
        }
    )

# ── Canonical URL Catch-All (MUST be last) ────────────────
@app.get("/api/genai/{project}/{endpoint}")
async def serve_frontend(request: Request, project: str, endpoint: str):
    return templates.TemplateResponse(
        request = request,
        name    = "index.html",
        context = {
            "title"       : f"LHSGPT — {project}",
            "backend_url" : str(request.base_url).rstrip("/"),
            "version"     : "1.0.0",
        }
    )
