import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from 'cn';

/**
 * Select (Document 6, 8.4): looks like a text input with a chevron. The browser's own list is used, so it opens as a
 * menu on a computer and as the phone's own picker on a phone, and works with a keyboard and screen readers as is.
 */
function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          'h-12 w-full min-w-0 appearance-none rounded-2 border border-control bg-surface ps-3.5 pe-10 text-base text-ink outline-none lg:h-11',
          'transition-colors duration-100 hover:border-ink aria-invalid:border-2 aria-invalid:border-error aria-invalid:ps-[13px] aria-invalid:hover:border-error',
          'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-sunken disabled:text-muted-foreground',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute end-3 top-1/2 size-5 -translate-y-1/2 text-ink-2"
      />
    </div>
  );
}

export { Select };
