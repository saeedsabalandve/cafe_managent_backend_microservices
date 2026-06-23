# services/auth-service/app/config.py
# #pydantic-settings #environment-config

from pydantic import BaseSettings
from typing import List

class Settings(BaseSettings):
    app_name: str = "auth-service"
    
    # MongoDB
    mongodb_uri: str = "mongodb://mongo-auth:27017"
    database_name: str = "auth_db"
    
    # JWT
    jwt_private_key_path: str = "/keys/jwt-private.pem"
    jwt_public_key_path: str = "/keys/jwt-public.pem"
    access_token_expiry: int = 900
    refresh_token_expiry: int = 604800
    jwt_issuer: str = "cafe-management-auth"
    
    # Security
    bcrypt_rounds: int = 12
    max_login_attempts: int = 5
    account_lockout_minutes: int = 30
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000"]

    class Config:
        env_prefix = "AUTH_"

settings = Settings()
