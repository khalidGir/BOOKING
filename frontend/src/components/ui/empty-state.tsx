'use client';

import { motion } from 'framer-motion';

export function EmptyState({
  icon, title, description, action,
}: {
  icon: string; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <span className="text-5xl mb-4 opacity-40">{icon}</span>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>
      {action}
    </motion.div>
  );
}
