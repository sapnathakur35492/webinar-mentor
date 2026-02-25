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
    MOCK_IMAGE_MODE: bool = False
    USE_MOCK_DB: bool = False
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Gemini (Video Generation via Veo 3.1)
    GEMINI_API_KEY: str = ""
    
    # HeyGen (Video Generation)
    HEYGEN_API_KEY: str = ""
    DEFAULT_VIDEO_PROVIDER: str = "heygen"  # "heygen" or "gemini"

    # AWS S3 Configuration
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_REGION: str = "eu-north-1"
    AWS_S3_BUCKET_NAME: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
