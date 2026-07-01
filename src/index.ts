import { app } from './app.js';
import { runDailyCacheBuild } from './services/scheduler.js';
import { runReminderCheck } from './services/reminder-cron.js';
import cron from 'node-cron';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

app.listen(PORT, () => {
  console.log(`Booking API running on http://localhost:${PORT}`);
});

cron.schedule('0 3 * * *', async () => {
  console.log('[cron] daily slot cache rebuild');
  await runDailyCacheBuild();
});

cron.schedule('*/5 * * * *', async () => {
  const sent = await runReminderCheck();
  if (sent > 0) console.log(`[cron] sent ${sent} reminders`);
});

const today = new Date();
const runHour = parseInt(process.env.CACHE_BUILD_HOUR ?? '3', 10);
if (today.getUTCHours() < runHour) {
  runDailyCacheBuild().catch(err => console.error('[cron] initial build failed:', err));
}
