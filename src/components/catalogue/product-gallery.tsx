'use client';

import { useState } from 'react';
import { PhotoFrame } from '@/components/product/photo-frame';
import { fill } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import type { ProductDetail } from '@/types/catalogue';
import { cn } from '@/utils/cn';

/**
 * The product photos (Document 5, section 6.2; Document 6, 12.1): the chosen photo large in its 4:5 frame (medium on
 * compact, large on expanded), the others as a strip of 64 px thumbnails that choose it. Every frame shows the whole
 * photo (D6-55). Photos load from the public photo host (D3-04).
 */
export function ProductGallery({ title, images }: { title: string; images: ProductDetail['images'] }) {
  const t = useMessages();
  const [current, setCurrent] = useState(0);
  const shown = images[current];
  const altOf = (index: number) => images[index]?.altText || fill(t.store.photoOf, { title, number: index + 1 });
  return (
    <div className="grid gap-3">
      <PhotoFrame
        key={current}
        src={shown?.urls.medium ?? null}
        srcSet={shown ? `${shown.urls.medium} 800w, ${shown.urls.large} 1600w` : undefined}
        sizes="(min-width: 1024px) 58vw, 100vw"
        alt={shown ? altOf(current) : ''}
        unavailable={t.common.photoUnavailable}
        eager
      />
      {images.length > 1 ? (
        <ul className="flex flex-wrap gap-2" aria-label={t.store.photos}>
          {images.map((image, index) => (
            <li key={image.urls.thumb}>
              <button
                type="button"
                aria-pressed={index === current}
                aria-label={altOf(index)}
                onClick={() => setCurrent(index)}
                className={cn('block w-16 rounded-1 border-2 transition-colors duration-100', index === current ? 'border-ink' : 'border-transparent hover:border-control')}
              >
                <PhotoFrame src={image.urls.thumb} alt="" unavailable="" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
