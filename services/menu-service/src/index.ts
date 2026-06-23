// services/menu-service/src/index.ts
// #menu-service #entry-point #typeorm #postgresql

import "reflect-metadata";
import express from 'express';
import { createConnection } from 'typeorm';
import { databaseConfig } from './config/database';
import { categoriesRouter } from './routes/categories.routes';
import { itemsRouter } from './routes/items.routes';
import { searchRouter } from './routes/search.routes';
import { cafeContext } from './middleware/cafeContext';

const app = express();

app.use(express.json());
app.use(cafeContext);

// #routes
app.use('/api/categories', categoriesRouter);
app.use('/api/items', itemsRouter);
app.use('/api/search', searchRouter);

// #health-check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'menu-service' });
});

// #database-connection
createConnection(databaseConfig)
  .then(() => {
    console.log('PostgreSQL connected');
    const PORT = process.env.PORT || 3002;
    app.listen(PORT, () => {
      console.log(`Menu Service started on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

export default app;
