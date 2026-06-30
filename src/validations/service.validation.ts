import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(255),
  description: z.string().max(2000).optional().nullable(),
  duration: z.number().int().positive('Duration must be a positive integer'),
  price: z.number().min(0, 'Price cannot be negative'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex code').optional(),
  bufferBefore: z.number().int().min(0, 'Buffer must be a non-negative integer').default(0),
  bufferAfter: z.number().int().min(0, 'Buffer must be a non-negative integer').default(0),
  maxPerSlot: z.number().int().min(1).default(1),
  categoryId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();

export const serviceIdParamSchema = z.object({
  id: z.string().uuid('Invalid service ID'),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
