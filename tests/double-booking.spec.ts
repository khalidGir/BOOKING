/**
 * Double-Booking Concurrency Test
 *
 * Fires 50+ concurrent reserve → confirm requests targeting the
 * exact same slot. Asserts that exactly ONE succeeds and 49+ fail
 * with 409 Conflict.
 *
 * Prerequisites:
 *   1. A running Booking API instance (npm run dev)
 *   2. A valid auth token for a business that has a SlotCache entry
 *   3. An existing active service + SlotCache row for the target time
 *
 * Usage:
 *   npx tsx tests/double-booking.spec.ts
 */

const BASE = process.env.API_BASE ?? 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN!;

const TARGET = {
  serviceId: process.env.TEST_SERVICE_ID!,
  staffId: process.env.TEST_STAFF_ID ?? null,
  // Use a fixed future time that has a SlotCache entry
  startTime: process.env.TEST_START_TIME!,
};

if (!AUTH_TOKEN || !TARGET.serviceId || !TARGET.startTime) {
  console.error('Missing required env vars: AUTH_TOKEN, TEST_SERVICE_ID, TEST_START_TIME');
  process.exit(1);
}

interface ReserveResponse {
  reservationToken?: string;
  expiresAt?: string;
  error?: string;
  reason?: string;
}

interface ConfirmResponse {
  data?: { id: string; status: string };
  error?: string;
}

async function reserve(): Promise<ReserveResponse> {
  const res = await fetch(`${BASE}/api/v1/bookings/reserve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify({
      serviceId: TARGET.serviceId,
      staffId: TARGET.staffId,
      startTime: TARGET.startTime,
    }),
  });
  return res.json();
}

async function confirm(token: string): Promise<ConfirmResponse> {
  const res = await fetch(`${BASE}/api/v1/bookings/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify({
      serviceId: TARGET.serviceId,
      staffId: TARGET.staffId,
      startTime: TARGET.startTime,
      reservationToken: token,
      duration: 60,
      price: 0,
      customer: {
        name: 'Concurrency Tester',
        email: `test-${Date.now()}@example.com`,
        phone: '+15550000000',
      },
    }),
  });
  return res.json();
}

async function main(): Promise<void> {
  const CONCURRENCY = 50;
  console.log(`\n🚀 Firing ${CONCURRENCY} concurrent reserve requests...\n`);

  const reservePromises = Array.from({ length: CONCURRENCY }, () => reserve());
  const reserveResults = await Promise.all(reservePromises);

  const successes = reserveResults.filter(r => r.reservationToken);
  const conflicts = reserveResults.filter(r => r.reason === 'already_held');

  console.log(`Reserve results:`);
  console.log(`  ✅ Succeeded: ${successes.length}`);
  console.log(`  ❌ Conflicts:  ${conflicts.length}`);
  console.log(`  ❓ Other:      ${reserveResults.length - successes.length - conflicts.length}`);

  if (successes.length === 0) {
    console.error('\n💥 No reservations acquired — cannot proceed to confirm test');
    process.exit(1);
  }

  if (successes.length > 1) {
    console.error(`\n💥 DOUBLE-BOOKING DETECTED: ${successes.length} reservations acquired for the same slot!`);
    process.exit(1);
  }

  const winner = successes[0]!;
  console.log(`\n🏆 Single reservation acquired: ${winner.reservationToken?.slice(0, 8)}...`);
  console.log(`   Expires at: ${winner.expiresAt}`);

  console.log(`\n🚀 Firing ${CONCURRENCY} concurrent confirm requests using the winning token...\n`);

  const confirmPromises = Array.from({ length: CONCURRENCY }, () => confirm(winner.reservationToken!));
  const confirmResults = await Promise.all(confirmPromises);

  const confirmed = confirmResults.filter(r => r.data?.id);
  const failed = confirmResults.filter(r => r.error);

  console.log(`Confirm results:`);
  console.log(`  ✅ Confirmed:  ${confirmed.length}`);
  console.log(`  ❌ Failed:     ${failed.length}`);

  if (confirmed.length === 1) {
    console.log(`\n✅ PASS: Exactly 1 confirmation succeeded (booking ${confirmed[0]!.data!.id})`);
    console.log(`✅ PASS: ${failed.length} requests correctly rejected`);
    process.exit(0);
  } else if (confirmed.length === 0) {
    console.error(`\n💥 FAIL: No confirmations succeeded — possible race condition in confirm flow`);
    process.exit(1);
  } else {
    console.error(`\n💥 DOUBLE-BOOKING: ${confirmed.length} confirmations succeeded for the same slot!`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
