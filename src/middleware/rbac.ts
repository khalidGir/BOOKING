import type { Request, Response, NextFunction } from 'express';
import { getTenantContext } from './tenant-context.js';

export function requireRoles(...allowedRoles: string[]) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const ctx = getTenantContext();

    if (!ctx.role) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(ctx.role)) {
      res.status(403).json({ error: 'Forbidden: insufficient permissions' });
      return;
    }

    next();
  };
}
