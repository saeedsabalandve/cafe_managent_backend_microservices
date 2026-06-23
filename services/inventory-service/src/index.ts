// services/inventory-service/src/index.ts
// #inventory-service #entry-point

import "reflect-metadata";
import express from 'express';
import { createConnection } from 'typeorm';
import { stockRouter } from './routes/stock.routes';
import { reportsRouter } from './routes/reports.routes';
import { ReorderChecker } from './jobs/reorderChecker';

const app = express();
app.use(express.json());

app.use('/api/stock', stockRouter);
app.use('/api/reports', reportsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'inventory-service' });
});

createConnection({
  type: 'postgres',
  host: process.env.DB_HOST || 'postgres-inventory',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'cafe_admin',
  password: process.env.DB_PASSWORD || 'dev_password_2020',
  database: process.env.DB_NAME || 'inventory_db',
  entities: [__dirname + '/entities/*.ts'],
  synchronize: false,
  migrations: [__dirname + '/migrations/*.ts'],
  migrationsRun: true,
}).then(() => {
  console.log('Database connected');
  
  // #start-reorder-checker-cron
  ReorderChecker.start();
  
  const PORT = process.env.PORT || 3004;
  app.listen(PORT, () => {
    console.log(`Inventory Service started on port ${PORT}`);
  });
});
