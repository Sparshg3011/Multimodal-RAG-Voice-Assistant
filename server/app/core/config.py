try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    HAS_PYDANTIC_SETTINGS = True
except ImportError:
    from pydantic import BaseSettings
    HAS_PYDANTIC_SETTINGS = False

class Settings(BaseSettings):
    """
    Manages application settings by loading them from environment variables.
    """
    # OPENAI_API_KEY: str
    # ANTHROPIC_API_KEY: str
    GOOGLE_API_KEY: str
    REDIS_URL: str = "redis://localhost:6379"
    
    if HAS_PYDANTIC_SETTINGS:
        model_config = SettingsConfigDict(
            # Tell Pydantic to read variables from a file named .env
            env_file=".env",
            
            # This is the most important part for your error:
            # It tells Pydantic to simply ignore any extra variables it finds in the .env file.
            extra='ignore' 
        )
    else:
        class Config:
            env_file = ".env"
            extra = 'ignore'
        
settings = Settings()