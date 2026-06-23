// services/menu-service/src/middleware/cafeContext.ts
// #multi-tenant-isolation #cafe-context

import { Request, Response, NextFunction } from 'express';

export const cafeContext = (req: Request, res: Response, next: NextFunction) => {
  const cafeId = req.headers['x-cafe-id'];
  
  if (!cafeId) {
    return res.status(400).json({ error: 'Cafe ID is required' });
  }

  // #validate-cafe-id-format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(cafeId as string)) {
    return res.status(400).json({ error: 'Invalid Cafe ID format' });
  }

  next();
};
