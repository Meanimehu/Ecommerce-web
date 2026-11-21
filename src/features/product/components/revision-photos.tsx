'use client';

import { ArrowDown, ArrowUp, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { ErrorMessage } from '@/components/common/error-message';
import { PhotoFrame } from '@/components/common/photo-frame';
import { StatusChip } from '@/components/common/status-chip';
import { Form } from '@/components/form/form';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fill, messageFor } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import { UPLOAD_RULES } from '@/lib/uploads';
import { myPhotoSrc } from '@/features/product/hooks/use-product';
import { useRevisionPhotos } from '@/features/product/hooks/use-revision-photos';
import {
  MAX_PHOTOS,
  PhotoSize,
  RevisionPhotoState,
  type RevisionGallery,
  type RevisionPhoto,
} from '@/features/product/types';

/**
 * A revision's photos (Document 5, section 7.3): the proposed gallery, main photo first, each with
 * its description, Up and Down, and Remove; below it the live photos the revision takes away, each
 * with "Keep this photo"; and "Add a photo", one at a time. New photos are marked "New". What
 * happens on each action is in `use-revision-photos.ts`.
 */
export function RevisionPhotos({
  productId,
  gallery,
}: {
  productId: string;
  gallery: RevisionGallery;
}) {
  const messages = useMessages();
  const photoMessages = messages.product.photos;
  const revisionMessages = messages.product.revision;
  const photos = useRevisionPhotos({ productId, photos: gallery.images });
  const fileInput = useRef<HTMLInputElement>(null);
  const isFull = gallery.images.length >= MAX_PHOTOS;

  return (
    <section
      aria-labelledby="revision-photos-heading"
      className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6"
    >
      <h3 id="revision-photos-heading" className="type-h3 text-ink">
        {revisionMessages.photos}
      </h3>
      {photos.actionError ? (
        <ErrorMessage
          text={messageFor(photos.actionError, messages)}
          requestId={photos.actionError.requestId}
          messages={messages}
        />
      ) : null}
      <ol className="grid gap-3">
        {gallery.images.map((photo, index) => (
          <RevisionPhotoRow
            key={photo.id}
            productId={productId}
            photo={photo}
            index={index}
            count={gallery.images.length}
            photos={photos}
          />
        ))}
      </ol>
      {gallery.removed.length > 0 ? (
        <div className="grid gap-2">
          <h4 className="type-label text-ink">{revisionMessages.removedPhotos}</h4>
          <ul className="grid gap-2">
            {gallery.removed.map((photo) => (
              <li
                key={photo.id}
                className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 rounded-1 border border-dashed border-control p-3"
              >
                <PhotoFrame
                  src={myPhotoSrc(productId, photo.id, PhotoSize.Thumb)}
                  alt={photo.altText ?? ''}
                  unavailable={messages.common.photoUnavailable}
                  className="w-16"
                  dimmed
                />
                <StatusChip tone="warning" label={revisionMessages.photoRemoved} />
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  disabled={photos.isBusy || isFull}
                  onClick={() => photos.restorePhoto(photo.id)}
                >
                  {revisionMessages.restore}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {isFull ? (
        <p className="text-ink-2">{photoMessages.full}</p>
      ) : (
        <div className="grid gap-2">
          <input
            ref={fileInput}
            type="file"
            accept={UPLOAD_RULES.photo.accept}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) photos.addPhoto(file);
            }}
          />
          <div>
            <Button
              type="button"
              variant="secondary"
              loading={photos.progress !== null}
              disabled={photos.isBusy}
              onClick={() => fileInput.current?.click()}
            >
              <Upload aria-hidden="true" />
              {revisionMessages.addPhoto}
            </Button>
          </div>
          {photos.progress !== null ? (
            <p role="status" className="type-small text-ink-2 tabular-nums">
              {fill(photoMessages.uploading, { percent: Math.round(photos.progress * 100) })}
            </p>
          ) : null}
          <p className="type-small text-muted-foreground">{revisionMessages.photosHelp}</p>
        </div>
      )}
      {photos.isOutcomeUnknown ? <Banner tone="warning">{photoMessages.unknown}</Banner> : null}
      {photos.uploadError && !photos.isOutcomeUnknown ? (
        <ErrorMessage
          text={messageFor(photos.uploadError, messages)}
          requestId={photos.uploadError.requestId}
          messages={messages}
        />
      ) : null}
    </section>
  );
}

/** One photo of the proposed gallery: its preview, "New" if proposed, its description, Up, Down and Remove. */
function RevisionPhotoRow({
  productId,
  photo,
  index,
  count,
  photos,
}: {
  productId: string;
  photo: RevisionPhoto;
  index: number;
  count: number;
  photos: ReturnType<typeof useRevisionPhotos>;
}) {
  const messages = useMessages();
  const photoMessages = messages.product.photos;
  const revisionMessages = messages.product.revision;
  const savedAltText = photo.altText ?? '';
  const [altText, setAltText] = useState(savedAltText);
  const label =
    index === 0 ? photoMessages.main : fill(photoMessages.number, { number: index + 1 });
  const altTextId = `revision-alt-${photo.id}`;

  return (
    <li className="grid gap-3 rounded-1 border border-line p-3 sm:grid-cols-[96px_minmax(0,1fr)_auto]">
      <PhotoFrame
        src={myPhotoSrc(productId, photo.id, PhotoSize.Thumb)}
        alt={photo.altText ?? ''}
        unavailable={messages.common.photoUnavailable}
        className="w-24"
      />
      <div className="grid content-start gap-2">
        <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
          {label}
          {photo.state === RevisionPhotoState.PendingAdd ? (
            <StatusChip tone="info" label={revisionMessages.photoNew} />
          ) : null}
        </p>
        <Form
          className="grid gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            photos.saveAltText(photo.id, altText);
          }}
        >
          <label htmlFor={altTextId} className="type-label text-ink">
            {photoMessages.alt}{' '}
            <span className="font-normal text-muted-foreground">{messages.form.optional}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <Input
              id={altTextId}
              value={altText}
              maxLength={200}
              onChange={(event) => setAltText(event.target.value)}
              className="min-w-0 flex-1 lg:h-10"
            />
            <Button
              type="submit"
              variant="secondary"
              size="small"
              disabled={photos.isBusy || altText === savedAltText}
            >
              {photoMessages.saveAlt}
              <span className="sr-only">: {label}</span>
            </Button>
          </div>
        </Form>
      </div>
      <div className="flex flex-wrap items-start gap-1 sm:flex-col sm:items-end">
        <Button
          type="button"
          variant="secondary"
          size="small"
          disabled={photos.isBusy || index === 0}
          onClick={() => photos.movePhoto(index, index - 1)}
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
          disabled={photos.isBusy || index === count - 1}
          onClick={() => photos.movePhoto(index, index + 1)}
        >
          <ArrowDown aria-hidden="true" />
          <span className="sr-only">
            {photoMessages.down}: {label}
          </span>
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="small"
          disabled={photos.isBusy}
          onClick={() => photos.removePhoto(photo.id)}
        >
          {photoMessages.remove}
          <span className="sr-only">: {label}</span>
        </Button>
      </div>
    </li>
  );
}
