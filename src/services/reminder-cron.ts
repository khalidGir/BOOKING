import { prisma } from '../utils/prisma.js';
import { sendReminder } from './notification.js';

export async function runReminderCheck(): Promise<number> {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const bookings = await prisma.$withBypass().booking.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      startTime: { gte: now, lte: in24Hours },
    },
    select: {
      id: true,
      businessId: true,
      customerEmail: true,
      customerPhone: true,
      startTime: true,
      business: { select: { reminderTiming: true, timezone: true } },
      notificationLogs: {
        where: { type: 'REMINDER' },
        select: { id: true, sentAt: true, type: true },
      },
    },
  });

  let sent = 0;

  for (const booking of bookings) {
    const reminderTiming = (booking.business.reminderTiming as number[]) ?? [1440, 60];
    const alreadySentMinutes = new Set<number>();

    for (const log of booking.notificationLogs) {
      if (log.type === 'REMINDER') {
        const diffMs = booking.startTime.getTime() - log.sentAt.getTime();
        const diffMin = Math.round(diffMs / 60000);
        alreadySentMinutes.add(diffMin);
      }
    }

    const diffMs = booking.startTime.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60000);

    for (const timing of reminderTiming) {
      const windowStart = timing - 5;
      const windowEnd = timing + 5;

      if (diffMin >= windowStart && diffMin <= windowEnd && !alreadySentMinutes.has(timing)) {
        await sendReminder({
          businessId: booking.businessId,
          bookingId: booking.id,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
        });
        sent++;
      }
    }
  }

  return sent;
}
