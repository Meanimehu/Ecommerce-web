import type { Messages } from '@/lib/i18n';
import type { VariantColour } from '@/features/storefront/product-page/types';
import { cn } from '@/utils/cn';

/**
 * The colours of a product as swatches (Document 6, 8.5), each named in text. One not available is
 * crossed out and says "Unavailable" in text, never by colour alone.
 */
export function ColourChoice({
  colours,
  colourCode,
  isAvailable,
  onChoose,
  messages,
}: {
  colours: VariantColour[];
  colourCode: string | null;
  isAvailable: (code: string) => boolean;
  onChoose: (code: string) => void;
  messages: Messages;
}) {
  const storeMessages = messages.store;
  const chosenLabel = colours.find((colour) => colour.code === colourCode)?.label;
  return (
    <fieldset className="grid gap-2">
      <legend className="type-label text-ink">
        {storeMessages.colour}
        {chosenLabel ? `: ${chosenLabel}` : ''}
      </legend>
      <div className="flex flex-wrap gap-2">
        {colours.map((colour) => {
          const isColourAvailable = isAvailable(colour.code);
          return (
            <button
              key={colour.code}
              type="button"
              aria-pressed={colourCode === colour.code}
              aria-disabled={!isColourAvailable || undefined}
              aria-label={
                isColourAvailable ? colour.label : `${colour.label}, ${storeMessages.unavailable}`
              }
              title={colour.label}
              onClick={() => onChoose(colour.code)}
              className={cn(
                'relative flex size-12 items-center justify-center rounded-full border-2',
                colourCode === colour.code ? 'border-ink' : 'border-transparent',
                !isColourAvailable && 'cursor-not-allowed',
              )}
            >
              <span
                aria-hidden="true"
                className="size-10 rounded-full border border-control"
                style={colour.hex ? { background: colour.hex } : undefined}
              />
              {!isColourAvailable ? (
                <span aria-hidden="true" className="absolute h-0.5 w-12 rotate-45 bg-ink" />
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
