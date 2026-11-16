import * as React from 'react';
import { cn } from '@/utils/cn';

/**
 * Radio (Document 6, 8.4): a 24 px circle with a control border; checked is an ink ring with an
 * ink dot. The browser's own radio, so arrow keys and screen readers work as they always do. Put it
 * inside its label so the whole row is the target (at least 44 px high on compact).
 */
function Radio({ className, ...props }: Omit<React.ComponentProps<'input'>, 'type'>) {
  return (
    <input
      type="radio"
      data-slot="radio"
      className={cn(
        'mt-0.5 size-6 shrink-0 cursor-pointer appearance-none rounded-full border border-control bg-surface transition-colors duration-100 hover:border-ink',
        // The dot is the ink fill showing inside a surface ring drawn as an inset shadow.
        'checked:border-2 checked:border-ink checked:bg-ink checked:shadow-[inset_0_0_0_4px_var(--color-surface)]',
        'disabled:cursor-not-allowed disabled:bg-sunken',
        'forced-colors:appearance-auto',
        className,
      )}
      {...props}
    />
  );
}

export { Radio };
