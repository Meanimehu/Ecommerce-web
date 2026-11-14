import { notFound } from 'next/navigation';
import { SiteHeader } from '@/features/layout/components/site-header';
import { isLocale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';

/** Slice 0: a placeholder that proves the app builds, runs and deploys. The storefront home is built in Slice 3. */
export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const messages = getMessages(lang);
  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto grid w-full max-w-[1200px] gap-4 px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="type-h2 max-w-[30ch] text-ink">{messages.site.underConstruction}</h1>
      </main>
    </>
  );
}
