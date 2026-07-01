'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { mockApi } from '@/lib/mock-api';
import type { Business } from '@/lib/mock-data';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', timezone: '',
    cancellationHours: '0', corsWhitelist: '',
  });

  useEffect(() => {
    mockApi.getBusiness().then(b => {
      setBusiness(b);
      setForm({
        name: b.name, email: b.email, phone: b.phone ?? '', address: b.address ?? '',
        timezone: b.timezone, cancellationHours: String(b.cancellationHours),
        corsWhitelist: b.corsWhitelist.join(', '),
      });
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await mockApi.updateBusiness({
      name: form.name, email: form.email,       phone: form.phone || undefined, address: form.address || undefined,
      timezone: form.timezone, cancellationHours: parseInt(form.cancellationHours) || 0,
      corsWhitelist: form.corsWhitelist.split(',').map(s => s.trim()).filter(Boolean),
    });
    setSaving(false);
    toast.success('Settings saved');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage your business profile and preferences</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="mb-6">
          <CardHeader><CardTitle>Business Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Business Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Timezone</Label><Input value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="mb-6">
          <CardHeader><CardTitle>Booking Rules</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cancellation Window (hours)</Label>
                <Input type="number" value={form.cancellationHours} onChange={e => setForm(f => ({ ...f, cancellationHours: e.target.value }))} />
                <p className="text-xs text-muted-foreground">Customers must cancel at least this many hours before their appointment.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="mb-6">
          <CardHeader><CardTitle>Embed Widget</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Allowed Domains (CORS Whitelist)</Label>
              <Input value={form.corsWhitelist} onChange={e => setForm(f => ({ ...f, corsWhitelist: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Comma-separated list of domains allowed to embed the booking widget.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
    </div>
  );
}
