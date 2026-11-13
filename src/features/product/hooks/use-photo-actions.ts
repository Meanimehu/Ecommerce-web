'use client';

import { useState } from 'react';
import { useToast } from '@/components/common/toast';
import { useMessages } from '@/lib/messages-context';
import type { Photo } from '@/features/product/types';
import { useChangePhoto, useDeletePhoto } from './use-product';

/**
 * One photo's own actions (Document 5, section 7.3): saving its alt text, and removing it. An
 * emptied alt text is removed with null. The screen, `photo-row.tsx`, only draws.
 */
export function usePhotoActions({ productId, photo }: { productId: string; photo: Photo }) {
  const messages = useMessages();
  const toast = useToast();
  const changePhoto = useChangePhoto(productId);
  const deletePhoto = useDeletePhoto(productId);
  const savedAltText = photo.altText ?? '';
  const [altText, setAltText] = useState(savedAltText);

  function saveAltText() {
    changePhoto.mutate(
      { imageId: photo.id, altText: altText.trim() || null },
      { onSuccess: showAltTextSaved },
    );
  }

  function removePhoto() {
    deletePhoto.mutate(photo.id, { onSuccess: showRemoved });
  }

  function showAltTextSaved() {
    toast(messages.product.photos.altSaved);
  }

  function showRemoved() {
    toast(messages.product.photos.removed);
  }

  return {
    altText,
    setAltText,
    isAltTextChanged: altText !== savedAltText,
    saveAltText,
    isSavingAltText: changePhoto.isPending,
    removePhoto,
    isRemoving: deletePhoto.isPending,
    actionError: changePhoto.error ?? deletePhoto.error,
  };
}
