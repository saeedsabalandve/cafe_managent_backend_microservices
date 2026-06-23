// services/api-gateway/src/utils/responseFormatter.ts
// #response-envelope #standardized-format

import { Request, Response, NextFunction } from 'express';

export const responseFormatter = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);

  // #envelope-wrapper
  res.json = function(body: any) {
    if (body && body.error) {
      return originalJson({
        success: false,
        error: body.error,
        code: body.code || 'ERROR',
        correlationId: req.headers['x-correlation-id'] || null,
        timestamp: new Date().toISOString()
      });
    }

    // #pagination-detection
    if (body && body.data && body.pagination) {
      return originalJson({
        success: true,
        data: body.data,
        pagination: body.pagination,
        timestamp: new Date().toISOString()
      });
    }

    return originalJson({
      success: true,
      data: body,
      timestamp: new Date().toISOString()
    });
  };

  next();
};
