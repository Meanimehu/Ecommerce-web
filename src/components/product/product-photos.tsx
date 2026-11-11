'use client';

import { ArrowDown, ArrowUp, ImagePlus } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, type DragEvent } from 'react';
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
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorMessage } from '@/components/common/error-message';
import { useToast } from '@/components/common/toast';
import { myPhotoSrc, useChangePhoto, useDeletePhoto, useOrderPhotos, useUploadPhoto } from '@/hooks/use-product';
import { AppError, fill, messageFor, requestIdOf, toAppError } from '@/lib/errors';
import { getMessages, type Locale, type Messages } from '@/lib/i18n';
import { checkFile, formatSize, UPLOAD_RULES } from '@/lib/uploads';
import type { Photo, ProductView } from '@/types/product';
import { cn } from '@/utils/cn';
import { PhotoFrame } from './photo-frame';

/**
 * Step 4, photos (Document 5, section 7.3; Document 6, section 9 "Uploads"; approved Stage 5): a drop area with a plain
 * file button, both usable with a keyboard. Several files are sent one after another, one file per request, with
 * progress in text and Cancel for each. A failed upload says why and offers Retry; one whose outcome is unknown is
 * checked first (the list is read again). The first photo is the main one; the order changes with Up and Down or by
 * dragging. Photos stay private until the product is approved, so previews come through our server (D3-04).
 */
const MAX_PHOTOS = 8;

interface Upload {
  key: number;
  file: File;
  progress: number;
  state: 'waiting' | 'sending' | 'failed' | 'unknown';
  error?: AppError;
}

export function sortedPhotos(images: readonly Photo[]): Photo[] {
  return [...images].sort((a, b) => Number(b.isCover) - Number(a.isCover) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function PhotosStep({ lang, product }: { lang: Locale; product: ProductView }) {
  const t = getMessages(lang);
  const p = t.product;
  const toast = useToast();
  const uploadPhoto = useUploadPhoto(product.id);
  const order = useOrderPhotos(product.id);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const current = useRef<AbortController | null>(null);
  const counter = useRef(0);
  const running = useRef(false);
  const queue = useRef<Upload[]>([]);
  const photos = sortedPhotos(product.images);
  const room = MAX_PHOTOS - photos.length - uploads.filter((u) => u.state === 'waiting' || u.state === 'sending').length;

  const update = (key: number, change: Partial<Upload>) => setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...change } : u)));
  const drop = (key: number) => setUploads((list) => list.filter((u) => u.key !== key));

  // One file at a time, in the order chosen (Document 3, section 10).
  const run = async () => {
    if (running.current) return;
    running.current = true;
    while (queue.current.length) {
      const next = queue.current.shift() as Upload;
      const controller = new AbortController();
      current.current = controller;
      update(next.key, { state: 'sending', progress: 0 });
      try {
        await uploadPhoto.mutateAsync({ file: next.file, signal: controller.signal, onProgress: (progress) => update(next.key, { progress }) });
        drop(next.key);
        toast(fill(p.photos.uploaded, { name: next.file.name }));
      } catch (raw) {
        const error = toAppError(raw);
        if (error.code === 'UPLOAD_CANCELLED') drop(next.key);
        // The photo may or may not have arrived: the list is read again (the hook does) before Retry is offered.
        else update(next.key, { state: error.outcomeUnknown ? 'unknown' : 'failed', error });
      }
    }
    current.current = null;
    running.current = false;
  };

  const add = (files: FileList | File[]) => {
    let space = room;
    const added: Upload[] = [];
    for (const file of Array.from(files)) {
      counter.current += 1;
      const early = checkFile(file, 'photo');
      if (space <= 0) added.push({ key: counter.current, file, progress: 0, state: 'failed', error: new AppError({ code: 'IMAGE_LIMIT', status: 409 }) });
      else if (early) added.push({ key: counter.current, file, progress: 0, state: 'failed', error: new AppError({ code: early, status: 400 }) });
      else {
        added.push({ key: counter.current, file, progress: 0, state: 'waiting' });
        space -= 1;
      }
    }
    setUploads((list) => [...list, ...added]);
    queue.current.push(...added.filter((u) => u.state === 'waiting'));
    void run();
  };

  const retry = (upload: Upload) => {
    update(upload.key, { state: 'waiting', error: undefined, progress: 0 });
    queue.current.push(upload);
    void run();
  };

  const cancel = (upload: Upload) => {
    if (upload.state === 'sending') current.current?.abort();
    else {
      queue.current = queue.current.filter((u) => u.key !== upload.key);
      drop(upload.key);
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= photos.length || from === to) return;
    const ids = photos.map((photo) => photo.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved as string);
    order.mutate(ids, { onSuccess: () => toast(p.photos.reordered) });
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files.length) add(event.dataTransfer.files);
  };

  return (
    <section aria-labelledby="photos-heading" className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6">
      <h2 id="photos-heading" className="type-h3 text-ink">
        {p.steps.photos}
      </h2>
      {room > 0 ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn('grid justify-items-center gap-2 rounded-1 border px-4 py-6 text-center', dragOver ? 'border-ink bg-sunken' : 'border-control')}
        >
          <ImagePlus aria-hidden="true" strokeWidth={1.5} className="size-8 text-ink-2" />
          <p className="font-medium text-ink">{p.photos.add}</p>
          <p className="type-small text-ink-2">{p.photos.dropHelp}</p>
          <input
            ref={input}
            type="file"
            multiple
            accept={UPLOAD_RULES.photo.accept}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              if (event.target.files?.length) add(event.target.files);
              event.target.value = '';
            }}
          />
          <Button type="button" variant="secondary" onClick={() => input.current?.click()}>
            {p.photos.choose}
          </Button>
        </div>
      ) : (
        <Banner tone="info">{p.photos.full}</Banner>
      )}

      {uploads.length ? (
        <ul className="grid gap-3" aria-label={p.photos.uploads}>
          {uploads.map((upload) => (
            <UploadRow key={upload.key} upload={upload} t={t} onCancel={() => cancel(upload)} onRetry={() => retry(upload)} />
          ))}
        </ul>
      ) : null}

      {order.error ? <ErrorMessage text={messageFor(toAppError(order.error), t)} requestId={requestIdOf(order.error)} t={t} /> : null}

      <ul className="grid gap-3" aria-label={p.photos.list}>
        {photos.map((photo, index) => (
          <PhotoRow key={photo.id} lang={lang} product={product} photo={photo} index={index} count={photos.length} busy={order.isPending} onMove={move} />
        ))}
      </ul>
      <p className="type-small text-muted-foreground">{p.photos.help}</p>
      <div className="flex justify-end">
        <Button asChild>
          <Link href={`/${lang}/vendor/products/${product.id}?step=review`} className="no-underline">
            {p.continue}
          </Link>
        </Button>
      </div>
    </section>
  );
}

function UploadRow({ upload, t, onCancel, onRetry }: { upload: Upload; t: Messages; onCancel: () => void; onRetry: () => void }) {
  const p = t.product.photos;
  const percent = Math.round(upload.progress * 100);
  return (
    <li className={cn('grid gap-2 rounded-1 border p-3', upload.state === 'failed' ? 'border-error' : 'border-line')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 truncate font-medium text-ink">
          {upload.file.name} <span className="font-normal text-ink-2">· {formatSize(upload.file.size)}</span>
        </p>
        <div className="flex gap-2">
          {upload.state === 'failed' && upload.error?.code !== 'IMAGE_LIMIT' && upload.error?.code !== 'FILE_TOO_LARGE' && upload.error?.code !== 'FILE_TYPE_NOT_ALLOWED' ? (
            <Button type="button" variant="secondary" size="small" onClick={onRetry}>
              {p.retry}
              <span className="sr-only">: {upload.file.name}</span>
            </Button>
          ) : null}
          <Button type="button" variant="quiet" size="small" onClick={onCancel}>
            {upload.state === 'failed' || upload.state === 'unknown' ? p.dismiss : t.common.cancel}
            <span className="sr-only">: {upload.file.name}</span>
          </Button>
        </div>
      </div>
      {upload.state === 'sending' || upload.state === 'waiting' ? (
        <>
          <div className="h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className="h-full bg-ink" style={{ width: `${percent}%` }} />
          </div>
          <p role="status" className="type-small text-ink-2 tabular-nums">
            {upload.state === 'waiting' ? p.waiting : fill(p.uploading, { percent })}
          </p>
        </>
      ) : null}
      {upload.state === 'failed' && upload.error ? <p className="type-small text-error">{messageFor(upload.error, t)}</p> : null}
      {upload.state === 'unknown' ? <p className="type-small text-ink">{p.unknown}</p> : null}
    </li>
  );
}

function PhotoRow({ lang, product, photo, index, count, busy, onMove }: { lang: Locale; product: ProductView; photo: Photo; index: number; count: number; busy: boolean; onMove: (from: number, to: number) => void }) {
  const t = getMessages(lang);
  const p = t.product.photos;
  const toast = useToast();
  const change = useChangePhoto(product.id);
  const removePhoto = useDeletePhoto(product.id);
  const [alt, setAlt] = useState(photo.altText ?? '');
  const label = index === 0 ? p.main : fill(p.number, { number: index + 1 });
  const altId = `photo-alt-${photo.id}`;
  const error = change.error ?? removePhoto.error;
  return (
    <li
      draggable
      onDragStart={(event) => event.dataTransfer.setData('text/plain', String(index))}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const from = Number(event.dataTransfer.getData('text/plain'));
        if (Number.isInteger(from) && !event.dataTransfer.files.length) {
          event.preventDefault();
          event.stopPropagation();
          onMove(from, index);
        }
      }}
      className="grid gap-3 rounded-1 border border-line p-3 sm:grid-cols-[96px_minmax(0,1fr)_auto]"
    >
      <PhotoFrame src={myPhotoSrc(product.id, photo.id, 'thumb')} alt={photo.altText ?? ''} unavailable={t.product.photoUnavailable} className="w-24" />
      <div className="grid content-start gap-2">
        <p className="font-medium text-ink">{label}</p>
        <form
          className="grid gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            change.mutate({ imageId: photo.id, altText: alt.trim() || null }, { onSuccess: () => toast(p.altSaved) });
          }}
        >
          <label htmlFor={altId} className="type-label text-ink">
            {p.alt} <span className="font-normal text-muted-foreground">{t.form.optional}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <Input id={altId} value={alt} maxLength={200} onChange={(event) => setAlt(event.target.value)} className="min-w-0 flex-1 lg:h-10" aria-describedby={`${altId}-help`} />
            <Button type="submit" variant="secondary" size="small" loading={change.isPending} disabled={alt === (photo.altText ?? '')}>
              {p.saveAlt}
              <span className="sr-only">: {label}</span>
            </Button>
          </div>
          <p id={`${altId}-help`} className="type-small text-muted-foreground">
            {p.altHelp}
          </p>
        </form>
        {error ? <ErrorMessage text={messageFor(toAppError(error), t)} requestId={requestIdOf(error)} t={t} /> : null}
      </div>
      <div className="flex flex-wrap items-start gap-1 sm:flex-col sm:items-end">
        <Button type="button" variant="secondary" size="small" disabled={busy || index === 0} onClick={() => onMove(index, index - 1)}>
          <ArrowUp aria-hidden="true" />
          <span className="sr-only">
            {p.up}: {label}
          </span>
        </Button>
        <Button type="button" variant="secondary" size="small" disabled={busy || index === count - 1} onClick={() => onMove(index, index + 1)}>
          <ArrowDown aria-hidden="true" />
          <span className="sr-only">
            {p.down}: {label}
          </span>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" size="small" disabled={removePhoto.isPending}>
              {p.remove}
              <span className="sr-only">: {label}</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{p.removeTitle}</AlertDialogTitle>
              <AlertDialogDescription>{fill(p.removeBody, { name: label })}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
              <AlertDialogAction variant="destructiveConfirm" onClick={() => removePhoto.mutate(photo.id, { onSuccess: () => toast(p.removed) })}>
                {p.remove}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}
