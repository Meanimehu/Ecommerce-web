import { cn } from '@/utils/cn';

/**
 * A loading skeleton (Document 6, section 10): sunken shapes the size of the content. Static, no sweep or pulse
 * (D6-43). The screen that shows it also announces "Loading" as a status message.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('rounded-1 bg-sunken', className)} />;
}
