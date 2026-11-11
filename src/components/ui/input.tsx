import * as React from 'react';
import { cn } from 'cn';

/**
 * Text input (Document 6, 8.3; approved Stage 4): 48 px on compact, 44 on expanded, 16 px text so phones do not zoom,
 * 1 px control border on surface, radius-2. In error a 2 px error border (aria-invalid). Read-only and disabled sit on
 * sunken with no border. Hover: the border turns ink (8.1).
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-12 w-full min-w-0 rounded-2 border border-control bg-surface px-3.5 text-base text-ink outline-none lg:h-11',
        'transition-colors duration-100 placeholder:text-muted-foreground hover:border-ink aria-invalid:hover:border-error',
        'aria-invalid:border-2 aria-invalid:border-error aria-invalid:px-[13px]',
        'read-only:border-transparent read-only:bg-sunken',
        'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-sunken disabled:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
