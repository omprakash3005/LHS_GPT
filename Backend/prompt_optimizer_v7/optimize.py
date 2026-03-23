# prompt_optimizer_v7/optimize.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.concurrency import run_in_threadpool
from prompt_optimizer_v7.optimizer import prompt_optimizer

router = APIRouter()

class PromptRequest(BaseModel):
    text: str

@router.post("/optimize")
async def optimize(data: PromptRequest):
    if not data.text or not data.text.strip():
        raise HTTPException(status_code=422, detail="'text' field cannot be empty.")
    try:
        result = await run_in_threadpool(prompt_optimizer, data.text)
        return { "optimized_prompt": result }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimizer failed: {str(e)}")