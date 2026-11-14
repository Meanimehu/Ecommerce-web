import { Check, Clock, List, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * A status chip (Document 6, 8.7): 28 px high, radius-2, small 500 text with a 16 px icon, a fill and text colour from
 * the semantic table. Every chip has an icon and words, so status is never shown by colour alone.
 */
export type ChipTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

const TONES: Record<ChipTone, string> = {
  neutral: 'bg-sunken text-ink-2',
  info: 'bg-info-fill text-info',
  success: 'bg-success-fill text-success',
  warning: 'bg-warning-fill text-warning',
  error: 'bg-error-fill text-error',
};

const ICONS: Record<ChipTone, LucideIcon> = {
  neutral: List,
  info: Clock,
  success: Check,
  warning: TriangleAlert,
  error: X,
};

export function StatusChip({
  tone,
  label,
  icon,
  className,
}: {
  tone: ChipTone;
  label: string;
  icon?: LucideIcon;
  className?: string;
}) {
  const Icon = icon ?? ICONS[tone];
  return (
    <span
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-2 px-2 type-small font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </span>
  );
}
