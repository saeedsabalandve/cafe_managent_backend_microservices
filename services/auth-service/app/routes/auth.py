# services/auth-service/app/routes/auth.py
# #authentication-routes #login #register #refresh

from fastapi import APIRouter, Request, HTTPException, Depends
from ..models.user import UserCreate, UserLogin, UserResponse
from ..services.auth_service import AuthService

router = APIRouter()

def get_auth_service(request: Request) -> AuthService:
    return AuthService(request.app.state.db)

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(user_data: UserCreate, auth_service: AuthService = Depends(get_auth_service)):
    # Check existing user
    existing = await auth_service.db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    # Create user
    hashed_password = await auth_service.hash_password(user_data.password)
    user_doc = {
        "email": user_data.email,
        "hashed_password": hashed_password,
        "name": user_data.name,
        "role": user_data.role,
        "cafe_id": user_data.cafe_id,
        "created_at": datetime.utcnow(),
        "failed_login_attempts": 0
    }
    
    result = await auth_service.db.users.insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    
    return user_doc

@router.post("/login")
async def login(credentials: UserLogin, auth_service: AuthService = Depends(get_auth_service)):
    user, error = await auth_service.authenticate_user(credentials.email, credentials.password)
    
    if error:
        raise HTTPException(status_code=401, detail=error)
    
    # Generate tokens
    access_token = auth_service.generate_access_token(user)
    refresh_token = auth_service.generate_refresh_token(user)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.access_token_expiry,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "cafe_id": user["cafe_id"]
        }
    }

@router.post("/refresh")
async def refresh_token(refresh_token: str, auth_service: AuthService = Depends(get_auth_service)):
    payload = auth_service.decode_token(refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user = await auth_service.db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    new_access_token = auth_service.generate_access_token(user)
    new_refresh_token = auth_service.generate_refresh_token(user)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "expires_in": settings.access_token_expiry
  }
