import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LoginForm } from '@/features/auth/login-form';
import { LanguageSwitch } from '@/features/common/language-switch';
import { NeedsScript } from '@/features/common/needs-script';
import { getMessages, isLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? getMessages(lang).login.title : undefined, robots: { index: false, follow: false } };
}

/** One login page for everyone (Document 2, D2-04; Document 5, section 6.4). Not indexed (D4-04). */
export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getMessages(lang);
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-4 py-8">
      <header className="flex items-center justify-between">
        <a href={`/${lang}`} className="text-xl font-semibold">
          {t.site.wordmark}
        </a>
        <LanguageSwitch lang={lang} />
      </header>
      <NeedsScript t={t} />
      <LoginForm lang={lang} />
    </main>
  );
}
