# services/analytics-service/app/services/aggregation.py
# #data-aggregation #materialized-views #time-series

from clickhouse_driver import Client
from datetime import date, datetime
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class AggregationService:
    def __init__(self, client: Client):
        self.client = client
    
    # #aggregate-daily-orders
    def aggregate_daily_orders(self, orders: List[Dict]) -> None:
        """Aggregate raw orders into daily summary"""
        daily_data: Dict[tuple, Dict] = {}
        
        for order in orders:
            created_at = order.get('created_at')
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            
            order_date = created_at.date()
            hour = created_at.hour
            cafe_id = order['cafe_id']
            
            key = (order_date, cafe_id, hour)
            
            if key not in daily_data:
                daily_data[key] = {
                    'date': order_date,
                    'cafe_id': cafe_id,
                    'hour': hour,
                    'total_orders': 0,
                    'total_revenue': 0.0,
                    'order_values': [],
                }
            
            daily_data[key]['total_orders'] += 1
            daily_data[key]['total_revenue'] += float(order.get('total_amount', 0))
            daily_data[key]['order_values'].append(float(order.get('total_amount', 0)))
        
        # Calculate averages
        for data in daily_data.values():
            data['avg_order_value'] = (
                data['total_revenue'] / len(data['order_values'])
                if data['order_values'] else 0
            )
            del data['order_values']
        
        # Insert into ClickHouse
        rows = [
            (
                d['date'], d['cafe_id'], d['hour'],
                d['total_orders'], d['total_revenue'],
                d['avg_order_value'], ''
            )
            for d in daily_data.values()
        ]
        
        self.client.execute(
            "INSERT INTO daily_orders VALUES",
            rows
        )
        
        logger.info(f"Aggregated {len(rows)} daily order records")
    
    # #aggregate-item-popularity
    def aggregate_item_popularity(self, orders: List[Dict]) -> None:
        """Aggregate item sales from orders"""
        item_data: Dict[tuple, Dict] = {}
        
        for order in orders:
            created_at = order.get('created_at')
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            
            order_date = created_at.date()
            cafe_id = order['cafe_id']
            
            for item in order.get('items', []):
                item_id = item.get('menu_item_id', 'unknown')
                item_name = item.get('name', 'Unknown')
                quantity = item.get('quantity', 0)
                subtotal = float(item.get('subtotal', 0))
                
                key = (order_date, cafe_id, item_id)
                
                if key not in item_data:
                    item_data[key] = {
                        'date': order_date,
                        'cafe_id': cafe_id,
                        'item_id': item_id,
                        'item_name': item_name,
                        'quantity_sold': 0,
                        'revenue': 0.0,
                    }
                
                item_data[key]['quantity_sold'] += quantity
                item_data[key]['revenue'] += subtotal
        
        rows = [
            (d['date'], d['cafe_id'], d['item_id'], d['item_name'],
             d['quantity_sold'], d['revenue'])
            for d in item_data.values()
        ]
        
        self.client.execute(
            "INSERT INTO item_popularity VALUES",
            rows
        )
        
        logger.info(f"Aggregated {len(rows)} item popularity records")
