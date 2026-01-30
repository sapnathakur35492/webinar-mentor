import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Change 2.0 Webinar Agent"
    # Default localhost - .env se override hoga production pe
    BASE_URL: str = "http://localhost:8000"
    DATABASE_URL: str = "sqlite:///./change20.db"
    SECRET_KEY: str = "supersecret"
    DEBUG: bool = True
    ALLOWED_ORIGINS: List[str] = ["https://devwebinar.change20.no", "https://devmentor.change20.no", "http://localhost:5173", "http://localhost:3000", "http://localhost:3005", "http://localhost:8000", "http://localhost:8080"]
    OPENAI_API_KEY: str = ""
    MOCK_OPENAI_MODE: bool = False
    USE_MOCK_DB: bool = False
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
