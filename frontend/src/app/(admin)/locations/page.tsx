'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { mockApi } from '@/lib/mock-api';
import type { Location } from '@/lib/mock-data';
import { toast } from 'sonner';

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '', instructions: '' });

  useEffect(() => { mockApi.getLocations().then(l => { setLocations(l); setLoading(false); }); }, []);

  const handleCreate = async () => {
    if (!form.name) return toast.error('Name is required');
    const loc = await mockApi.createLocation({
      name: form.name, address: form.address || null, phone: form.phone || null, instructions: form.instructions || null,
    });
    setLocations(prev => [loc, ...prev]);
    setShowForm(false);
    setForm({ name: '', address: '', phone: '', instructions: '' });
    toast.success('Location added');
  };

  const handleDelete = async (id: string) => {
    await mockApi.deleteLocation(id);
    setLocations(prev => prev.map(l => l.id === id ? { ...l, isActive: false } : l));
    toast.success('Location deactivated');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>;

  return (
    <div>
      <PageHeader title="Locations" description={`${locations.filter(l => l.isActive).length} active locations`}
        action={<Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Location'}</Button>}
      />

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Instructions</Label><Input value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} /></div>
                </div>
                <Button className="mt-4" onClick={handleCreate}>Add Location</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-3">
        {locations.length === 0 ? (
          <EmptyState icon="◍" title="No locations yet" description="Add your business locations." action={<Button onClick={() => setShowForm(true)}>Add Location</Button>} />
        ) : locations.map((l, i) => (
          <motion.div key={l.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className={!l.isActive ? 'opacity-50' : ''}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-base shrink-0">◍</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{l.name}</p>
                    {l.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                  </div>
                  {l.address && <p className="text-xs text-muted-foreground truncate">{l.address}</p>}
                  {l.instructions && <p className="text-xs text-muted-foreground truncate mt-0.5 italic">{l.instructions}</p>}
                </div>
                <StatusBadge status={l.isActive ? 'Active' : 'Inactive'} />
                {l.isActive && <Button variant="outline" size="sm" onClick={() => handleDelete(l.id)}>Deactivate</Button>}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
