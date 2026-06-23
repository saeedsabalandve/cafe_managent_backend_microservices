-- infrastructure/init-scripts/inventory-init.sql
-- #inventory-database-init

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE DATABASE inventory_db;
\c inventory_db;

CREATE SCHEMA IF NOT EXISTS public;

GRANT ALL PRIVILEGES ON DATABASE inventory_db TO cafe_admin;
GRANT ALL ON SCHEMA public TO cafe_admin;
