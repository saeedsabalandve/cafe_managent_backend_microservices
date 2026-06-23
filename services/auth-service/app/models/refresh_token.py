# services/auth-service/app/models/refresh_token.py
# #refresh-token #ttl-index

from pydantic import BaseModel
from datetime import datetime

class RefreshTokenCreate(BaseModel):
    user_id: str
    token_jti: str
    device_info: str = "unknown"
    expires_at: datetime

class RefreshTokenInDB(BaseModel):
    user_id: str
    token_jti: str
    device_info: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    revoked: bool = False
