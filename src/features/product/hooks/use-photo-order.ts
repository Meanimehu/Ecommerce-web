'use client';

import { useToast } from '@/components/common/toast';
import { useMessages } from '@/lib/messages-context';
import type { Photo } from '@/features/product/types';
import { useOrderPhotos } from './use-product';

/**
 * Changing the order of the photos (Document 5, section 7.3) with Up and Down or by dragging. The
 * whole new order is sent; the first photo becomes the main one. The screen, `photos-step.tsx`,
 * only draws.
 */
export function usePhotoOrder({
  productId,
  photos,
}: {
  productId: string;
  photos: readonly Photo[];
}) {
  const messages = useMessages();
  const toast = useToast();
  const orderPhotos = useOrderPhotos(productId);

  function movePhoto(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= photos.length || fromIndex === toIndex) return;
    const photoIds = photos.map((photo) => photo.id);
    const [movedId] = photoIds.splice(fromIndex, 1);
    if (movedId === undefined) return;
    photoIds.splice(toIndex, 0, movedId);
    orderPhotos.mutate(photoIds, { onSuccess: showReordered });
  }

  function showReordered() {
    toast(messages.product.photos.reordered);
  }

  return { movePhoto, isMoving: orderPhotos.isPending, orderError: orderPhotos.error };
}
