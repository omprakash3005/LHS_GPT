from fastapi import FastAPI
from routers.parser import router 
from prompt_optimizer_v7.optimize import router as optimize_router

app = FastAPI(title="AI Document Parser")

app.include_router(router)
app.include_router(optimize_router)

@app.get("/")
def health():
    return {"status": "running"}