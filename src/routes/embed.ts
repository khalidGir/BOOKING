import { Router } from 'express';
import { serveEmbedPage } from '../controllers/embed.controller.js';
import { widgetGuard } from '../middleware/widget-guard.js';

const router = Router();

router.get('/:slug', widgetGuard('slug'), serveEmbedPage);

export { router as embedRouter };
