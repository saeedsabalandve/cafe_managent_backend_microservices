# services/analytics-service/app/main.py
# #analytics-service #fastapi #clickhouse #etl-scheduler

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import schedule
import threading
import time

from .config import settings
from .routes import dashboard
from .etl.pipeline import ETLPipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# #background-scheduler
def run_scheduler():
    """Run ETL jobs on schedule"""
    while True:
        schedule.run_pending()
        time.sleep(60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Analytics Service...")
    
    # Initialize ClickHouse connection
    from clickhouse_driver import Client
    app.state.clickhouse = Client(
        host=settings.clickhouse_host,
        port=settings.clickhouse_port,
        user=settings.clickhouse_user,
        password=settings.clickhouse_password,
        database=settings.clickhouse_db,
    )
    
    # Test connection
    result = app.state.clickhouse.execute("SELECT 1")
    logger.info(f"ClickHouse connected: {result}")
    
    # Initialize ETL pipeline
    app.state.etl = ETLPipeline(
        clickhouse_client=app.state.clickhouse,
        mongo_uri=settings.mongo_order_uri,
    )
    
    # Schedule ETL job
    schedule.every().day.at("02:00").do(app.state.etl.run_daily_etl)
    
    # Start scheduler thread
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    logger.info("ETL scheduler started")
    
    yield
    
    # Shutdown
    app.state.clickhouse.disconnect()
    logger.info("Analytics Service stopped")

# #app-factory
def create_app() -> FastAPI:
    app = FastAPI(
        title="Café Management - Analytics Service",
        version="1.0.0",
        lifespan=lifespan,
    )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["GET"],
        allow_headers=["*"],
    )
    
    app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
    
    return app

app = create_app()
