'use client';

import { useRef, useState } from 'react';
import { useToast } from '@/components/common/toast';
import { AppErrorCode } from '@/lib/error-codes';
import { AppError, fill } from '@/lib/errors';
import { HttpStatus } from '@/lib/http-status';
import { useMessages } from '@/lib/messages-context';
import { checkFile } from '@/lib/uploads';
import type { DocumentType } from '@/features/vendor/types';
import { useUploadVendorDocument } from './use-vendor';

/**
 * Uploading one document (Document 5, section 7.1; Document 3, section 10): one file at a time,
 * with progress and Cancel. The file is checked here first only for what is certain (size and
 * type); the backend checks again and its answer is what counts. The screen, `document-row.tsx`,
 * only draws.
 */
export function useDocumentUpload({ type, label }: { type: DocumentType; label: string }) {
  const messages = useMessages();
  const toast = useToast();
  const uploadVendorDocument = useUploadVendorDocument();
  const uploadController = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<AppError | null>(null);
  const [isOutcomeUnknown, setIsOutcomeUnknown] = useState(false);

  function uploadFile(file: File) {
    setUploadError(null);
    setIsOutcomeUnknown(false);

    const problemFound = checkFile(file, 'document');
    if (problemFound) {
      setUploadError(new AppError({ code: problemFound, status: HttpStatus.BadRequest }));
      return;
    }

    const controller = new AbortController();
    uploadController.current = controller;
    setProgress(0);
    uploadVendorDocument.mutate(
      { type, file, onProgress: setProgress, signal: controller.signal },
      { onSuccess: showUploaded, onError: showUploadError, onSettled: finishUpload },
    );
  }

  function cancelUpload() {
    uploadController.current?.abort();
  }

  function showUploaded() {
    toast(fill(messages.vendor.documents.uploaded, { document: label }));
  }

  function showUploadError(error: AppError) {
    if (error.code === AppErrorCode.UploadCancelled) return;
    // The upload may or may not have arrived: the list is read again, and the person checks it
    // (Document 3, section 6).
    if (error.outcomeUnknown) setIsOutcomeUnknown(true);
    else setUploadError(error);
  }

  function finishUpload() {
    setProgress(null);
    uploadController.current = null;
  }

  return {
    uploadFile,
    cancelUpload,
    progress,
    isUploading: progress !== null,
    uploadError,
    isOutcomeUnknown,
  };
}
