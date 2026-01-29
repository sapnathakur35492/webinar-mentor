import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Change 2.0 Webinar Agent"
    BASE_URL: str = "http://localhost:8000"
    DATABASE_URL: str = "sqlite:///./change20.db"
    SECRET_KEY: str = "supersecret"
    DEBUG: bool = True
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost:8000", "http://localhost:8080"]
    OPENAI_API_KEY: str = ""
    USE_MOCK_DB: bool = False
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
