'use client';

import { AuthProvider } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Toaster } from '@/components/ui/sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <Toaster />
    </AuthProvider>
  );
}
