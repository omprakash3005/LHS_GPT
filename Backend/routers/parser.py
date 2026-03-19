# routers/parser.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from services.file_parser import detect_and_parse
from services.utils import file_to_base64
from core.groq_client import ask_ai  # Use the multi-API handler

router = APIRouter(prefix="/ai", tags=["AI Parser"])


@router.post("/extract")
async def extract_file(
    prompt: str = Form(...),
    file: UploadFile = File(...),
    model_source: str = Form(None),  # "groq", "openai", "local"
    model_name: str = Form(None)     # Optional specific model
):
    try:
        # -----------------------------
        # STEP 1 — Read File
        # -----------------------------
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Empty file uploaded")

        # -----------------------------
        # STEP 2 — Parse File Content
        # -----------------------------
        extracted_text = detect_and_parse(file.filename, file_bytes)

        # -----------------------------
        # STEP 3 — AI Processing (Dynamic)
        # -----------------------------
        ai_output = ask_ai(
            user_prompt=prompt,
            document_text=extracted_text,
            model_source=model_source,
            model_name=model_name
        )

        # -----------------------------
        # STEP 4 — Convert Original File to Base64 (optional)
        # -----------------------------
        file_b64 = file_to_base64(file_bytes)

        # -----------------------------
        # FINAL RESPONSE
        # -----------------------------
        return JSONResponse({
            "status": "success",
            "filename": file.filename,
            "ai_output": ai_output,
            "file_base64": file_b64
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))