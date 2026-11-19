from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "HealthSphere AI"
    secret_key: str = "development-only-change-this-secret"
    database_url: str = "sqlite:///./healthsphere.db"
    cors_origins: str = "*"
    access_token_expire_minutes: int = 10080
    ai_provider: str = "demo"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
