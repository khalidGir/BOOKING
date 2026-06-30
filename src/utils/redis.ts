import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

function createRedisClient(): Redis {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 10) return null;
      return Math.min(times * 200, 5000);
    },
    enableReadyCheck: true,
    lazyConnect: false,
  });

  client.on('error', (err) => {
    console.error('[redis] connection error:', err.message);
  });

  client.on('ready', () => {
    console.log('[redis] connected');
  });

  return client;
}

export const redis = createRedisClient();

const LOCK_PREFIX = 'lock:slot';

export function lockKey(businessId: string, staffId: string | null, startTimeISO: string): string {
  const staffPart = staffId ?? 'generic';
  return `${LOCK_PREFIX}:${businessId}:${staffPart}:${startTimeISO}`;
}

export const SLOT_LOCK_TTL_SECONDS = 300;
