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
        // The tick is part of a class name, so it has no spaces and no quotes (%20, %22): Tailwind
        // and the class merger read class names up to a space, which once dropped the tick and the
        // ink fill.
        'checked:border-ink checked:bg-ink checked:bg-[url(data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%23fbfaf7%22%20stroke-width=%223%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22M5%2012l5%205%209-10%22/%3E%3C/svg%3E)] checked:bg-[length:18px] checked:bg-center checked:bg-no-repeat',
        'aria-invalid:border-2 aria-invalid:border-error disabled:cursor-not-allowed disabled:bg-sunken',
        'forced-colors:appearance-auto',
        className,
      )}
      {...props}
    />
  );
}

export { Checkbox };
