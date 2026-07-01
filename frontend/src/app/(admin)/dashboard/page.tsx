'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { mockApi } from '@/lib/mock-api';
import { formatTime, formatCurrency } from '@/lib/mock-data';
import type { Booking } from '@/lib/mock-data';

function StatCard({ label, value, icon, delay }: { label: string; value: string | number; icon: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <span className="text-lg opacity-50">{icon}</span>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RecentBookingRow({ b, i }: { b: Booking; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + i * 0.05 }}
      className="flex items-center gap-3 py-3 border-b last:border-0"
    >
      <AvatarInitials name={b.customerName} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{b.customerName}</p>
        <p className="text-xs text-muted-foreground truncate">{b.service.name}</p>
      </div>
      <div className="text-right text-xs text-muted-foreground">{formatTime(b.startTime)}</div>
      <StatusBadge status={b.status} />
    </motion.div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<{
    todayBookings: number; activeServices: number; staffCount: number;
    totalBookings: number; revenue: string; upcomingBookings: Booking[];
  } | null>(null);

  useEffect(() => {
    mockApi.getDashboardStats().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Serenity Spa & Wellness — today&apos;s overview</p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Today's Bookings" value={data.todayBookings} icon="◈" delay={0.05} />
        <StatCard label="Active Services" value={data.activeServices} icon="◎" delay={0.1} />
        <StatCard label="Staff On" value={data.staffCount} icon="◉" delay={0.15} />
        <StatCard label="Total Bookings" value={data.totalBookings} icon="▣" delay={0.2} />
        <StatCard label="Revenue (MTD)" value={data.revenue} icon="$" delay={0.25} />
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6 pb-2">
              {data.upcomingBookings.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">No upcoming bookings</p>
              )}
              {data.upcomingBookings.map((b, i) => (
                <RecentBookingRow key={b.id} b={b} i={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
