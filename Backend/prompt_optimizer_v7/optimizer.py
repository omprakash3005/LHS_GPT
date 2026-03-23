# prompt_optimizer_v7/optimizer.py
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
- Output ONLY the optimized prompt, nothing else
- Do NOT include explanations, headers, or labels
"""

def prompt_optimizer(user_input: str) -> str:
    """
    Production-safe prompt optimizer with retry + fallback.
    """

    if not user_input or not user_input.strip():
        raise ValueError("Input prompt cannot be empty.")

    # ── Model list: primary → fallback ──────────────────
    models = [
        "llama-3.3-70b-versatile",   # primary (stable on Groq)
        "llama-3.1-8b-instant",      # fallback (fast)
    ]

    retries = 3
    base_delay = 2

    for model in models:
        delay = base_delay

        for attempt in range(retries):
            try:
                print(f"[Optimizer] Trying model={model} attempt={attempt+1}")

                completion = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user",   "content": user_input},
                    ],
                    temperature=0.7,
                    max_tokens=512,           # ← was 120, now 512
                )

                result = completion.choices[0].message.content

                # Guard against empty response
                if result and result.strip():
                    print(f"[Optimizer] Success with model={model}")
                    return result.strip()
                else:
                    print(f"[Optimizer] Empty response from model={model}, retrying...")
                    time.sleep(delay)
                    delay *= 2
                    continue

            except Exception as e:
                error_msg = str(e)
                print(f"[Optimizer] Error: {error_msg}")

                if "503" in error_msg or "over_capacity" in error_msg.lower() or "overloaded" in error_msg.lower():
                    print(f"[Optimizer] Model overloaded, retrying in {delay}s...")
                    time.sleep(delay)
                    delay *= 2
                    continue

                # For other errors break out of retry loop and try next model
                print(f"[Optimizer] Non-retryable error, switching model...")
                break

    raise Exception("All models failed to produce a response. Check your GROQ_API_KEY and network.")