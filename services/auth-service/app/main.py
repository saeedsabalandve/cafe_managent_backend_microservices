# services/auth-service/app/main.py
# #auth-service #fastapi #entry-point #mongodb #lifespan

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
import logging

from .config import settings
from .routes import auth, users

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# #application-lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Auth Service...")
    app.state.mongo_client = AsyncIOMotorClient(
        settings.mongodb_uri,
        maxPoolSize=20,
        minPoolSize=5,
        serverSelectionTimeoutMS=5000
    )
    app.state.db = app.state.mongo_client[settings.database_name]
    
    # Verify connection
    await app.state.mongo_client.admin.command('ping')
    logger.info("MongoDB connected")
    
    # Create indexes
    await app.state.db.users.create_index("email", unique=True)
    await app.state.db.users.create_index("cafe_id")
    logger.info("Indexes verified")
    
    yield
    
    # Shutdown
    app.state.mongo_client.close()
    logger.info("Auth Service stopped")

# #app-factory
def create_app() -> FastAPI:
    app = FastAPI(
        title="Café Management - Auth Service",
        version="1.0.0",
        lifespan=lifespan
    )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )
    
    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(users.router, prefix="/api/users", tags=["Users"])
    
    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3001, reload=True)
