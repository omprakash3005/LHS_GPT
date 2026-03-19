from pydantic import BaseModel

class AIResponse(BaseModel):
    ai_output: str
    file_base64: str