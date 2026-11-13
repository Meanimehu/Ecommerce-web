'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/common/toast';
import { BackendErrorCode } from '@/lib/error-codes';
import type { AppError } from '@/lib/errors';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { vendorApplyPath } from '@/lib/routes';
import type { Vendor } from '@/features/vendor/types';
import { useSubmitMyVendor } from './use-vendor';

/**
 * Submitting the application (Document 5, section 7.1): the terms must be accepted first, and the
 * submit sends the terms version the person saw. If the terms changed meanwhile, the box is
 * cleared so the person accepts the new version. The screen, `review-step.tsx`, only draws.
 */
export function useVendorSubmit({ lang, vendor }: { lang: Locale; vendor: Vendor }) {
  const messages = useMessages();
  const router = useRouter();
  const toast = useToast();
  const submitMyVendor = useSubmitMyVendor();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitError, setSubmitError] = useState<AppError | null>(null);

  function submitApplication() {
    setSubmitError(null);
    submitMyVendor.mutate(vendor.requiredTermsVersion, {
      onSuccess: showSubmitted,
      onError: showSubmitError,
    });
  }

  function showSubmitted() {
    toast(messages.vendor.review.submitted);
    router.push(vendorApplyPath(lang));
  }

  function showSubmitError(error: AppError) {
    if (error.code === BackendErrorCode.TermsVersionMismatch) setTermsAccepted(false);
    setSubmitError(error);
  }

  return {
    termsAccepted,
    setTermsAccepted,
    submitApplication,
    submitError,
    isSubmitting: submitMyVendor.isPending,
  };
}
