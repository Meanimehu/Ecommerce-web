import * as React from 'react';
import { cn } from 'cn';

/**
 * Checkbox (Document 6, 8.4): a 24 px box with a control border; checked is an ink fill with a surface tick. The
 * browser's own checkbox, so keyboard and screen readers work as they always do. Put it inside its label so the whole
 * row is the target (at least 44 px high on compact).
 */
function Checkbox({ className, ...props }: Omit<React.ComponentProps<'input'>, 'type'>) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        'mt-0.5 size-6 shrink-0 cursor-pointer appearance-none rounded-1 border border-control bg-surface transition-colors duration-100 hover:border-ink',
        "checked:border-ink checked:bg-ink checked:bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fbfaf7' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12l5 5 9-10'/%3E%3C/svg%3E\")] checked:bg-[length:18px] checked:bg-center checked:bg-no-repeat",
        'aria-invalid:border-2 aria-invalid:border-error disabled:cursor-not-allowed disabled:bg-sunken',
        'forced-colors:appearance-auto',
        className,
      )}
      {...props}
    />
  );
}

export { Checkbox };
