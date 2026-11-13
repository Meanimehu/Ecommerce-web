'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorMessage } from '@/components/common/error-message';
import { PhotoFrame } from '@/components/common/photo-frame';
import { Form } from '@/components/form/form';
import { fill, messageFor } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import { myPhotoSrc } from '@/features/product/hooks/use-product';
import { usePhotoActions } from '@/features/product/hooks/use-photo-actions';
import { PhotoSize, type Photo } from '@/features/product/types';

/**
 * One saved photo: its preview, its alt text, Up and Down, and Remove. It can also be dragged onto
 * another row to move it there. It only draws; its own actions are in `use-photo-actions.ts`.
 */
const DRAG_DATA_TYPE = 'text/plain';

export function PhotoRow({
  productId,
  photo,
  index,
  count,
  isMoving,
  onMove,
}: {
  productId: string;
  photo: Photo;
  index: number;
  count: number;
  isMoving: boolean;
  onMove: (fromIndex: number, toIndex: number) => void;
}) {
  const messages = useMessages();
  const photoMessages = messages.product.photos;
  const photoActions = usePhotoActions({ productId, photo });
  const { actionError } = photoActions;
  const label =
    index === 0 ? photoMessages.main : fill(photoMessages.number, { number: index + 1 });
  const altTextId = `photo-alt-${photo.id}`;

  return (
    <li
      draggable
      onDragStart={(event) => event.dataTransfer.setData(DRAG_DATA_TYPE, String(index))}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const fromIndex = Number(event.dataTransfer.getData(DRAG_DATA_TYPE));
        // A file dropped here belongs to the drop area, not to the order.
        if (Number.isInteger(fromIndex) && !event.dataTransfer.files.length) {
          event.preventDefault();
          event.stopPropagation();
          onMove(fromIndex, index);
        }
      }}
      className="grid gap-3 rounded-1 border border-line p-3 sm:grid-cols-[96px_minmax(0,1fr)_auto]"
    >
      <PhotoFrame
        src={myPhotoSrc(productId, photo.id, PhotoSize.Thumb)}
        alt={photo.altText ?? ''}
        unavailable={messages.common.photoUnavailable}
        className="w-24"
      />
      <div className="grid content-start gap-2">
        <p className="font-medium text-ink">{label}</p>
        <Form
          className="grid gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            photoActions.saveAltText();
          }}
        >
          <label htmlFor={altTextId} className="type-label text-ink">
            {photoMessages.alt}{' '}
            <span className="font-normal text-muted-foreground">{messages.form.optional}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <Input
              id={altTextId}
              value={photoActions.altText}
              maxLength={200}
              onChange={(event) => photoActions.setAltText(event.target.value)}
              className="min-w-0 flex-1 lg:h-10"
              aria-describedby={`${altTextId}-help`}
            />
            <Button
              type="submit"
              variant="secondary"
              size="small"
              loading={photoActions.isSavingAltText}
              disabled={!photoActions.isAltTextChanged}
            >
              {photoMessages.saveAlt}
              <span className="sr-only">: {label}</span>
            </Button>
          </div>
          <p id={`${altTextId}-help`} className="type-small text-muted-foreground">
            {photoMessages.altHelp}
          </p>
        </Form>
        {actionError ? (
          <ErrorMessage
            text={messageFor(actionError, messages)}
            requestId={actionError.requestId}
            messages={messages}
          />
        ) : null}
      </div>
      <div className="flex flex-wrap items-start gap-1 sm:flex-col sm:items-end">
        <Button
          type="button"
          variant="secondary"
          size="small"
          disabled={isMoving || index === 0}
          onClick={() => onMove(index, index - 1)}
        >
          <ArrowUp aria-hidden="true" />
          <span className="sr-only">
            {photoMessages.up}: {label}
          </span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="small"
          disabled={isMoving || index === count - 1}
          onClick={() => onMove(index, index + 1)}
        >
          <ArrowDown aria-hidden="true" />
          <span className="sr-only">
            {photoMessages.down}: {label}
          </span>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              size="small"
              disabled={photoActions.isRemoving}
            >
              {photoMessages.remove}
              <span className="sr-only">: {label}</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{photoMessages.removeTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {fill(photoMessages.removeBody, { name: label })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{messages.common.cancel}</AlertDialogCancel>
              <AlertDialogAction variant="destructiveConfirm" onClick={photoActions.removePhoto}>
                {photoMessages.remove}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}
