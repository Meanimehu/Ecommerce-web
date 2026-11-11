import { notFound } from 'next/navigation';
import { getMessages, isLocale } from '@/lib/i18n';

/** Slice 0: a blank page that proves the app builds, runs and deploys. The storefront home is built in Slice 3. */
export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getMessages(lang);
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-4">
      <p className="text-2xl font-semibold">{t.site.wordmark}</p>
      <h1 className="text-base">{t.site.underConstruction}</h1>
    </main>
  );
}
