import { prisma } from '../utils/prisma.js';

type NotificationType = 'CONFIRMATION' | 'REMINDER' | 'CANCELLATION' | 'RESCHEDULE';
type NotificationChannel = 'EMAIL' | 'SMS';

interface NotifyParams {
  businessId: string;
  bookingId: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
}

export async function logNotification(params: NotifyParams): Promise<void> {
  try {
    await prisma.$withBypass().notificationLog.create({
      data: {
        businessId: params.businessId,
        bookingId: params.bookingId,
        type: params.type,
        channel: params.channel,
        recipient: params.recipient,
        status: 'Sent',
      },
    });
  } catch (error) {
    console.error('[notification:log-error]', error);
  }
}

export async function sendConfirmation(params: {
  businessId: string;
  bookingId: string;
  customerEmail: string;
  customerPhone: string;
}): Promise<void> {
  const emailSent = await dispatchEmail(params.customerEmail, 'booking_confirmation', { bookingId: params.bookingId });
  if (emailSent) {
    await logNotification({ ...params, type: 'CONFIRMATION', channel: 'EMAIL', recipient: params.customerEmail });
  }

  const smsSent = await dispatchSms(params.customerPhone, 'booking_confirmation', { bookingId: params.bookingId });
  if (smsSent) {
    await logNotification({ ...params, type: 'CONFIRMATION', channel: 'SMS', recipient: params.customerPhone });
  }
}

export async function sendCancellation(params: {
  businessId: string;
  bookingId: string;
  customerEmail: string;
  customerPhone: string;
}): Promise<void> {
  const emailSent = await dispatchEmail(params.customerEmail, 'booking_cancellation', { bookingId: params.bookingId });
  if (emailSent) {
    await logNotification({ ...params, type: 'CANCELLATION', channel: 'EMAIL', recipient: params.customerEmail });
  }
}

export async function sendReminder(params: {
  businessId: string;
  bookingId: string;
  customerEmail: string;
  customerPhone: string;
}): Promise<void> {
  const emailSent = await dispatchEmail(params.customerEmail, 'booking_reminder', { bookingId: params.bookingId });
  if (emailSent) {
    await logNotification({ ...params, type: 'REMINDER', channel: 'EMAIL', recipient: params.customerEmail });
  }
}

async function dispatchEmail(to: string, template: string, data: Record<string, unknown>): Promise<boolean> {
  try {
    console.log(`[email] sending ${template} to ${to}:`, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`[email] failed to send ${template} to ${to}:`, error);
    return false;
  }
}

async function dispatchSms(to: string, template: string, data: Record<string, unknown>): Promise<boolean> {
  try {
    console.log(`[sms] sending ${template} to ${to}:`, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`[sms] failed to send ${template} to ${to}:`, error);
    return false;
  }
}
