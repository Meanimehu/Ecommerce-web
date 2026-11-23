'use client';

import { useState } from 'react';
import {
  chosenVariant,
  coloursOf,
  firstColourCode,
  isAvailable,
  missingChoiceOf,
  sizesOf,
} from '@/features/storefront/product-page/rules';
import type { PublicVariant } from '@/features/storefront/product-page/types';

/**
 * Choosing a size and a colour (Document 5, section 6.2; Document 6, 8.5). The first colour in
 * stock is chosen from the start, and a size only when there is just one (owner, 23 Nov 2026), so
 * nobody gets a size they did not choose. A size or colour with no variant in stock for the
 * other choice made is not available and cannot be chosen. The screens, `size-choice.tsx` and
 * `colour-choice.tsx`, only draw.
 */
export function useVariantChoice(variants: readonly PublicVariant[]) {
  const sizes = sizesOf(variants);
  const colours = coloursOf(variants);
  const [sizeCode, setSizeCode] = useState<string | null>(
    sizes.length === 1 ? (sizes[0]?.code ?? null) : null,
  );
  const [colourCode, setColourCode] = useState<string | null>(() => firstColourCode(variants));
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
