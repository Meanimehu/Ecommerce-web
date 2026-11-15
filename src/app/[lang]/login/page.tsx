import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NeedsScript } from '@/components/common/needs-script';
import { SiteFooter } from '@/features/layout/components/site-footer';
import { SiteHeader } from '@/features/layout/components/site-header';
import { isLocale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';
import { LoginForm } from '@/features/auth/components/login-form';

export const dynamic = 'force-dynamic';

interface LoginPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const { lang } = await params;
  const title = isLocale(lang) ? getMessages(lang).login.title : undefined;
  return { title, robots: { index: false, follow: false } };
}

/** One login page for everyone (D2-04). Not indexed (D4-04). */
export default async function LoginPage({ params }: LoginPageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const messages = getMessages(lang);
  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto grid w-full max-w-[452px] gap-4 px-4 py-8 sm:py-12">
        <NeedsScript messages={messages} />
        <LoginForm lang={lang} />
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
