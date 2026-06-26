# services/analytics-service/app/routes/dashboard.py
# #dashboard-endpoints #sales-analytics #reports

from fastapi import APIRouter, Request, Query
from datetime import date, datetime, timedelta
from typing import Optional
from clickhouse_driver import Client

router = APIRouter()

def get_clickhouse(request: Request) -> Client:
    return request.app.state.clickhouse

# #today-summary
@router.get("/summary")
async def get_dashboard_summary(
    request: Request,
    cafe_id: str = Query(...),
    date_param: Optional[str] = None,
):
    ch = get_clickhouse(request)
    
    target_date = date_param or date.today().isoformat()
    
    # Query daily orders
    result = ch.execute("""
        SELECT 
            date,
            cafe_id,
            sum(total_orders) as total_orders,
            sum(total_revenue) as total_revenue,
            avg(avg_order_value) as avg_order_value,
            argMax(hour, total_orders) as peak_hour
        FROM daily_orders
        WHERE date = %(date)s AND cafe_id = %(cafe_id)s
        GROUP BY date, cafe_id
    """, {"date": target_date, "cafe_id": cafe_id})
    
    if not result:
        return {"message": "No data for selected date"}
    
    row = result[0]
    return {
        "date": row[0],
        "cafe_id": row[1],
        "total_orders": row[2],
        "total_revenue": float(row[3]),
        "average_order_value": float(row[4]),
        "peak_hour": row[5],
    }

# #top-items
@router.get("/top-items")
async def get_top_items(
    request: Request,
    cafe_id: str = Query(...),
    days: int = 7,
    limit: int = 10,
):
    ch = get_clickhouse(request)
    
    since_date = (date.today() - timedelta(days=days)).isoformat()
    
    result = ch.execute("""
        SELECT 
            item_id,
            any(item_name) as item_name,
            sum(quantity_sold) as total_quantity,
            sum(revenue) as total_revenue
        FROM item_popularity
        WHERE date >= %(since)s AND cafe_id = %(cafe_id)s
        GROUP BY item_id
        ORDER BY total_revenue DESC
        LIMIT %(limit)s
    """, {"since": since_date, "cafe_id": cafe_id, "limit": limit})
    
    return [
        {
            "item_id": row[0],
            "item_name": row[1],
            "quantity_sold": row[2],
            "revenue": float(row[3]),
            "rank": i + 1,
        }
        for i, row in enumerate(result)
    ]

# #revenue-trend
@router.get("/revenue-trend")
async def get_revenue_trend(
    request: Request,
    cafe_id: str = Query(...),
    days: int = 30,
):
    ch = get_clickhouse(request)
    
    since_date = (date.today() - timedelta(days=days)).isoformat()
    
    result = ch.execute("""
        SELECT 
            date,
            cafe_id,
            sum(total_orders) as total_orders,
            sum(total_revenue) as total_revenue,
            avg(avg_order_value) as avg_order_value
        FROM daily_orders
        WHERE date >= %(since)s AND cafe_id = %(cafe_id)s
        GROUP BY date, cafe_id
        ORDER BY date ASC
    """, {"since": since_date, "cafe_id": cafe_id})
    
    return [
        {
            "date": row[0],
            "cafe_id": row[1],
            "total_orders": row[2],
            "total_revenue": float(row[3]),
            "average_order_value": float(row[4]),
        }
        for row in result
    ]

# #hourly-heatmap
@router.get("/hourly-heatmap")
async def get_hourly_heatmap(
    request: Request,
    cafe_id: str = Query(...),
):
    ch = get_clickhouse(request)
    
    since_date = (date.today() - timedelta(days=30)).isoformat()
    
    result = ch.execute("""
        SELECT 
            hour,
            toDayOfWeek(date) as day_of_week,
            sum(total_orders) as order_count
        FROM daily_orders
        WHERE date >= %(since)s AND cafe_id = %(cafe_id)s
        GROUP BY hour, day_of_week
        ORDER BY day_of_week, hour
    """, {"since": since_date, "cafe_id": cafe_id})
    
    return [
        {"hour": row[0], "day_of_week": row[1], "order_count": row[2]}
        for row in result
  ]
