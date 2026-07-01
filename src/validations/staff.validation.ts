import { z } from 'zod';

export const createStaffSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  color: z.string().optional(),
  bio: z.string().optional().nullable(),
  bufferBefore: z.coerce.number().int().min(0).optional(),
  bufferAfter: z.coerce.number().int().min(0).optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
});

export const updateStaffSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  color: z.string().optional(),
  bio: z.string().optional().nullable(),
  bufferBefore: z.coerce.number().int().min(0).optional(),
  bufferAfter: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
});

export const createAvailabilitySchema = z.object({
  staffId: z.string().uuid(),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean().optional(),
});

export const updateAvailabilitySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  isActive: z.boolean().optional(),
});

export const createOverrideSchema = z.object({
  staffId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  reason: z.string().optional().nullable(),
});

export const updateOverrideSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  reason: z.string().optional().nullable(),
});
