# core/groq_client.py
import os
import httpx
from typing import Optional
from dotenv import load_dotenv
from groq import Groq
import openai
import requests

load_dotenv()

GROQ_API_KEY       = os.getenv("GROQ_API_KEY")
OPENAI_API_KEY     = os.getenv("OPENAI_API_KEY")
LOCAL_MODEL_API_KEY= os.getenv("LOCAL_MODEL_API_KEY")

groq_client  = Groq(api_key=GROQ_API_KEY)
openai.api_key = OPENAI_API_KEY

DEFAULT_GROQ_MODEL  = "llama-3.3-70b-versatile"
DEFAULT_OPENAI_MODEL= "gpt-4"
DEFAULT_LOCAL_MODEL = "http://localhost:8000/predict"

TIMEOUT = 30   # seconds — prevents hanging forever


def ask_ai(
    user_prompt  : str,
    document_text: str,
    model_source : Optional[str] = None,
    model_name   : Optional[str] = None,
) -> str:

    combined_prompt = f"""You are an intelligent document analysis AI.

USER PROMPT:
{user_prompt}

DOCUMENT CONTENT:
{document_text}

Return a structured and helpful response."""

    if model_source == "groq" or model_source is None:
        model_to_use = model_name or DEFAULT_GROQ_MODEL
        response = groq_client.chat.completions.create(
            model    = model_to_use,
            messages = [{"role": "user", "content": combined_prompt}],
            temperature  = 0.3,
            max_tokens   = 1024,
            timeout      = TIMEOUT,       # ← add timeout
        )
        return response.choices[0].message.content

    elif model_source == "openai":
        model_to_use = model_name or DEFAULT_OPENAI_MODEL
        response = openai.ChatCompletion.create(
            model        = model_to_use,
            messages     = [{"role": "user", "content": combined_prompt}],
            temperature  = 0.3,
            max_tokens   = 1024,
            request_timeout = TIMEOUT,    # ← add timeout
        )
        return response.choices[0].message.content

    elif model_source == "local":
        local_url = model_name or DEFAULT_LOCAL_MODEL
        payload   = {"prompt": combined_prompt, "temperature": 0.3}
        headers   = {"Authorization": f"Bearer {LOCAL_MODEL_API_KEY}"}
        res = requests.post(local_url, json=payload, headers=headers, timeout=TIMEOUT)
        res.raise_for_status()
        return res.json().get("response", "")

    else:
        response = groq_client.chat.completions.create(
            model        = DEFAULT_GROQ_MODEL,
            messages     = [{"role": "user", "content": combined_prompt}],
            temperature  = 0.3,
            max_tokens   = 1024,
            timeout      = TIMEOUT,
        )
        return response.choices[0].message.content