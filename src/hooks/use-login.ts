'use client';

import { useMutation } from '@tanstack/react-query';
import { send } from '@/lib/http';
import type { Locale } from '@/lib/i18n';
import type { AddNotice } from '@/types/add-notice';

/** The two login calls (Document 2, section 3), to our own /api/auth endpoints. */

const LOGIN_PATHS = {
  requestCode: '/api/auth/code',
  verifyCode: '/api/auth/verify',
} as const;

export interface LoginCodeSent {
  resendAfterSeconds: number;
}

export interface VerifyLoginCodeInput {
  phone: string;
  code: string;
  lang: Locale;
}

export interface LoggedIn {
  /** Where to go next: the page the person asked for, else the default for their role (D2-03). */
  destination: string;
  /** What happened to an "Add to cart" made before logging in, when there was one (D2-02). */
  pendingAdd?: AddNotice;
}

export function useRequestLoginCode() {
  return useMutation({
    mutationFn: (phone: string) => send<LoginCodeSent>(LOGIN_PATHS.requestCode, { phone }),
  });
}

export function useVerifyLoginCode() {
  return useMutation({
    mutationFn: (input: VerifyLoginCodeInput) => send<LoggedIn>(LOGIN_PATHS.verifyCode, input),
  });
}
