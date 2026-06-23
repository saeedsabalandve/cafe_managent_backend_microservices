-- infrastructure/init-scripts/clickhouse-init.sql
-- #clickhouse-init #analytics-database

CREATE DATABASE IF NOT EXISTS analytics;

USE analytics;

-- #daily-orders-aggregation
CREATE TABLE IF NOT EXISTS analytics.daily_orders (
    date Date,
    cafe_id String,
    hour UInt8,
    total_orders UInt32,
    total_revenue Decimal(10,2),
    avg_order_value Decimal(10,2),
    top_item String
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (cafe_id, date, hour);

-- #menu-item-popularity
CREATE TABLE IF NOT EXISTS analytics.item_popularity (
    date Date,
    cafe_id String,
    item_id String,
    item_name String,
    quantity_sold UInt32,
    revenue Decimal(10,2)
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (cafe_id, date, item_id);
