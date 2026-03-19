from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def ask_groq(user_prompt: str, document_text: str):

    combined_prompt = f"""
You are an intelligent document analysis AI.

USER PROMPT:
{user_prompt}

DOCUMENT CONTENT:
{document_text}

Return a structured and helpful response.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",   # ✅ FIXED MODEL
        messages=[
            {"role": "user", "content": combined_prompt}
        ],
        temperature=0.3,
    )

    return response.choices[0].message.content