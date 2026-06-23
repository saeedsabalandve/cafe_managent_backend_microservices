// services/menu-service/src/config/database.ts
// #typeorm-config #postgresql #connection-pool

import { ConnectionOptions } from 'typeorm';
import { Category } from '../entities/Category';
import { MenuItem } from '../entities/MenuItem';
import { Modifier } from '../entities/Modifier';

export const databaseConfig: ConnectionOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'postgres-menu',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'cafe_admin',
  password: process.env.DB_PASSWORD || 'dev_password_2020',
  database: process.env.DB_NAME || 'menu_db',
  entities: [Category, MenuItem, Modifier],
  migrations: ['dist/migrations/*.js'],
  migrationsRun: true,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  
  // #connection-pool
  extra: {
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  },
  
  cli: {
    migrationsDir: 'src/migrations',
  },
};
