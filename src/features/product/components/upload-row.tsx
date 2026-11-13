'use client';

import { Button } from '@/components/ui/button';
import { BackendErrorCode } from '@/lib/error-codes';
import { fill, messageFor } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import { formatSize } from '@/lib/uploads';
import { UploadState, type PhotoUpload } from '@/features/product/types';
import { cn } from '@/utils/cn';

/**
 * One photo being uploaded: its name and size, progress in text, and Cancel; a failed one says why
 * and offers Retry, unless trying again cannot help (the limit, the size or the type).
 */
const NOT_RETRIED: ReadonlySet<string> = new Set([
  BackendErrorCode.ImageLimit,
  BackendErrorCode.FileTooLarge,
  BackendErrorCode.FileTypeNotAllowed,
]);

export function UploadRow({
  photoUpload,
  onCancel,
  onRetry,
}: {
  photoUpload: PhotoUpload;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const messages = useMessages();
  const photoMessages = messages.product.photos;
  const { file, state, error } = photoUpload;
  const percent = Math.round(photoUpload.progress * 100);
  const isFailed = state === UploadState.Failed;
  const isInQueue = state === UploadState.Sending || state === UploadState.Waiting;
  const canRetry = isFailed && !NOT_RETRIED.has(error?.code ?? '');
  const isFinished = isFailed || state === UploadState.Unknown;

  return (
    <li
      className={cn('grid gap-2 rounded-1 border p-3', isFailed ? 'border-error' : 'border-line')}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 truncate font-medium text-ink">
          {file.name} <span className="font-normal text-ink-2">· {formatSize(file.size)}</span>
        </p>
        <div className="flex gap-2">
          {canRetry ? (
            <Button type="button" variant="secondary" size="small" onClick={onRetry}>
              {photoMessages.retry}
              <span className="sr-only">: {file.name}</span>
            </Button>
          ) : null}
          <Button type="button" variant="quiet" size="small" onClick={onCancel}>
            {isFinished ? photoMessages.dismiss : messages.common.cancel}
            <span className="sr-only">: {file.name}</span>
          </Button>
        </div>
      </div>
      {isInQueue ? (
        <>
          <div className="h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className="h-full bg-ink" style={{ width: `${percent}%` }} />
          </div>
          <p role="status" className="type-small text-ink-2 tabular-nums">
            {state === UploadState.Waiting
              ? photoMessages.waiting
              : fill(photoMessages.uploading, { percent })}
          </p>
        </>
      ) : null}
      {isFailed && error ? (
        <p className="type-small text-error">{messageFor(error, messages)}</p>
      ) : null}
      {state === UploadState.Unknown ? (
        <p className="type-small text-ink">{photoMessages.unknown}</p>
      ) : null}
    </li>
  );
}
