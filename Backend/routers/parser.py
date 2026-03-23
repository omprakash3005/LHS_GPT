# routers/parser.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from services.file_parser import detect_and_parse
from services.utils import file_to_base64
from core.groq_client import ask_ai
from typing import Optional

router = APIRouter(prefix="/ai", tags=["AI Parser"])


@router.post("/extract")
async def extract_file(
    prompt: str = Form(...),
    file: Optional[UploadFile] = File(None),
    model_source: Optional[str] = Form(None),
    model_name: Optional[str] = Form(None)
):
    try:
        extracted_text = ""
        file_b64 = None
        filename = None

        # -----------------------------
        # STEP 1 & 2 — Read & Parse File (if provided)
        # -----------------------------
        if file and file.filename:
            file_bytes = await file.read()

            if not file_bytes:
                raise HTTPException(status_code=400, detail="Empty file uploaded")

            extracted_text = detect_and_parse(file.filename, file_bytes)
            file_b64 = file_to_base64(file_bytes)
            filename = file.filename

        # -----------------------------
        # STEP 3 — AI Processing
        # -----------------------------
        ai_output = ask_ai(
            user_prompt=prompt,
            document_text=extracted_text,
            model_source=model_source,
            model_name=model_name
        )

        # -----------------------------
        # FINAL RESPONSE
        # -----------------------------
        return JSONResponse({
            "status": "success",
            "filename": filename,
            "ai_output": ai_output,
            "file_base64": file_b64
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))