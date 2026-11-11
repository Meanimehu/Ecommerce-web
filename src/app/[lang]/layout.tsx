import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { notoDevanagari, outfit, outfitExtended } from '@/lib/fonts';
import { getMessages, isLocale, LOCALES } from '@/lib/i18n';
import { Providers } from './providers';
import '../globals.css';

// Only /en and /hi exist (Document 4, D4-01). Any other first segment is a real 404.
export const dynamicParams = false;

export function generateStaticParams(): { lang: string }[] {
  return LOCALES.map((lang) => ({ lang }));
}

type Props = { children: ReactNode; params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  // Indexing rules and alternate-language addresses arrive with the storefront pages (Document 4, sections 6 and 8).
  return { title: getMessages(lang).site.title, robots: { index: false, follow: false } };
}

export default async function LanguageLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang} className={`${outfit.variable} ${outfitExtended.variable} ${notoDevanagari.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
