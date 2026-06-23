// services/api-gateway/src/middleware/requestLogger.ts
// #logging #structured-logging #correlation-id

import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // #response-interceptor
  const originalSend = res.json.bind(res);
  res.json = function(body: any) {
    (res as any).responseBody = body;
    return originalSend(body);
  };

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      correlationId: req.headers['x-correlation-id'] || 'N/A',
      userAgent: req.headers['user-agent']?.substring(0, 100),
      ip: req.ip,
    };

    if (res.statusCode >= 400) {
      console.error(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  });

  next();
};
