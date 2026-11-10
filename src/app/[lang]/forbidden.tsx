'use client';

import { useParams } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';

/** The "you don't have access" page, sent with a real 403 (Document 2, section 4; Document 4, section 5). */
export default function Forbidden() {
  const params = useParams<{ lang: string }>();
  const lang = isLocale(params.lang) ? params.lang : 'en';
  const t = getMessages(lang);
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">{t.noAccess.title}</h1>
      <p>{t.noAccess.body}</p>
      <a href={`/${lang}`} className="underline underline-offset-4">
        {t.noAccess.home}
      </a>
    </main>
  );
}
