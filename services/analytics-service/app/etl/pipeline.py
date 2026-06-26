# services/analytics-service/app/etl/pipeline.py
# #etl-pipeline #nightly-batch #mongodb-to-clickhouse

from pymongo import MongoClient
from clickhouse_driver import Client
from datetime import datetime, timedelta, date
import logging

from ..services.aggregation import AggregationService

logger = logging.getLogger(__name__)

class ETLPipeline:
    def __init__(self, clickhouse_client: Client, mongo_uri: str):
        self.ch = clickhouse_client
        self.mongo_client = MongoClient(mongo_uri)
        self.aggregation = AggregationService(clickhouse_client)
    
    # #nightly-etl
    def run_daily_etl(self):
        """Extract yesterday's orders from MongoDB, transform, load to ClickHouse"""
        yesterday = date.today() - timedelta(days=1)
        logger.info(f"Starting ETL for {yesterday}")
        
        try:
            # Extract
            orders = self.extract_orders(yesterday)
            logger.info(f"Extracted {len(orders)} orders")
            
            if not orders:
                logger.info("No orders to process")
                return
            
            # Transform & Load
            self.aggregation.aggregate_daily_orders(orders)
            self.aggregation.aggregate_item_popularity(orders)
            
            logger.info("ETL completed successfully")
            
        except Exception as e:
            logger.error(f"ETL failed: {e}", exc_info=True)
    
    # #extract-from-mongodb
    def extract_orders(self, target_date: date) -> list:
        """Extract orders from MongoDB for specific date"""
        db = self.mongo_client.order_db
        collection = db.orders
        
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = datetime.combine(target_date, datetime.max.time())
        
        cursor = collection.find({
            "created_at": {
                "$gte": start_of_day,
                "$lte": end_of_day,
            },
            "status": {"$ne": "CANCELLED"}
        }).batch_size(1000)
        
        return list(cursor)
    
    # #run-manual-etl
    def run_manual_etl(self, start_date: date, end_date: date):
        """Manually trigger ETL for date range"""
        current = start_date
        while current <= end_date:
            logger.info(f"Processing {current}")
            orders = self.extract_orders(current)
            if orders:
                self.aggregation.aggregate_daily_orders(orders)
                self.aggregation.aggregate_item_popularity(orders)
            current += timedelta(days=1)
