import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

/**
 * A banner (Document 6, 8.10 and 4.3): a semantic fill with its decorative edge, an icon and words, never colour alone.
 * Text inside is ink on the fill; the title takes the tone's text colour. May carry one action.
 */
export type BannerTone = 'info' | 'success' | 'warning' | 'error';

const TONES: Record<BannerTone, { box: string; title: string; icon: LucideIcon }> = {
  info: { box: 'border-info-edge bg-info-fill', title: 'text-info', icon: Info },
  success: { box: 'border-success-edge bg-success-fill', title: 'text-success', icon: CircleCheck },
  warning: { box: 'border-warning-edge bg-warning-fill', title: 'text-warning', icon: TriangleAlert },
  error: { box: 'border-error-edge bg-error-fill', title: 'text-error', icon: CircleAlert },
};

export function Banner({
  tone,
  title,
  children,
  action,
  className,
  ...props
}: {
  tone: BannerTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
} & Omit<React.ComponentProps<'div'>, 'title'>) {
  const toneStyle = TONES[tone];
  const Icon = toneStyle.icon;
  return (
    <div className={cn('flex items-start gap-3 rounded-1 border px-4 py-3.5', toneStyle.box, className)} {...props}>
      <Icon aria-hidden="true" className={cn('mt-0.5 size-5 shrink-0', toneStyle.title)} />
      <div className="grid min-w-0 flex-1 gap-1">
        {title ? <div className={cn('font-medium', toneStyle.title)}>{title}</div> : null}
        {children ? <div className="type-small text-ink">{children}</div> : null}
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </div>
  );
}
