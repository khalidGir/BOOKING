import { prisma } from '../utils/prisma.js';
import { generateSlotsForDate } from './slot-cache.js';

export function getDateRangeFromBooking(startTime: Date): Date[] {
  const day = new Date(startTime);
  day.setUTCHours(0, 0, 0, 0);
  return [day];
}

export function getDateRangeFromBookingSpan(startTime: Date, endTime: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(startTime);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(endTime);
  end.setUTCHours(0, 0, 0, 0);

  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export async function invalidateOnBookingChange(
  businessId: string,
  bookingStartTime: Date,
): Promise<void> {
  const days = getDateRangeFromBooking(bookingStartTime);
  await rebuildDays(businessId, days);
}

export async function invalidateOnStaffAvailabilityChange(
  businessId: string,
  date?: Date,
): Promise<void> {
  const days = date
    ? getDateRangeFromBooking(date)
    : generateNextNDays(60);

  await rebuildDays(businessId, days);
}

export async function invalidateOnBusinessHoursChange(
  businessId: string,
): Promise<void> {
  const days = generateNextNDays(60);
  await rebuildDays(businessId, days);
}

export async function invalidateOnStaffOverrideChange(
  businessId: string,
  overrideDate: Date,
): Promise<void> {
  const days = getDateRangeFromBooking(overrideDate);
  await rebuildDays(businessId, days);
}

async function rebuildDays(businessId: string, days: Date[]): Promise<void> {
  const by = prisma.$withBypass();
  const sorted = [...days].sort((a, b) => a.getTime() - b.getTime());

  for (const day of sorted) {
    const dayStart = new Date(day);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setUTCHours(23, 59, 59, 999);

    await by.slotCache.deleteMany({
      where: {
        businessId,
        startTime: { gte: dayStart, lte: dayEnd },
        isAvailable: true,
      },
    });

    await generateSlotsForDate(businessId, day);
  }
}

export async function rebuildAllFuture(businessId: string): Promise<number> {
  const days = generateNextNDays(60);
  let total = 0;
  for (const day of days) {
    total += await generateSlotsForDate(businessId, day);
  }
  return total;
}

export function generateNextNDays(n: number): Date[] {
  const days: Date[] = [];
  const now = new Date();

  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() + i);
    d.setUTCHours(0, 0, 0, 0);
    days.push(d);
  }

  return days;
}
