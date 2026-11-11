'use client';

import { Shirt } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils/cn';

/**
 * A product photo in its frame (Document 6, 12.1): 4:5, the complete photo fitted and centred on sunken, never cropped,
 * with its space reserved so nothing moves when it arrives. A missing or failed photo shows a garment line icon and
 * "Photo unavailable".
 */
export function PhotoFrame({ src, alt, unavailable, className, eager = false }: { src: string | null; alt: string; unavailable: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn('relative aspect-[4/5] overflow-hidden rounded-1 bg-sunken', className)}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- the backend makes the sizes; Next.js image processing is not used (D3-04)
        <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" className="size-full object-contain" onError={() => setFailed(true)} />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-1 p-2 text-center text-ink-2">
          <Shirt aria-hidden="true" strokeWidth={1.5} className="size-8" />
          <span className="type-caption">{unavailable}</span>
        </div>
      )}
    </div>
  );
}
