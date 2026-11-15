'use client';

import { useState } from 'react';
import { PhotoFrame } from '@/components/common/photo-frame';
import { fill } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import type { ProductImage } from '@/features/storefront/product-page/types';
import { cn } from '@/utils/cn';

/**
 * The product photos (Document 5, section 6.2; Document 6, 12.1): the chosen photo large in its
 * 4:5 frame (medium on compact, large on expanded), the others as a strip of 64 px thumbnails that
 * choose it. Every frame shows the whole photo (D6-55). Photos load from the public photo host
 * (D3-04).
 */
export function ProductGallery({ title, images }: { title: string; images: ProductImage[] }) {
  const messages = useMessages();
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentImage = images[currentIndex];
  const altTextOf = (index: number) =>
    images[index]?.altText || fill(messages.store.photoOf, { title, number: index + 1 });
  return (
    <div className="grid gap-3">
      <PhotoFrame
        key={currentIndex}
        src={currentImage?.urls.medium ?? null}
        srcSet={
          currentImage
            ? `${currentImage.urls.medium} 800w, ${currentImage.urls.large} 1600w`
            : undefined
        }
        sizes="(min-width: 1024px) 58vw, 100vw"
        alt={currentImage ? altTextOf(currentIndex) : ''}
        unavailable={messages.common.photoUnavailable}
        eager
      />
      {images.length > 1 ? (
        <ul className="flex flex-wrap gap-2" aria-label={messages.store.photos}>
          {images.map((image, index) => (
            <li key={image.urls.thumb}>
              <button
                type="button"
                aria-pressed={index === currentIndex}
                aria-label={altTextOf(index)}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'block w-16 rounded-1 border-2 transition-colors duration-100',
                  index === currentIndex ? 'border-ink' : 'border-transparent hover:border-control',
                )}
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
