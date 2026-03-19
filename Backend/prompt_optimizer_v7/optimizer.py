import os
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


SYSTEM_PROMPT = """
You are an expert prompt engineer.

Your task is to convert vague or unclear user input into a clear,
detailed, and structured prompt that will produce better AI results.

Rules:
- Make the prompt specific
- Add context if missing
- Improve clarity
- Keep original intent
- Output ONLY the optimized prompt
"""


def prompt_optimizer(user_input: str):
    """
    Production-safe prompt optimizer
    Includes:
    - Retry logic
    - Exponential backoff
    - Model fallback
    """

    models = [
        "openai/gpt-oss-120b",   # primary
        "llama-3.1-8b-instant"   # fallback (fast & stable)
    ]

    retries = 4
    delay = 2

    for model in models:

        for attempt in range(retries):
            try:
                completion = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_input},
                    ],
                    temperature=0.7,
                    max_completion_tokens=120,
                )

                return completion.choices[0].message.content

            except Exception as e:

                error_msg = str(e)

                # Handle 503 Over Capacity
                if "503" in error_msg or "over capacity" in error_msg.lower():
                    print(
                        f"[Retry {attempt+1}] Model {model} overloaded. "
                        f"Retrying in {delay}s..."
                    )
                    time.sleep(delay)
                    delay *= 2
                    continue

                # Unknown error → raise immediately
                raise e

    raise Exception("All models failed or unavailable.")