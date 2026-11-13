'use client';

import { useToast } from '@/components/common/toast';
import { useMessages } from '@/lib/messages-context';
import { VariantStatus, type Variant } from '@/features/product/types';
import { useChangeVariant, useDeleteVariant } from './use-product';

/**
 * The variant table's own actions (Document 5, section 7.3): switching a variant off or on, and
 * removing one. The backend decides whether a variant may be removed (only while the product has
 * never been approved). The screen, `variants-step.tsx`, only draws.
 */
export function useVariantActions({
  productId,
  isFormOpen,
}: {
  productId: string;
  isFormOpen: boolean;
}) {
  const messages = useMessages();
  const toast = useToast();
  const changeVariant = useChangeVariant(productId);
  const deleteVariant = useDeleteVariant(productId);

  function switchVariant(variant: Variant) {
    const status =
      variant.status === VariantStatus.Active ? VariantStatus.Inactive : VariantStatus.Active;
    changeVariant.mutate({ variantId: variant.id, body: { status } }, { onSuccess: showSaved });
  }

  function removeVariant(variantId: string) {
    deleteVariant.mutate(variantId, { onSuccess: showRemoved });
  }

  function showSaved() {
    toast(messages.product.saved);
  }

  function showRemoved() {
    toast(messages.product.variant.removed);
  }

  // A failed switch shows while the form is closed; while it is open, the form shows its own.
  const switchError = isFormOpen ? null : changeVariant.error;

  return {
    switchVariant,
    isSwitching: changeVariant.isPending,
    removeVariant,
    isRemoving: deleteVariant.isPending,
    actionError: switchError ?? deleteVariant.error,
  };
}
