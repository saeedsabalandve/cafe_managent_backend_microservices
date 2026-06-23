// services/api-gateway/src/middleware/auth.ts
// #authentication #jwt-verification #rs256 #user-context

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// #express-type-extension
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        cafeId: string;
      };
      correlationId?: string;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required', code: 'MISSING_TOKEN' });
    }

    const token = authHeader.split(' ')[1];

    // #rs256-verification
    const decoded = jwt.verify(token, config.jwtPublicKey, {
      algorithms: ['RS256'],
      issuer: 'cafe-management-auth',
      maxAge: '15m'
    }) as any;

    // #user-context-attachment
    req.user = {
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      cafeId: decoded.cafe_id,
    };

    // #correlation-id-propagation
    if (!req.headers['x-correlation-id']) {
      req.headers['x-correlation-id'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    req.correlationId = req.headers['x-correlation-id'] as string;

    // #downstream-headers
    req.headers['x-user-id'] = decoded.sub;
    req.headers['x-cafe-id'] = decoded.cafe_id;
    req.headers['x-user-role'] = decoded.role;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// #rbac-factory
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
