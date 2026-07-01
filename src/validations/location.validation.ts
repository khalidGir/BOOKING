import { z } from 'zod';

export const createLocationSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  virtualLink: z.string().url().optional().nullable(),
  instructions: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  virtualLink: z.string().url().optional().nullable(),
  instructions: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
});

export const updateBusinessSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  timezone: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
  brandColor: z.string().optional(),
  defaultAvailability: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
  })).optional(),
  cancellationHours: z.coerce.number().int().min(0).optional(),
  reminderTiming: z.array(z.coerce.number().int().min(0)).optional(),
  corsWhitelist: z.array(z.string()).optional(),
});
