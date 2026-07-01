'use client';

import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CANCELLED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  NO_SHOW: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  Active: 'bg-emerald-100 text-emerald-700',
  Inactive: 'bg-gray-100 text-gray-500',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusStyles[status] ?? 'bg-gray-100 text-gray-600')}>
      {status}
    </span>
  );
}
