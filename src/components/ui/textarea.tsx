import * as React from 'react';
import { cn } from 'cn';

/** Text area (Document 6, 8.3): at least 3 lines, resizes up and down only, styled like the text input. */
function Textarea({ className, rows = 3, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      className={cn(
        'min-h-24 w-full min-w-0 resize-y rounded-2 border border-control bg-surface px-3.5 py-2.5 text-base text-ink outline-none',
        'transition-colors duration-100 placeholder:text-muted-foreground hover:border-ink',
        'aria-invalid:border-2 aria-invalid:border-error aria-invalid:px-[13px] aria-invalid:py-[9px] aria-invalid:hover:border-error',
        'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-sunken disabled:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
