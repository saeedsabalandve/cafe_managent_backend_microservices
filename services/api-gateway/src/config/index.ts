// services/api-gateway/src/config/index.ts
// #config #environment-variables #service-registry

import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  corsOrigins: string[];
  jwtPublicKey: string;
  serviceUrls: {
    auth: string;
    menu: string;
    order: string;
    inventory: string;
    analytics: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  redis: {
    url: string;
  };
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  
  // #jwt-public-key-loading
  jwtPublicKey: process.env.JWT_PUBLIC_KEY_PATH 
    ? fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH, 'utf8')
    : 'fallback-dev-key',
  
  serviceUrls: {
    auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    menu: process.env.MENU_SERVICE_URL || 'http://menu-service:3002',
    order: process.env.ORDER_SERVICE_URL || 'http://order-service:3003',
    inventory: process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3004',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3005',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://redis:6379',
  },
};
