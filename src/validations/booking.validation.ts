import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').max(50),
  notes: z.string().max(2000).optional(),
});

const isoDateString = z.string().regex(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
  'startTime must be an ISO 8601 string',
);

export const reserveSlotSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID'),
  staffId: z.string().uuid().optional().nullable(),
  startTime: isoDateString,
});

export const confirmBookingSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID'),
  staffId: z.string().uuid().optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
  startTime: isoDateString,
  reservationToken: z.string().uuid('Invalid reservation token'),
  duration: z.number().int().positive('Duration must be a positive integer'),
  price: z.number().min(0, 'Price cannot be negative').default(0),
  customFieldAnswers: z.any().optional().nullable(),
  customer: customerSchema,
});

export const publicSlotsQuerySchema = z.object({
  serviceId: z.string().uuid('Invalid service ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  staffId: z.string().uuid().optional(),
});

export type ReserveSlotInput = z.infer<typeof reserveSlotSchema>;
export type ConfirmBookingInput = z.infer<typeof confirmBookingSchema>;
export type PublicSlotsQuery = z.infer<typeof publicSlotsQuerySchema>;
