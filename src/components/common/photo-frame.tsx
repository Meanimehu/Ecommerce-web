'use client';

import { Shirt } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';

/**
 * A product photo in its frame (Document 6, 12.1): 4:5, the complete photo fitted and centred on sunken, never cropped,
 * with its space reserved so nothing moves when it arrives. A missing or failed photo shows a garment line icon and
 * "Photo unavailable".
 */
export function PhotoFrame({
  src,
  srcSet,
  sizes,
  alt,
  unavailable,
  className,
  eager = false,
  dimmed = false,
}: {
  src: string | null;
  /** Larger renditions for wide screens, with their `sizes`. */
  srcSet?: string;
  sizes?: string;
  alt: string;
  unavailable: string;
  className?: string;
  eager?: boolean;
  /** Out of stock or unavailable: the photo is dimmed to 60% (Document 6, 8.6); the placeholder text never is. */
  dimmed?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const photoImage = useRef<HTMLImageElement>(null);
  // A photo rendered on the server can fail before the page's scripts run, so its error event is missed: check once.
  useEffect(() => {
    const image = photoImage.current;
    if (image?.complete && image.naturalWidth === 0) setFailed(true);
  }, [src]);
  return (
    <div className={cn('relative aspect-[4/5] overflow-hidden rounded-1 bg-sunken', className)}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- the backend makes the sizes; Next.js image processing is not used (D3-04)
        <img
          ref={photoImage}
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className={cn('size-full object-contain', dimmed && 'opacity-60')}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-1 p-2 text-center text-ink-2">
          <Shirt aria-hidden="true" strokeWidth={1.5} className="size-8" />
          <span className="type-caption">{unavailable}</span>
          {alt ? <span className="sr-only">{alt}</span> : null}
        </div>
      )}
    </div>
  );
}
