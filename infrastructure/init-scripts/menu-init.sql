-- infrastructure/init-scripts/menu-init.sql
-- #database-initialization #extensions

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create menu database
CREATE DATABASE menu_db;
\c menu_db;

-- Create schema
CREATE SCHEMA IF NOT EXISTS public;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE menu_db TO cafe_admin;
GRANT ALL ON SCHEMA public TO cafe_admin;
