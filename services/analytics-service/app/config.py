# services/analytics-service/app/config.py
# #analytics-config #clickhouse-settings

from pydantic import BaseSettings

class Settings(BaseSettings):
    # ClickHouse
    clickhouse_host: str = "clickhouse"
    clickhouse_port: int = 8123
    clickhouse_user: str = "default"
    clickhouse_password: str = ""
    clickhouse_db: str = "analytics"
    
    # MongoDB (for ETL)
    mongo_order_uri: str = "mongodb://mongo-order:27017/order_db"
    
    # ETL
    etl_schedule_cron: str = "0 2 * * *"
    
    class Config:
        env_prefix = ""

settings = Settings()
