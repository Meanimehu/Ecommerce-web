'use client';

import Link from 'next/link';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { vendorApplyPath } from '@/lib/routes';
import { useMyVendor } from '@/features/vendor/hooks/use-vendor';
import { VendorStatus } from '@/features/vendor/types';
import { VendorStatusChip } from './vendor-status-chip';

/**
 * The vendor home's application line (Document 5, section 7.2): the application's status and what
 * it means, and, until it is approved, how many things it still needs and the way to it. The
 * application is reached from here, not from the menu (Document 8, Slice 4 notes). A part of its
 * own: if it fails, it says so in place.
 */
export function ApplicationSummary({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const homeMessages = messages.vendor.home;
  const myVendor = useMyVendor();
  if (myVendor.isPending) return <LoadingBlock messages={messages} lines={2} />;
  if (myVendor.isError) {
    return (
      <PartError
        error={myVendor.error}
        onRetry={() => void myVendor.refetch()}
        messages={messages}
      />
    );
  }
  const vendor = myVendor.data;
  if (!vendor) return null;
  const isApproved = vendor.status === VendorStatus.Approved;
  return (
    <section
      aria-labelledby="application-heading"
      className="grid gap-3 rounded-1 border border-line bg-surface p-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="application-heading" className="type-h4 text-ink">
          {messages.vendor.statusTitle}
        </h2>
        <VendorStatusChip status={vendor.status} messages={messages} />
      </div>
      <p className="text-ink">{messages.vendor.statusText[vendor.status]}</p>
      {isApproved ? null : (
        <div>
          <Link
            href={vendorApplyPath(lang)}
            className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
          >
            {homeMessages.openApplication}
          </Link>
        </div>
      )}
    </section>
  );
}
