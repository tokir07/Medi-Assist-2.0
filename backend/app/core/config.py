from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediAssist — AI-Powered Clinical Pre-Consultation"
    API_V1_STR: str = "/api"
    
    # Database (Strict PostgreSQL engine)
    DATABASE_URL: str = "postgresql://postgres:12345678@localhost:5432/mediAssist"
    
    # Security & JWT
    JWT_SECRET_KEY: str = "mediassist_super_secret_jwt_key_2026_clinical_pre_consultation"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Google OAuth 2.0 Credentials
    GOOGLE_CLIENT_ID: str = "mock_google_client_id.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET: str = "mock_google_client_secret"
    GOOGLE_REDIRECT_URI: str = "mediassist://redirect"
    WEB_CLIENT_ID: str = ""
    WEB_CLIENT_SECRET: str = ""

    # OpenRouter AI Gateway Configuration
    AI_PROVIDER: str = "openrouter"  # "openrouter" or "mock"
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "openai/gpt-4o-mini"
    OPENROUTER_HTTP_REFERER: str = "https://mediassist.app"
    OPENROUTER_APP_NAME: str = "MediAssist"

    # Speech Services Configuration
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    STT_PROVIDER: str = "openai"  # "openai", "groq", or "mock"
    STT_MODEL: str = "whisper-1"
    STT_BASE_URL: str = ""
    TTS_PROVIDER: str = "openai"  # "openai" or "mock"
    TTS_MODEL: str = "tts-1"
    MAX_AUDIO_SIZE_MB: int = 10

    # Redis Caching Infrastructure
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = True
    DASHBOARD_CACHE_TTL: int = 30   # seconds
    PROFILE_CACHE_TTL: int = 60     # seconds

    # Timeouts & Retries
    AI_TIMEOUT_SECONDS: int = 30
    AI_MAX_RETRIES: int = 2
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8081",
        "http://localhost:19006",
        "*"
    ]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
