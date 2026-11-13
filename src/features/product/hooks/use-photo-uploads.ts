'use client';

import { useRef, useState } from 'react';
import { useToast } from '@/components/common/toast';
import { AppErrorCode, BackendErrorCode } from '@/lib/error-codes';
import { AppError, fill } from '@/lib/errors';
import { HttpStatus } from '@/lib/http-status';
import { useMessages } from '@/lib/messages-context';
import { checkFile } from '@/lib/uploads';
import { MAX_PHOTOS, UploadState, type PhotoUpload } from '@/features/product/types';
import { useUploadPhoto } from './use-product';

/**
 * Uploading photos (Document 5, section 7.3; Document 3, section 10): several files are sent one
 * after another, one file per request, in the order chosen, with progress and Cancel for each. A
 * file is checked here first only for what is certain (size, type and the photo limit); the backend
 * checks again and its answer is what counts. A failed upload says why and can be tried again; one
 * whose outcome is unknown is checked first, because the list is read again. The screen,
 * `photos-step.tsx`, only draws.
 *
 * The queue keeps going when the vendor moves to another step, so it uses `mutateAsync` with
 * `then` (Document 7, 20.9, the one exception): `mutate`'s own callbacks stop once the screen has
 * closed.
 */
export function usePhotoUploads({
  productId,
  photoCount,
}: {
  productId: string;
  photoCount: number;
}) {
  const messages = useMessages();
  const toast = useToast();
  const uploadPhoto = useUploadPhoto(productId);
  const [uploads, setUploads] = useState<PhotoUpload[]>([]);
  const waitingUploads = useRef<PhotoUpload[]>([]);
  const sendingController = useRef<AbortController | null>(null);
  const isSending = useRef(false);
  const lastKey = useRef(0);
  const unsentCount = uploads.filter(
    (photoUpload) =>
      photoUpload.state === UploadState.Waiting || photoUpload.state === UploadState.Sending,
  ).length;
  const room = MAX_PHOTOS - photoCount - unsentCount;

  function changeUpload(key: number, change: Partial<PhotoUpload>) {
    setUploads((list) =>
      list.map((photoUpload) =>
        photoUpload.key === key ? { ...photoUpload, ...change } : photoUpload,
      ),
    );
  }

  function dropUpload(key: number) {
    setUploads((list) => list.filter((photoUpload) => photoUpload.key !== key));
  }

  function addFiles(files: FileList | File[]) {
    let roomLeft = room;
    const added: PhotoUpload[] = [];
    for (const file of Array.from(files)) {
      lastKey.current += 1;
      const photoUpload: PhotoUpload = {
        key: lastKey.current,
        file,
        progress: 0,
        state: UploadState.Waiting,
      };
      const problemFound = checkFile(file, 'photo');
      if (roomLeft <= 0) {
        photoUpload.state = UploadState.Failed;
        photoUpload.error = new AppError({
          code: BackendErrorCode.ImageLimit,
          status: HttpStatus.Conflict,
        });
      } else if (problemFound) {
        photoUpload.state = UploadState.Failed;
        photoUpload.error = new AppError({ code: problemFound, status: HttpStatus.BadRequest });
      } else {
        roomLeft -= 1;
      }
      added.push(photoUpload);
    }
    setUploads((list) => [...list, ...added]);
    waitingUploads.current.push(
      ...added.filter((photoUpload) => photoUpload.state === UploadState.Waiting),
    );
    startSending();
  }

  function retryUpload(photoUpload: PhotoUpload) {
    changeUpload(photoUpload.key, { state: UploadState.Waiting, error: undefined, progress: 0 });
    waitingUploads.current.push(photoUpload);
    startSending();
  }

  /** Cancel stops the photo being sent; a waiting or failed one is just taken off the list. */
  function cancelUpload(photoUpload: PhotoUpload) {
    if (photoUpload.state === UploadState.Sending) {
      sendingController.current?.abort();
      return;
    }
    waitingUploads.current = waitingUploads.current.filter(
      (waiting) => waiting.key !== photoUpload.key,
    );
    dropUpload(photoUpload.key);
  }

  function startSending() {
    if (isSending.current) return;
    isSending.current = true;
    sendNextUpload();
  }

  // One file at a time, in the order chosen (Document 3, section 10).
  function sendNextUpload() {
    const nextUpload = waitingUploads.current.shift();
    if (!nextUpload) {
      sendingController.current = null;
      isSending.current = false;
      return;
    }
    const controller = new AbortController();
    sendingController.current = controller;
    changeUpload(nextUpload.key, { state: UploadState.Sending, progress: 0 });
    uploadPhoto
      .mutateAsync({
        file: nextUpload.file,
        signal: controller.signal,
        onProgress: (progress) => changeUpload(nextUpload.key, { progress }),
      })
      .then(
        () => showUploaded(nextUpload),
        (error: AppError) => showUploadFailed(nextUpload, error),
      )
      .then(sendNextUpload);
  }

  function showUploaded(photoUpload: PhotoUpload) {
    dropUpload(photoUpload.key);
    toast(fill(messages.product.photos.uploaded, { name: photoUpload.file.name }));
  }

  function showUploadFailed(photoUpload: PhotoUpload, error: AppError) {
    if (error.code === AppErrorCode.UploadCancelled) {
      dropUpload(photoUpload.key);
      return;
    }
    // The photo may or may not have arrived: the list is read again (the call hook does) before
    // Retry is offered.
    const state = error.outcomeUnknown ? UploadState.Unknown : UploadState.Failed;
    changeUpload(photoUpload.key, { state, error });
  }

  return { uploads, room, addFiles, retryUpload, cancelUpload };
}
