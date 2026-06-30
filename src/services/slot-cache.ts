import { prisma } from '../utils/prisma.js';

interface WorkingPeriod {
  startMin: number;
  endMin: number;
}

interface OccupiedWindow {
  startMin: number;
  endMin: number;
}

function toMin(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function isSlotAvailable(
  cursorMin: number,
  duration: number,
  bufferAfter: number,
  period: WorkingPeriod,
  occupied: OccupiedWindow[],
): boolean {
  const slotEnd = cursorMin + duration;

  if (slotEnd + bufferAfter > period.endMin) return false;

  for (const occ of occupied) {
    if (cursorMin < occ.endMin && slotEnd > occ.startMin) return false;
  }

  return true;
}

function ceilToNearest(minutes: number, step: number): number {
  return Math.ceil(minutes / step) * step;
}

export async function generateSlotsForDate(
  businessId: string,
  date: Date,
): Promise<number> {
  const dayOfWeek = date.getUTCDay();

  const business = await prisma.$withBypass().business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      timezone: true,
      defaultAvailability: true,
    },
  });

  if (!business) return 0;

  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
  const avail = business.defaultAvailability as any;
  const bizPeriods: WorkingPeriod[] = [];

  if (avail?.[dayName]) {
    for (const slot of avail[dayName]) {
      bizPeriods.push({
        startMin: timeStrToMin(slot.start),
        endMin: timeStrToMin(slot.end),
      });
    }
  }

  if (bizPeriods.length === 0) return 0;

  const services = await prisma.$withBypass().service.findMany({
    where: { businessId, isActive: true },
    select: { id: true, duration: true, bufferBefore: true, bufferAfter: true },
  });

  if (services.length === 0) return 0;

  const staffMembers = await prisma.$withBypass().staff.findMany({
    where: { businessId, isActive: true },
    select: {
      id: true,
      name: true,
      bufferBefore: true,
      bufferAfter: true,
      availabilities: {
        where: { isActive: true, dayOfWeek },
        select: { startTime: true, endTime: true },
      },
      overrides: {
        where: { date: { gte: date, lt: new Date(date.getTime() + 86400000) } },
        select: { startTime: true, endTime: true },
      },
      services: { select: { serviceId: true } },
    },
  });

  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setUTCHours(23, 59, 59, 999);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(0, 0, 0, 0);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  const existingBookings = await prisma.$withBypass().booking.findMany({
    where: {
      businessId,
      startTime: { gte: dayStart, lt: endOfDay },
      status: { notIn: ['CANCELLED'] },
    },
    select: { startTime: true, endTime: true, staffId: true, serviceId: true },
  });

  const todayUTC = new Date();
  const nowMin = todayUTC.getUTCHours() * 60 + todayUTC.getUTCMinutes();
  const isToday = date.toDateString() === todayUTC.toDateString();

  const slotsToCreate: Array<{
    businessId: string;
    serviceId: string;
    staffId: string | null;
    startTime: Date;
    endTime: Date;
    isAvailable: boolean;
    expiresAt: Date;
  }> = [];

  for (const service of services) {
    const sb = service.bufferBefore;
    const sa = service.bufferAfter;

    for (const staff of staffMembers) {
      const staffServiceIds = staff.services.map(s => s.serviceId);
      if (staffServiceIds.length > 0 && !staffServiceIds.includes(service.id)) continue;

      const staffB = staff.bufferBefore || sb;
      const staffA = staff.bufferAfter || sa;

      const staffAvail = staff.availabilities[0];
      let periods: WorkingPeriod[];

      if (staffAvail) {
        const sMin = toMin(staffAvail.startTime);
        const eMin = toMin(staffAvail.endTime);
        periods = intersectPeriods(bizPeriods, [{ startMin: sMin, endMin: eMin }]);
      } else {
        periods = bizPeriods;
      }

      const override = staff.overrides[0];
      if (override) {
        if (!override.startTime && !override.endTime) {
          continue;
        }
        const ovStart = override.startTime ? toMin(override.startTime) : 0;
        const ovEnd = override.endTime ? toMin(override.endTime) : 1440;
        periods = intersectPeriods(periods, [{ startMin: ovStart, endMin: ovEnd }]);
      }

      const occupied: OccupiedWindow[] = [];
      for (const bk of existingBookings) {
        if (bk.staffId !== staff.id) continue;
        const bStart = toMin(bk.startTime);
        const bEnd = toMin(bk.endTime);
        occupied.push({ startMin: bStart, endMin: bEnd });
      }

      for (const period of periods) {
        const effectiveStart = Math.max(period.startMin + staffB, isToday ? ceilToNearest(nowMin, 15) : period.startMin);
        let cursor = ceilToNearest(effectiveStart, 15);

        while (cursor + service.duration <= period.endMin) {
          const startsAfterBuffer = cursor >= period.startMin + staffB;
          if (startsAfterBuffer && isSlotAvailable(cursor, service.duration, staffA, period, occupied)) {
            const slotStart = new Date(date);
            slotStart.setUTCHours(Math.floor(cursor / 60), cursor % 60, 0, 0);
            const slotEnd = new Date(slotStart.getTime() + service.duration * 60000);
            const expiresAt = new Date(date);
            expiresAt.setUTCDate(expiresAt.getUTCDate() + 1);

            slotsToCreate.push({
              businessId,
              serviceId: service.id,
              staffId: staff.id,
              startTime: slotStart,
              endTime: slotEnd,
              isAvailable: true,
              expiresAt,
            });
          }
          cursor += 15;
        }
      }
    }
  }

  if (slotsToCreate.length === 0) return 0;

  const by = prisma.$withBypass();
  await by.slotCache.deleteMany({
    where: {
      businessId,
      startTime: { gte: dayStart, lt: endOfDay },
    },
  });

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < slotsToCreate.length; i += BATCH) {
    const batch = slotsToCreate.slice(i, i + BATCH);
    await by.slotCache.createMany({ data: batch });
    inserted += batch.length;
  }

  return inserted;
}

function timeStrToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

function intersectPeriods(a: WorkingPeriod[], b: WorkingPeriod[]): WorkingPeriod[] {
  const result: WorkingPeriod[] = [];
  for (const pa of a) {
    for (const pb of b) {
      const start = Math.max(pa.startMin, pb.startMin);
      const end = Math.min(pa.endMin, pb.endMin);
      if (start < end) result.push({ startMin: start, endMin: end });
    }
  }
  return result;
}
