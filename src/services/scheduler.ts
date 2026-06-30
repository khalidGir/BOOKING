import { prisma } from '../utils/prisma.js';
import { generateSlotsForDate } from './slot-cache.js';
import { generateNextNDays } from './slot-cache-invalidator.js';

export async function runDailyCacheBuild(): Promise<void> {
  const businesses = await prisma.$withBypass().business.findMany({
    where: { status: 'Active' },
    select: { id: true },
  });

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  const farDays = generateNextNDays(60);
  let total = 0;

  for (const biz of businesses) {
    for (const day of farDays) {
      total += await generateSlotsForDate(biz.id, day);
    }
  }

  console.log(`[scheduler] generated ${total} slots across ${businesses.length} businesses for next 60 days`);
}
