import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { authMiddleware } from './middleware/auth.js';
import { tenantContextMiddleware } from './middleware/tenant-context.js';
import { servicesRouter } from './routes/services.js';
import { bookingsRouter } from './routes/bookings.js';
import { publicRouter } from './routes/public.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use('/api/v1/public', publicRouter);

app.use(authMiddleware);
app.use(tenantContextMiddleware);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/services', servicesRouter);
app.use('/api/v1/bookings', bookingsRouter);

export { app };
