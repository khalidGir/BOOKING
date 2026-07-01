'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '◇' },
  { href: '/bookings', label: 'Bookings', icon: '◈' },
  { href: '/services', label: 'Services', icon: '◎' },
  { href: '/staff', label: 'Staff', icon: '◉' },
  { href: '/locations', label: 'Locations', icon: '◍' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r bg-muted/30 p-4 flex flex-col gap-1 shrink-0">
      <div className="px-3 py-4 mb-4">
        <h1 className="font-bold text-lg tracking-tight">Booking</h1>
        <p className="text-xs text-muted-foreground">Admin Panel</p>
      </div>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            pathname.startsWith(item.href)
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted',
          )}
        >
          <span className="text-base">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </aside>
  );
}
