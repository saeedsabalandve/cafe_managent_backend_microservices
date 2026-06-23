// services/api-gateway/src/index.ts
// #api-gateway #entry-point #express-server #2020
// Main entry point - Express server bootstrap with middleware chain

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { authMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { config } from './config';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// #middleware-chain
app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// #health-check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// #public-routes
app.use('/api/auth', createProxyMiddleware({
  target: config.serviceUrls.auth,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/api' }
}));

// #protected-routes
app.use('/api/*', authMiddleware, rateLimiter);

app.use('/api/menu', createProxyMiddleware({
  target: config.serviceUrls.menu,
  changeOrigin: true,
  pathRewrite: { '^/api/menu': '/api' }
}));

app.use('/api/orders', createProxyMiddleware({
  target: config.serviceUrls.order,
  changeOrigin: true,
  pathRewrite: { '^/api/orders': '/api/orders' }
}));

app.use('/api/inventory', createProxyMiddleware({
  target: config.serviceUrls.inventory,
  changeOrigin: true,
  pathRewrite: { '^/api/inventory': '/api' }
}));

// #analytics-admin-only
app.use('/api/analytics', authMiddleware, (req, res, next) => {
  if ((req as any).user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}, createProxyMiddleware({
  target: config.serviceUrls.analytics,
  changeOrigin: true,
  pathRewrite: { '^/api/analytics': '/api' }
}));

// #error-handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = config.port || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway started on port ${PORT}`);
});

export default app;
