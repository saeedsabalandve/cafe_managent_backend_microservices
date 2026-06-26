# services/analytics-service/app/models/metrics.py
# #pydantic-models #analytics-metrics

from pydantic import BaseModel
from datetime import date
from typing import List, Optional
from decimal import Decimal

class DailySalesSummary(BaseModel):
    date: date
    cafe_id: str
    total_orders: int
    total_revenue: Decimal
    average_order_value: Decimal
    peak_hour: int

class TopItem(BaseModel):
    item_id: str
    item_name: str
    quantity_sold: int
    revenue: Decimal
    rank: int

class HourlyHeatmap(BaseModel):
    hour: int
    day_of_week: int
    order_count: int

class DashboardResponse(BaseModel):
    today_summary: DailySalesSummary
    top_items: List[TopItem]
    hourly_heatmap: List[HourlyHeatmap]
    revenue_trend: List[DailySalesSummary]
