'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { mockApi } from '@/lib/mock-api';
import type { StaffMember } from '@/lib/mock-data';
import { toast } from 'sonner';

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', bio: '', color: '#6366f1' });

  useEffect(() => { mockApi.getStaff().then(s => { setStaff(s); setLoading(false); }); }, []);

  const handleCreate = async () => {
    if (!form.name) return toast.error('Name is required');
    const m = await mockApi.createStaff({
      name: form.name, email: form.email || null, phone: form.phone || null, bio: form.bio || null, color: form.color,
    });
    setStaff(prev => [m, ...prev]);
    setShowForm(false);
    setForm({ name: '', email: '', phone: '', bio: '', color: '#6366f1' });
    toast.success('Staff member added');
  };

  const handleToggle = async (id: string) => {
    const updated = await mockApi.toggleStaff(id);
    setStaff(prev => prev.map(s => s.id === id ? updated : s));
    toast.success(updated.isActive ? 'Staff activated' : 'Staff deactivated');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>;

  return (
    <div>
      <PageHeader title="Staff" description={`${staff.filter(s => s.isActive).length} active · ${staff.length} total`}
        action={<Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Staff'}</Button>}
      />

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Bio</Label><Input value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Color</Label><input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-10 w-full rounded-md border px-2" /></div>
                </div>
                <Button className="mt-4" onClick={handleCreate}>Add Staff Member</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-3">
        {staff.length === 0 ? (
          <EmptyState icon="◉" title="No staff yet" description="Add your team members to start accepting bookings." action={<Button onClick={() => setShowForm(true)}>Add Staff</Button>} />
        ) : staff.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className={!s.isActive ? 'opacity-50' : ''}>
              <CardContent className="flex items-center gap-4 py-4">
                <AvatarInitials name={s.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{s.name}</p>
                    {s.email && <span className="text-xs text-muted-foreground">{s.email}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{s.bio}</p>
                  <div className="flex gap-1 mt-1">
                    {s.services.map(srv => (
                      <Badge key={srv.service.id} variant="secondary" className="text-xs">{srv.service.name}</Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">{s._count.bookings} bookings</p>
                </div>
                <StatusBadge status={s.isActive ? 'Active' : 'Inactive'} />
                <Button variant="outline" size="sm" onClick={() => handleToggle(s.id)}>{s.isActive ? 'Deactivate' : 'Activate'}</Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
