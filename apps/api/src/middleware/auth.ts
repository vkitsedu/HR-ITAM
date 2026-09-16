import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { RoleEnum } from '@empops/shared';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: RoleEnum;
  tenantId: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tenantId?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'empops_jwt_secret_dev_key_2026_enterprise_grade_key';

export function authenticateJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = payload;
    req.tenantId = payload.tenantId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token is invalid or expired' });
  }
}

export function requireRoles(...allowedRoles: RoleEnum[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: requires one of [${allowedRoles.join(', ')}], current role is ${req.user.role}`,
      });
    }
    next();
  };
}
