# services/auth-service/app/routes/users.py
# #user-management #crud

from fastapi import APIRouter, Request, HTTPException, Depends
from typing import List
from ..models.user import UserResponse
from ..services.auth_service import AuthService

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
async def list_users(cafe_id: str, request: Request):
    db = request.app.state.db
    cursor = db.users.find({"cafe_id": cafe_id})
    users = await cursor.to_list(length=100)
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, request: Request):
    db = request.app.state.db
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
