# services/auth-service/app/services/token_service.py
# #token-management #refresh-rotation #blacklist

from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
from ..config import settings
import logging

logger = logging.getLogger(__name__)

class TokenService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def store_refresh_token(self, user_id: str, token_jti: str, device_info: str, expires_at: datetime):
        await self.db.refresh_tokens.insert_one({
            "user_id": user_id,
            "token_jti": token_jti,
            "device_info": device_info,
            "created_at": datetime.now(timezone.utc),
            "expires_at": expires_at,
            "revoked": False
        })
    
    async def revoke_refresh_token(self, token_jti: str):
        await self.db.refresh_tokens.update_one(
            {"token_jti": token_jti},
            {"$set": {"revoked": True}}
        )
    
    async def is_token_revoked(self, token_jti: str) -> bool:
        token = await self.db.refresh_tokens.find_one({"token_jti": token_jti})
        return token is not None and token.get("revoked", False)
    
    async def revoke_all_user_tokens(self, user_id: str):
        await self.db.refresh_tokens.update_many(
            {"user_id": user_id},
            {"$set": {"revoked": True}}
        )
