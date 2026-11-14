'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { vendorApplyPath } from '@/lib/routes';
import { ApplyStep, DOCUMENT_TYPES, type Vendor } from '@/features/vendor/types';
import { DocumentRow } from './document-row';

/**
 * Step 3, documents (Document 5, section 7.1; approved Stage 5): one row per document type. Files
 * are private and open through our server.
 */
export function DocumentsStep({ lang, vendor }: { lang: Locale; vendor: Vendor }) {
  const messages = useMessages();
  return (
    <section
      aria-labelledby="documents-heading"
      className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id="documents-heading" className="type-h3 text-ink">
        {messages.vendor.steps.documents}
      </h2>
      <ul className="grid gap-3">
        {DOCUMENT_TYPES.map((type) => (
          <li key={type}>
            <DocumentRow vendor={vendor} type={type} />
          </li>
        ))}
      </ul>
      <p className="type-small text-muted-foreground">{messages.vendor.documents.help}</p>
      <div className="flex justify-end">
        <Button asChild>
          <Link href={vendorApplyPath(lang, ApplyStep.Review)} className="no-underline">
            {messages.vendor.continueStep}
          </Link>
        </Button>
      </div>
    </section>
  );
}
