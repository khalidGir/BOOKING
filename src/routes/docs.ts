import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import swaggerUi from 'swagger-ui-express';

const specPath = path.resolve(process.cwd(), 'src', 'docs', 'openapi.yaml');
const specRaw = fs.readFileSync(specPath, 'utf-8');
const spec = yaml.parse(specRaw);

const router = Router();

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(spec, {
  customSiteTitle: 'Booking API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    tryItOutEnabled: true,
  },
}));

export { router as docsRouter };
