'use client';

import { ImagePlus } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, type DragEvent } from 'react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/common/error-message';
import { messageFor } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { UPLOAD_RULES } from '@/lib/uploads';
import { usePhotoOrder } from '@/features/product/hooks/use-photo-order';
import { usePhotoUploads } from '@/features/product/hooks/use-photo-uploads';
import { ProductStep, sortedPhotos, type ProductView } from '@/features/product/types';
import { cn } from '@/utils/cn';
import { PhotoRow } from './photo-row';
import { UploadRow } from './upload-row';

/**
 * Step 4, photos (Document 5, section 7.3; Document 6, section 9 "Uploads"; approved Stage 5): a
 * drop area with a plain file button, both usable with a keyboard; the uploads with progress; and
 * the photos in order. The first photo is the main one; the order changes with Up and Down or by
 * dragging. Photos stay private until the product is approved, so previews come through our server
 * (D3-04). It only draws; uploading is in `use-photo-uploads.ts` and the order in
 * `use-photo-order.ts`.
 */
export function PhotosStep({ lang, product }: { lang: Locale; product: ProductView }) {
  const messages = useMessages();
  const productMessages = messages.product;
  const photoMessages = productMessages.photos;
  const photos = sortedPhotos(product.images);
  const photoUploads = usePhotoUploads({ productId: product.id, photoCount: photos.length });
  const photoOrder = usePhotoOrder({ productId: product.id, photos });
  const { orderError } = photoOrder;
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function dropFiles(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
    if (event.dataTransfer.files.length) photoUploads.addFiles(event.dataTransfer.files);
  }

  return (
    <section
      aria-labelledby="photos-heading"
      className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id="photos-heading" className="type-h3 text-ink">
        {productMessages.steps.photos}
      </h2>
      {photoUploads.room > 0 ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={dropFiles}
          className={cn(
            'grid justify-items-center gap-2 rounded-1 border px-4 py-6 text-center',
            isDragOver ? 'border-ink bg-sunken' : 'border-control',
          )}
        >
          <ImagePlus aria-hidden="true" strokeWidth={1.5} className="size-8 text-ink-2" />
          <p className="font-medium text-ink">{photoMessages.add}</p>
          <p className="type-small text-ink-2">{photoMessages.dropHelp}</p>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept={UPLOAD_RULES.photo.accept}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              if (event.target.files?.length) photoUploads.addFiles(event.target.files);
              event.target.value = '';
            }}
          />
          <Button type="button" variant="secondary" onClick={() => fileInput.current?.click()}>
            {photoMessages.choose}
          </Button>
        </div>
      ) : (
        <Banner tone="info">{photoMessages.full}</Banner>
      )}

      {photoUploads.uploads.length ? (
        <ul className="grid gap-3" aria-label={photoMessages.uploads}>
          {photoUploads.uploads.map((photoUpload) => (
            <UploadRow
              key={photoUpload.key}
              photoUpload={photoUpload}
              onCancel={() => photoUploads.cancelUpload(photoUpload)}
              onRetry={() => photoUploads.retryUpload(photoUpload)}
            />
          ))}
        </ul>
      ) : null}

      {orderError ? (
        <ErrorMessage
          text={messageFor(orderError, messages)}
          requestId={orderError.requestId}
          messages={messages}
        />
      ) : null}

      <ul className="grid gap-3" aria-label={photoMessages.list}>
        {photos.map((photo, index) => (
          <PhotoRow
            key={photo.id}
            productId={product.id}
            photo={photo}
            index={index}
            count={photos.length}
            isMoving={photoOrder.isMoving}
            onMove={photoOrder.movePhoto}
          />
        ))}
      </ul>
      <p className="type-small text-muted-foreground">{photoMessages.help}</p>
      <div className="flex justify-end">
        <Button asChild>
          <Link
            href={`/${lang}/vendor/products/${product.id}?step=${ProductStep.Review}`}
            className="no-underline"
          >
            {productMessages.continue}
          </Link>
        </Button>
      </div>
    </section>
  );
}
