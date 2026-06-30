import crypto from 'node:crypto';
import { prisma } from '../utils/prisma.js';
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
      staffId: staffId ?? null,
      startTime,
      isAvailable: true,
    },
  });

  if (!slot) {
    return { success: false, reason: slot === null ? 'not_found' : 'not_available' };
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

const RELEASE_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`;

export async function releaseSlot(
  tenantId: string,
  staffId: string | null,
  startTime: string,
  token: string,
): Promise<boolean> {
  const key = lockKey(tenantId, staffId, startTime);
  const result = await redis.eval(RELEASE_SCRIPT, 1, key, token);
  return result === 1;
}
