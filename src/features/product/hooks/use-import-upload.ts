'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { AppErrorCode } from '@/lib/error-codes';
import { AppError } from '@/lib/errors';
import { HttpStatus } from '@/lib/http-status';
import type { Locale } from '@/lib/i18n';
import { myImportPath } from '@/lib/routes';
import { checkFile } from '@/lib/uploads';
import type { Import } from '@/features/product/types';
import { useUploadImport } from './use-imports';

/**
 * Uploading one CSV file to be checked (Document 5, section 7.3; Document 3, section 10): one file,
 * with progress and Cancel, sent once. Only what is certain is checked here first (size, and a type
 * the browser names); the backend reads the file and its answer counts. A checked file opens its
 * import. When the answer is lost the imports are read again and the person looks there; the file is
 * never sent again by itself. The screen, `import-list.tsx`, only draws.
 */
export function useImportUpload(lang: Locale) {
  const router = useRouter();
  const uploadImport = useUploadImport();
  const uploadController = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<AppError | null>(null);
  const [isOutcomeUnknown, setIsOutcomeUnknown] = useState(false);

  function uploadFile(file: File) {
    setUploadError(null);
    setIsOutcomeUnknown(false);

    const problemFound = checkFile(file, 'csv');
    if (problemFound) {
      setUploadError(new AppError({ code: problemFound, status: HttpStatus.BadRequest }));
      return;
    }

    const controller = new AbortController();
    uploadController.current = controller;
    setProgress(0);
    uploadImport.mutate(
      { file, onProgress: setProgress, signal: controller.signal },
      { onSuccess: openCheckedImport, onError: showUploadError, onSettled: finishUpload },
    );
  }

  function cancelUpload() {
    uploadController.current?.abort();
  }

  function openCheckedImport(checked: Import) {
    router.push(myImportPath(lang, checked.id));
  }

  function showUploadError(error: AppError) {
    if (error.code === AppErrorCode.UploadCancelled) return;
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

/** What the backend says is wrong with a file it could not read (IMPORT_FILE_INVALID). */
export function fileProblemsOf(error: AppError): string[] {
  const problems = error.details?.problems;
  if (!Array.isArray(problems)) return [];
  return problems.filter((problem): problem is string => typeof problem === 'string');
}
