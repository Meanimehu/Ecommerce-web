'use client';

import { useState } from 'react';
import {
  chosenVariant,
  coloursOf,
  isAvailable,
  missingChoiceOf,
  sizesOf,
  type PublicVariant,
} from '@/features/storefront/types';

/**
 * Choosing a size and a colour (Document 5, section 6.2; Document 6, 8.5). When there is only one
 * size or one colour it is chosen from the start. A size or colour with no variant in stock for the
 * other choice made is not available and cannot be chosen. The screens, `size-choice.tsx` and
 * `colour-choice.tsx`, only draw.
 */
export function useVariantChoice(variants: readonly PublicVariant[]) {
  const sizes = sizesOf(variants);
  const colours = coloursOf(variants);
  const [sizeCode, setSizeCode] = useState<string | null>(
    sizes.length === 1 ? (sizes[0]?.code ?? null) : null,
  );
  const [colourCode, setColourCode] = useState<string | null>(
    colours.length === 1 ? (colours[0]?.code ?? null) : null,
  );
  const choice = { sizeCode, colourCode };
  const isSizeAvailable = (code: string) => isAvailable(variants, { sizeCode: code, colourCode });
  const isColourAvailable = (code: string) => isAvailable(variants, { sizeCode, colourCode: code });

  function chooseSize(code: string) {
    if (isSizeAvailable(code)) setSizeCode(code);
  }

  function chooseColour(code: string) {
    if (isColourAvailable(code)) setColourCode(code);
  }

  return {
    sizes,
    colours,
    sizeCode,
    colourCode,
    chooseSize,
    chooseColour,
    isSizeAvailable,
    isColourAvailable,
    chosen: chosenVariant(variants, choice),
    missingChoice: missingChoiceOf(variants, choice),
  };
}
