# services/auth-service/app/services/auth_service.py
# #authentication-logic #bcrypt #jwt-rs256

import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..config import settings
import logging

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        with open(settings.jwt_private_key_path, 'rb') as f:
            self.private_key = f.read()
        with open(settings.jwt_public_key_path, 'rb') as f:
            self.public_key = f.read()
    
    # #password-hashing
    async def hash_password(self, password: str) -> str:
        salt = bcrypt.gensalt(rounds=settings.bcrypt_rounds)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    # #password-verification
    async def verify_password(self, password: str, hashed: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    # #user-authentication
    async def authenticate_user(self, email: str, password: str) -> Tuple[Optional[Dict], Optional[str]]:
        user = await self.db.users.find_one({"email": email})
        if not user:
            return None, "Invalid email or password"
        
        if user.get('locked_until') and user['locked_until'] > datetime.now(timezone.utc):
            minutes = (user['locked_until'] - datetime.now(timezone.utc)).seconds // 60
            return None, f"Account locked. Try again in {minutes} minutes"
        
        if not await self.verify_password(password, user['hashed_password']):
            failed = user.get('failed_login_attempts', 0) + 1
            update = {"failed_login_attempts": failed}
            if failed >= settings.max_login_attempts:
                update['locked_until'] = datetime.now(timezone.utc) + timedelta(minutes=settings.account_lockout_minutes)
            await self.db.users.update_one({"_id": user['_id']}, {"$set": update})
            return None, "Invalid email or password"
        
        await self.db.users.update_one(
            {"_id": user['_id']},
            {"$set": {"failed_login_attempts": 0, "locked_until": None}}
        )
        return user, None
    
    # #access-token-generation
    def generate_access_token(self, user: Dict) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            'sub': str(user['_id']),
            'email': user['email'],
            'role': user['role'],
            'cafe_id': user['cafe_id'],
            'iat': now,
            'exp': now + timedelta(seconds=settings.access_token_expiry),
            'iss': settings.jwt_issuer,
            'type': 'access'
        }
        return jwt.encode(payload, self.private_key, algorithm='RS256')
    
    # #refresh-token-generation
    def generate_refresh_token(self, user: Dict) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            'sub': str(user['_id']),
            'iat': now,
            'exp': now + timedelta(seconds=settings.refresh_token_expiry),
            'iss': settings.jwt_issuer,
            'type': 'refresh',
            'jti': f"{user['_id']}-{now.timestamp()}"
        }
        return jwt.encode(payload, self.private_key, algorithm='RS256')
    
    # #token-decoding
    def decode_token(self, token: str) -> Optional[Dict]:
        try:
            return jwt.decode(token, self.public_key, algorithms=['RS256'], issuer=settings.jwt_issuer)
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
