import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { LoaderCircle } from 'lucide-react';
import { Slot } from 'radix-ui';

/**
 * Buttons (Document 6, 8.2; approved Stage 4). Colour changes only, no movement (8.1, 13). Hover only on devices that
 * can hover (the hover variant in globals.css). Disabled: sunken fill, muted text. The focus ring is the global one.
 *
 * Busy (owner, 23 Nov 2026): while a request runs, the button looks disabled and cannot be pressed, but it is
 * marked `aria-disabled`, not `disabled`, so it keeps focus: a browser drops focus from a control that becomes
 * `disabled`, and a keyboard or screen reader user would lose their place. `disabled` is for a button that is
 * unavailable for another reason (nothing chosen yet).
 *
 * Variants: primary (the one main action of a section), secondary, quiet (low priority), destructive (opens a
 * confirmation, never acts on first press), destructiveConfirm (only inside that confirmation).
 * Sizes: large 52 (storefront main actions); default 48 on compact, 44 on expanded; small drawn 36 with a 44 px hit area
 * on compact. Every standalone button keeps a 44 px hit area on compact screens (D6-11).
 */
const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 items-center justify-center gap-2 rounded-2 border border-transparent font-medium whitespace-nowrap select-none',
    'transition-colors duration-100 outline-none cursor-pointer',
    'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-sunken disabled:text-muted-foreground',
    'aria-disabled:cursor-not-allowed aria-disabled:border-transparent aria-disabled:bg-sunken aria-disabled:text-muted-foreground',
    'data-busy:pointer-events-none',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  ],
  {
    variants: {
      variant: {
        primary: 'bg-madder text-white hover:bg-madder-hover active:bg-madder-press',
        secondary:
          'border-control bg-surface text-ink hover:border-ink active:border-ink active:bg-sunken',
        quiet:
          'bg-transparent text-madder hover:text-madder-hover active:bg-sunken active:text-madder-press',
        destructive: 'border-error bg-surface text-error hover:bg-error-fill active:bg-error-fill',
        destructiveConfirm: 'bg-error text-white hover:bg-error-hover active:bg-error-hover',
      },
      size: {
        large: 'h-13 px-5 text-base',
        default: 'h-12 px-5 text-base lg:h-11',
        small:
          'h-9 px-3.5 text-sm before:absolute before:inset-x-0 before:top-1/2 before:h-11 before:-translate-y-1/2 lg:before:content-none',
      },
    },
    compoundVariants: [{ variant: 'quiet', className: 'px-2' }],
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** A request is running for this button: busy, keeps its width and shows a spinner (8.1, "Loading"). */
    loading?: boolean;
    /** A request is running (often another button's): looks disabled and cannot be pressed, but keeps focus. */
    busy?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  busy = false,
  disabled,
  onClick,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  const isBusy = !asChild && !disabled && (busy || loading);
  // A busy button does nothing when pressed; for a submit button this also stops the form being
  // sent, including by Enter in one of its fields (the browser presses the submit button then).
  const pressed: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    if (isBusy) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={asChild ? undefined : disabled}
      aria-disabled={isBusy || undefined}
      aria-busy={loading || undefined}
      data-busy={isBusy || undefined}
      onClick={pressed}
      {...props}
    >
      {loading && !asChild ? (
        <>
          <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
