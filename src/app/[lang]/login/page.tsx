import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { NeedsScript } from '@/components/common/needs-script';
import { SiteHeader } from '@/components/common/site-header';
import { getMessages, isLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? getMessages(lang).login.title : undefined, robots: { index: false, follow: false } };
}

/** One login page for everyone (Document 2, D2-04; Document 5, section 6.4; approved Stage 5). Not indexed (D4-04). */
export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getMessages(lang);
  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto grid w-full max-w-[452px] gap-4 px-4 py-8 sm:py-12">
        <NeedsScript t={t} />
        <LoginForm lang={lang} />
      </main>
    </>
  );
}
