# services/auth-service/app/models/user.py
# #user-model #mongodb-document

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str
    cafe_id: str
    role: str = "staff"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    email: str
    name: str
    role: str
    cafe_id: str
    created_at: datetime

    class Config:
        allow_population_by_field_name = True

class UserInDB(BaseModel):
    email: str
    hashed_password: str
    name: str
    role: str
    cafe_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None
