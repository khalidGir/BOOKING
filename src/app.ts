import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { authMiddleware } from './middleware/auth.js';
import { tenantContextMiddleware } from './middleware/tenant-context.js';
import { servicesRouter } from './routes/services.js';
import { bookingsRouter } from './routes/bookings.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';
import { embedRouter } from './routes/embed.js';
import { docsRouter } from './routes/docs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', '..', 'public');

const app = express();

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use('/widget.js', express.static(path.join(publicDir, 'widget.js'), {
  maxAge: '1h',
  setHeaders: (res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
  },
}));

app.use('/public', express.static(publicDir, {
  maxAge: '1h',
}));

app.use('/docs', docsRouter);
app.use('/embed', embedRouter);
app.use('/api/v1/public', publicRouter);

app.use(authMiddleware);
app.use(tenantContextMiddleware);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/services', servicesRouter);
app.use('/api/v1/bookings', bookingsRouter);
app.use('/api/v1/admin', adminRouter);

export { app };
