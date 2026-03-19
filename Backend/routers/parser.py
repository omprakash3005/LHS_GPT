from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import io
from services.file_parser import detect_and_parse
from services.extractor import extract_with_ai
from services.utils import file_to_base64

router = APIRouter(prefix="/ai", tags=["AI Parser"])


@router.post("/extract")
async def extract_file(
    prompt: str = Form(...),
    file: UploadFile = File(...)
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
        extracted_text = detect_and_parse(
            file.filename,
            file_bytes
        )

        # -----------------------------
        # STEP 3 — AI Processing
        # -----------------------------
        ai_output = extract_with_ai(
            prompt,
            extracted_text
        )

        # -----------------------------
        # STEP 4 — Convert to Base64
        # -----------------------------
        file_b64 = file_to_base64(file_bytes)

        # -----------------------------
        # FINAL RESPONSE (JSON ONLY)
        # -----------------------------
        return JSONResponse({
            "status": "success",
            "filename": file.filename,
            "ai_output": ai_output
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))