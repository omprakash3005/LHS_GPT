from core.groq_client import ask_groq

def extract_with_ai(prompt: str, document_text: str):
    return ask_groq(prompt, document_text)