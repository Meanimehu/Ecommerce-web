'use client';

import { useMutation } from '@tanstack/react-query';
import { send } from '@/lib/http';
import type { Locale } from '@/lib/i18n';
import type { AddNotice } from './use-cart';

/** Logging in by phone code (Document 2, section 3), through our /api/auth endpoints. */

export interface LoginCodeSent {
  resendAfterSeconds: number;
}

export interface VerifyLoginCodeInput {
  phone: string;
  code: string;
  lang: Locale;
}

export interface LoggedIn {
  /** Where to go next: the page the person asked for, or the default for their role (D2-03). */
  destination: string;
  /** The result of an "Add to cart" made before logging in, when there was one (D2-02). */
  pendingAdd?: AddNotice;
}

export function useRequestLoginCode() {
  return useMutation({
    mutationFn: (phone: string) => send<LoginCodeSent>('/api/auth/code', { phone }),
  });
}

export function useVerifyLoginCode() {
  return useMutation({
    mutationFn: (input: VerifyLoginCodeInput) => send<LoggedIn>('/api/auth/verify', input),
  });
}
