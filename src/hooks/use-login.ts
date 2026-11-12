'use client';

import { useMutation } from '@tanstack/react-query';
import { send } from '@/lib/http';
import type { Locale } from '@/lib/i18n';
import type { AddNotice } from './use-cart';

/** Logging in by phone code (Document 2, section 3): ask for a code, then check it. Calls our /api/auth endpoints. */
export const useRequestCode = () =>
  useMutation({ mutationFn: (phone: string) => send<{ resendAfterSeconds: number }>('/api/auth/code', { phone }) });

export const useVerify = () =>
  useMutation({ mutationFn: (input: { phone: string; code: string; lang: Locale }) => send<{ destination: string; pendingAdd?: AddNotice }>('/api/auth/verify', input) });
