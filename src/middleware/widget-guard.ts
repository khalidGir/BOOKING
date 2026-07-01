import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';

export function widgetGuard(slugParam: string = 'slug') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = String(req.params[slugParam] ?? '');

      const business = await prisma.$withBypass().business.findUnique({
        where: { slug },
        select: { corsWhitelist: true },
      });

      if (!business) {
        next();
        return;
      }

      const whitelist = Array.isArray(business.corsWhitelist) ? business.corsWhitelist as string[] : [];

      if (whitelist.length === 0) {
        next();
        return;
      }

      const origin = req.headers['origin'] as string | undefined;
      const referer = req.headers['referer'] as string | undefined;
      const requestDomain = extractDomain(origin) ?? extractDomain(referer);

      if (requestDomain) {
        const isAllowed = whitelist.some(allowed => {
          return requestDomain === allowed || requestDomain.endsWith('.' + allowed);
        });

        if (!isAllowed) {
          res.setHeader('X-Frame-Options', 'DENY');
          res.status(403).json({ error: 'Domain not authorised for embedding' });
          return;
        }
      }

      const allowedAncestors = ["'self'", ...whitelist].join(' ');
      res.setHeader('Content-Security-Policy', `frame-ancestors ${allowedAncestors}`);
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');

      next();
    } catch (error) {
      console.error('[widget-guard]', error);
      next();
    }
  };
}

function extractDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}
