'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Separator } from '@/components/ui/separator';
import { mockApi } from '@/lib/mock-api';
import { formatCurrency } from '@/lib/mock-data';
import type { Service } from '@/lib/mock-data';
import { toast } from 'sonner';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', duration: '60', price: '0', color: '#6366f1', bufferBefore: '0', bufferAfter: '0' });

  useEffect(() => { mockApi.getServices().then(s => { setServices(s); setLoading(false); }); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.duration || !form.price) return toast.error('Name, duration and price are required');
    const svc = await mockApi.createService({
      name: form.name, description: form.description || null, duration: parseInt(form.duration), price: form.price,
      color: form.color, bufferBefore: parseInt(form.bufferBefore), bufferAfter: parseInt(form.bufferAfter),
    });
    setServices(prev => [svc, ...prev]);
    setShowForm(false);
    setForm({ name: '', description: '', duration: '60', price: '0', color: '#6366f1', bufferBefore: '0', bufferAfter: '0' });
    toast.success('Service created');
  };

  const handleToggle = async (id: string) => {
    const updated = await mockApi.toggleService(id);
    setServices(prev => prev.map(s => s.id === id ? updated : s));
    toast.success(updated.isActive ? 'Service activated' : 'Service deactivated');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>;

  return (
    <div>
      <PageHeader title="Services" description={`${services.filter(s => s.isActive).length} active of ${services.length} total`}
        action={<Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Service'}</Button>}
      />

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Duration (min)</Label><Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Price ($)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Buffer Before</Label><Input type="number" value={form.bufferBefore} onChange={e => setForm(f => ({ ...f, bufferBefore: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Buffer After</Label><Input type="number" value={form.bufferAfter} onChange={e => setForm(f => ({ ...f, bufferAfter: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Color</Label><input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-10 w-full rounded-md border px-2" /></div>
                  <div className="md:col-span-3 space-y-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                </div>
                <Button className="mt-4" onClick={handleCreate}>Create Service</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-3">
        {services.length === 0 ? (
          <EmptyState icon="◎" title="No services yet" description="Add your first service to get started." action={<Button onClick={() => setShowForm(true)}>Add Service</Button>} />
        ) : services.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className={!s.isActive ? 'opacity-50' : ''}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{s.name}</p>
                    <Badge variant="outline" className="text-xs">{s.category?.name ?? 'Uncategorized'}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{s.duration} min</p>
                  <p className="text-muted-foreground">{formatCurrency(s.price)}</p>
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
