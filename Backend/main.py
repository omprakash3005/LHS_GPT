# main.py
from fastapi import FastAPI
from routers.parser import router
from prompt_optimizer_v7.optimize import router as optimize_router
from routers.payload import router as payload_router      # ← new
from core.database import engine, Base                    # ← new
from models import payload_model                          # ← new (ensures model is registered)

app = FastAPI(title="AI Document Parser")


# --- Create DB tables on startup ---
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


app.include_router(router)
app.include_router(optimize_router)
app.include_router(payload_router)                     


@app.get("/")
def health():
    return {"status": "running"}