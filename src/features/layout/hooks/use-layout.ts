'use client';

import { useMutation } from '@tanstack/react-query';
import { send } from '@/lib/http';
import type { Locale } from '@/lib/i18n';

/** The calls of `layout`, one hook per call, to our own endpoints (D3-03). */
const LANGUAGE_PATH = '/api/language';

/** Remembers the language the person chose with the switch (Document 4, section 6). */
export const useRememberLanguage = () =>
  useMutation({ mutationFn: (lang: Locale) => send<{ lang: Locale }>(LANGUAGE_PATH, { lang }) });
