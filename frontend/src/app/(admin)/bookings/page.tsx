'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { mockApi } from '@/lib/mock-api';
import { formatTime, formatDate, formatCurrency } from '@/lib/mock-data';
import type { Booking } from '@/lib/mock-data';
import { toast } from 'sonner';

const statusFilters = ['All', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED'] as const;

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('All');
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    mockApi.getBookings().then(b => { setBookings(b); setLoading(false); });
  }, []);

  async function handleCancel(id: string) {
    setCancelling(id);
    await mockApi.cancelBooking(id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' as const } : b));
    setCancelling(null);
    toast.success('Booking cancelled');
  }

  const filtered = bookings.filter(b => {
    const matchSearch = !search || b.customerName.toLowerCase().includes(search.toLowerCase()) || b.bookingRef.toLowerCase().includes(search);
    const matchStatus = filter === 'All' || b.status === filter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{bookings.length} total bookings</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <Input
              placeholder="Search by name or reference..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex gap-1">
              {statusFilters.map(s => (
                <Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm" onClick={() => setFilter(s)}>
                  {s === 'All' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <EmptyState icon="◈" title="No bookings found" description="Try adjusting your search or filters." />
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="divide-y">
                {filtered.map((b, i) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <AvatarInitials name={b.customerName} size="sm" />
                    <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm items-center">
                      <div className="col-span-2">
                        <p className="font-medium truncate">{b.customerName}</p>
                        <p className="text-xs text-muted-foreground truncate">{b.service.name}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-muted-foreground">{formatDate(b.startTime)}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(b.startTime)} — {formatTime(b.endTime)}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs text-muted-foreground">{b.duration} min</p>
                        <p className="text-xs font-medium">{formatCurrency(b.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <StatusBadge status={b.status} />
                        {b.status === 'CONFIRMED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-500 hover:text-rose-700 text-xs"
                            onClick={() => handleCancel(b.id)}
                            disabled={cancelling === b.id}
                          >
                            {cancelling === b.id ? '...' : 'Cancel'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
