import crypto from 'node:crypto';
import { prisma } from '../utils/prisma.js';
import { sendConfirmation } from './notification.js';
import { redis, lockKey, SLOT_LOCK_TTL_SECONDS } from '../utils/redis.js';

export interface ReserveSlotResult {
  success: true;
  reservationToken: string;
  expiresAt: string;
}

export interface ReserveSlotConflict {
  success: false;
  reason: 'already_held' | 'not_available' | 'not_found';
}

export async function reserveSlot(
  tenantId: string,
  serviceId: string,
  staffId: string | null,
  startTime: Date,
): Promise<ReserveSlotResult | ReserveSlotConflict> {
  const slot = await prisma.slotCache.findFirst({
    where: {
      businessId: tenantId,
      serviceId,
      staffId: staffId ?? undefined,
      startTime,
      isAvailable: true,
    },
  });

  if (!slot) {
    return { success: false, reason: 'not_found' };
  }

  const token = crypto.randomUUID();
  const key = lockKey(tenantId, staffId, startTime.toISOString());
  const acquired = await redis.set(key, token, 'EX', SLOT_LOCK_TTL_SECONDS, 'NX');

  if (acquired !== 'OK') {
    return { success: false, reason: 'already_held' };
  }

  const expiresAt = new Date(Date.now() + SLOT_LOCK_TTL_SECONDS * 1000).toISOString();

  return { success: true, reservationToken: token, expiresAt };
}

const VERIFY_SCRIPT = `return redis.call("GET", KEYS[1]) == ARGV[1]`;
const DELETE_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`;

export async function verifyReservation(
  tenantId: string,
  staffId: string | null,
  startTime: string,
  token: string,
): Promise<boolean> {
  const key = lockKey(tenantId, staffId, startTime);
  const result = await redis.eval(VERIFY_SCRIPT, 1, key, token);
  return result === 1;
}

export async function releaseSlot(
  tenantId: string,
  staffId: string | null,
  startTime: string,
  token: string,
): Promise<boolean> {
  const key = lockKey(tenantId, staffId, startTime);
  const result = await redis.eval(DELETE_SCRIPT, 1, key, token);
  return result === 1;
}

// ── Confirm: safe transaction with lock held ─────────────────────

export interface BookingConfirmation {
  bookingRef?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  startTime: Date;
  duration: number;
  price: number;
  serviceId: string;
  staffId: string | null;
  locationId?: string | null;
  customFieldAnswers?: Record<string, unknown>;
}

export async function confirmBooking(
  tenantId: string,
  reservationToken: string,
  data: BookingConfirmation,
): Promise<{ booking: any }> {
  const staffId = data.staffId;
  const startTimeISO = data.startTime.toISOString();

  const valid = await verifyReservation(tenantId, staffId, startTimeISO, reservationToken);
  if (!valid) {
    throw Object.assign(new Error('Reservation token expired or invalid'), { code: 'TOKEN_EXPIRED' });
  }

  const bookingRef = `BK-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
  const manageToken = crypto.randomUUID();

  const booking = await prisma.$withBypass().$transaction(async (tx) => {
    const slot = await tx.slotCache.findFirst({
      where: {
        businessId: tenantId,
        serviceId: data.serviceId,
        staffId: staffId ?? undefined,
        startTime: data.startTime,
      },
    });

    if (!slot || !slot.isAvailable) {
      throw Object.assign(new Error('Slot no longer available'), { code: 'SLOT_UNAVAILABLE' });
    }

    const created = await tx.booking.create({
      data: {
        businessId: tenantId,
        bookingRef,
        manageToken,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        notes: data.notes,
        startTime: data.startTime,
        endTime: new Date(data.startTime.getTime() + data.duration * 60000),
        duration: data.duration,
        price: data.price,
        serviceId: data.serviceId,
        staffId: staffId ?? undefined,
        locationId: data.locationId ?? undefined,
        customFieldAnswers: (data.customFieldAnswers ?? undefined) as any,
      },
    });

    await tx.slotCache.updateMany({
      where: {
        businessId: tenantId,
        serviceId: data.serviceId,
        staffId: staffId ?? undefined,
        startTime: data.startTime,
      },
      data: { isAvailable: false },
    });

    return created;
  });

  await releaseSlot(tenantId, staffId, startTimeISO, reservationToken);

  sendConfirmation({
    businessId: tenantId,
    bookingId: booking.id,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
  }).catch(err => console.error('[notification] async confirm failed:', err));

  return { booking };
}

export async function publicBookSlot(
  tenantId: string,
  data: BookingConfirmation,
): Promise<{ booking: any }> {
  const result = await reserveSlot(tenantId, data.serviceId, data.staffId, data.startTime);

  if (!result.success) {
    const messages: Record<string, string> = {
      already_held: 'This time slot is currently being booked by another customer',
      not_available: 'This time slot is no longer available',
      not_found: 'This time slot was not found',
    };
    throw Object.assign(new Error(messages[result.reason] || 'Slot is unavailable'), { code: 'SLOT_' + result.reason.toUpperCase() });
  }

  return confirmBooking(tenantId, result.reservationToken, data);
}
