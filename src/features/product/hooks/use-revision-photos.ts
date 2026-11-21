'use client';

import { useState } from 'react';
import { useToast } from '@/components/common/toast';
import { AppError } from '@/lib/errors';
import { HttpStatus } from '@/lib/http-status';
import { useMessages } from '@/lib/messages-context';
import { checkFile } from '@/lib/uploads';
import type { RevisionPhoto } from '@/features/product/types';
import {
  useChangeRevisionPhoto,
  useOrderRevisionPhotos,
  useRemoveRevisionPhoto,
  useRestoreRevisionPhoto,
  useUploadRevisionPhoto,
} from './use-product';

/**
 * A revision's photos (Document 5, section 7.3; area-3b-products.md, section 5): add one photo at a
 * time, move one up or down, give one a description, remove one (a new photo is deleted, a live one
 * is marked for removal) and keep a photo marked for removal. Nothing reaches customers until the
 * revision is approved. A file is checked here only for what is certain (size and type); an upload
 * whose outcome is unknown is not repeated, because the gallery is read again. The screen,
 * `revision-photos.tsx`, only draws.
 */
export function useRevisionPhotos({
  productId,
  photos,
}: {
  productId: string;
  photos: readonly RevisionPhoto[];
}) {
  const messages = useMessages();
  const photoMessages = messages.product.photos;
  const revisionMessages = messages.product.revision;
  const toast = useToast();
  const uploadPhoto = useUploadRevisionPhoto(productId);
  const orderPhotos = useOrderRevisionPhotos(productId);
  const changePhoto = useChangeRevisionPhoto(productId);
  const removePhoto = useRemoveRevisionPhoto(productId);
  const restorePhoto = useRestoreRevisionPhoto(productId);
  const [progress, setProgress] = useState<number | null>(null);
  const [fileProblem, setFileProblem] = useState<AppError | null>(null);

  function addPhoto(file: File) {
    const problemFound = checkFile(file, 'photo');
    if (problemFound) {
      setFileProblem(new AppError({ code: problemFound, status: HttpStatus.BadRequest }));
      return;
    }
    setFileProblem(null);
    setProgress(0);
    uploadPhoto.mutate(
      { file, onProgress: setProgress, signal: new AbortController().signal },
      { onSuccess: showAdded, onSettled: clearProgress },
    );
  }

  function movePhoto(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= photos.length) return;
    const photoIds = photos.map((photo) => photo.id);
    const [movedId] = photoIds.splice(fromIndex, 1);
    if (movedId === undefined) return;
    photoIds.splice(toIndex, 0, movedId);
    orderPhotos.mutate(photoIds, { onSuccess: showReordered });
  }

  function saveAltText(imageId: string, altText: string) {
    changePhoto.mutate({ imageId, altText: altText.trim() || null }, { onSuccess: showAltSaved });
  }

  function clearProgress() {
    setProgress(null);
  }

  function showAdded() {
    toast(revisionMessages.photoAdded);
  }

  function showReordered() {
    toast(photoMessages.reordered);
  }

  function showAltSaved() {
    toast(photoMessages.altSaved);
  }

  function showRemoved() {
    toast(photoMessages.removed);
  }

  function showRestored() {
    toast(revisionMessages.restored);
  }

  const uploadError = fileProblem ?? uploadPhoto.error;
  return {
    addPhoto,
    movePhoto,
    saveAltText,
    removePhoto: (imageId: string) => removePhoto.mutate(imageId, { onSuccess: showRemoved }),
    restorePhoto: (imageId: string) => restorePhoto.mutate(imageId, { onSuccess: showRestored }),
    progress,
    uploadError,
    isOutcomeUnknown: Boolean(uploadError?.outcomeUnknown),
    isBusy:
      uploadPhoto.isPending ||
      orderPhotos.isPending ||
      changePhoto.isPending ||
      removePhoto.isPending ||
      restorePhoto.isPending,
    actionError: orderPhotos.error ?? changePhoto.error ?? removePhoto.error ?? restorePhoto.error,
  };
}
