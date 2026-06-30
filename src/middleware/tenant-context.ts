import { AsyncLocalStorage } from 'node:async_hooks';
import type { Request, Response, NextFunction } from 'express';
import type { TenantContext } from '../types/context.js';

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function tenantContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const tenantId = (req as any).tenantId ?? null;
  const userId = (req as any).userId ?? null;
  const role = (req as any).role ?? null;

  tenantStorage.run({ tenantId, userId, role }, () => next());
}

export function getTenantContext(): TenantContext {
  const ctx = tenantStorage.getStore();
  if (!ctx) {
    return { tenantId: null, userId: null, role: null };
  }
  return ctx;
}
