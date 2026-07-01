'use client';

import { initials, avatarColor } from '@/lib/mock-data';

export function AvatarInitials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
      style={{ backgroundColor: avatarColor(name) }}
    >
      {initials(name)}
    </div>
  );
}
