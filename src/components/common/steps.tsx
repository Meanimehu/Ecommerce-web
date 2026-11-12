import { Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/utils/cn';

/**
 * The steps of a long form (Document 6, section 9): each step shows its number or a tick and whether it is complete in
 * words, and the current one is underlined. Each is a link to its step. Text is the screen's (D-08).
 */
export interface Step {
  key: string;
  label: string;
  /** A shorter name for phones, so every step fits without scrolling. */
  short?: string;
  href: string;
  done: boolean;
}

export function Steps({ steps, current, label, doneLabel }: { steps: readonly Step[]; current: string; label: string; doneLabel: string }) {
  return (
    <nav aria-label={label} className="overflow-x-auto">
      <ol className="flex min-w-max gap-1 border-b border-line">
        {steps.map((step, index) => {
          const isCurrent = step.key === current;
          return (
            <li key={step.key}>
              <Link
                href={step.href}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-2 border-b-[3px] px-2.5 pb-1 type-small text-ink-2 no-underline transition-colors duration-100 hover:text-ink',
                  isCurrent ? 'border-ink font-medium text-ink' : step.done ? 'border-success' : 'border-transparent',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-flex size-6 items-center justify-center rounded-full text-xs font-medium',
                    step.done ? 'bg-success text-white' : isCurrent ? 'bg-ink text-surface' : 'bg-sunken text-ink-2',
                  )}
                >
                  {step.done ? <Check className="size-4" /> : index + 1}
                </span>
                {step.short ? (
                  <>
                    <span className="sm:hidden">{step.short}</span>
                    <span className="max-sm:hidden">{step.label}</span>
                  </>
                ) : (
                  <span>{step.label}</span>
                )}
                {step.done ? <span className="sr-only">({doneLabel})</span> : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
