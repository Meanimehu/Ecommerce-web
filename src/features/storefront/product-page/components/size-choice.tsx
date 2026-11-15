import type { Messages } from '@/lib/i18n';
import type { VariantSize } from '@/features/storefront/types';
import { cn } from '@/utils/cn';

/**
 * The sizes of a product as buttons (Document 6, 8.5). One not available is crossed out with a
 * dotted border and says "Unavailable" in text, never by colour alone.
 */
export function SizeChoice({
  sizes,
  sizeCode,
  isAvailable,
  onChoose,
  messages,
}: {
  sizes: VariantSize[];
  sizeCode: string | null;
  isAvailable: (code: string) => boolean;
  onChoose: (code: string) => void;
  messages: Messages;
}) {
  const storeMessages = messages.store;
  const chosenLabel = sizes.find((size) => size.code === sizeCode)?.label;
  return (
    <fieldset className="grid gap-2">
      <legend className="type-label text-ink">
        {storeMessages.size}
        {chosenLabel ? `: ${chosenLabel}` : ''}
      </legend>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const isSizeAvailable = isAvailable(size.code);
          return (
            <button
              key={size.code}
              type="button"
              aria-pressed={sizeCode === size.code}
              aria-disabled={!isSizeAvailable || undefined}
              aria-label={
                isSizeAvailable ? size.label : `${size.label}, ${storeMessages.unavailable}`
              }
              onClick={() => onChoose(size.code)}
              className={cn(
                'min-h-12 min-w-12 rounded-2 border px-3 font-medium transition-colors duration-100',
                sizeCode === size.code
                  ? 'border-ink bg-ink text-surface'
                  : 'border-control bg-surface text-ink hover:border-ink',
                !isSizeAvailable &&
                  'cursor-not-allowed border-dotted text-muted-foreground line-through hover:border-control',
              )}
            >
              {size.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
