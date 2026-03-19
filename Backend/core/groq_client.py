# core/groq_client.py
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- API KEYS ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
LOCAL_MODEL_API_KEY = os.getenv("LOCAL_MODEL_API_KEY")  # could also be URL

# --- Import clients ---
from groq import Groq
import openai
import requests

# Initialize Groq client
groq_client = Groq(api_key=GROQ_API_KEY)

# Initialize OpenAI client
openai.api_key = OPENAI_API_KEY

# --- Default Models ---
DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
DEFAULT_OPENAI_MODEL = "gpt-4"
DEFAULT_LOCAL_MODEL = "http://localhost:8000/predict"  # Example local endpoint


def ask_ai(
    user_prompt: str,
    document_text: str,
    model_source: Optional[str] = None,  # "groq", "openai", "local"
    model_name: Optional[str] = None     # Optional specific model
) -> str:
    """
    Ask AI dynamically from Groq / OpenAI / Local model.
    """

    combined_prompt = f"""
You are an intelligent document analysis AI.

USER PROMPT:
{user_prompt}

DOCUMENT CONTENT:
{document_text}

Return a structured and helpful response.
"""

    # --------------------------
    # 1️⃣ GROQ API
    # --------------------------
    if model_source == "groq":
        model_to_use = model_name or DEFAULT_GROQ_MODEL
        response = groq_client.chat.completions.create(
            model=model_to_use,
            messages=[{"role": "user", "content": combined_prompt}],
            temperature=0.3,
        )
        return response.choices[0].message.content

    # --------------------------
    # 2️⃣ OpenAI API
    # --------------------------
    elif model_source == "openai":
        model_to_use = model_name or DEFAULT_OPENAI_MODEL
        response = openai.ChatCompletion.create(
            model=model_to_use,
            messages=[{"role": "user", "content": combined_prompt}],
            temperature=0.3,
        )
        return response.choices[0].message.content

    # --------------------------
    # 3️⃣ Local Model API
    # --------------------------
    elif model_source == "local":
        local_url = model_name or DEFAULT_LOCAL_MODEL  # URL
        payload = {"prompt": combined_prompt, "temperature": 0.3}
        headers = {"Authorization": f"Bearer {LOCAL_MODEL_API_KEY}"}
        res = requests.post(local_url, json=payload, headers=headers)
        res.raise_for_status()
        return res.json().get("response")  # adjust based on local API

    # --------------------------
    # 4️⃣ Default fallback
    # --------------------------
    else:
        response = groq_client.chat.completions.create(
            model=DEFAULT_GROQ_MODEL,
            messages=[{"role": "user", "content": combined_prompt}],
            temperature=0.3,
        )
        return response.choices[0].message.content