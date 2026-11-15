import { SearchX } from 'lucide-react';
import type { Metadata } from 'next';
import { notoDevanagari, outfit, outfitExtended } from '@/lib/fonts';
import en from '@/messages/en.json';
import hi from '@/messages/hi.json';
import './globals.css';
import { homePath } from '@/lib/routes';

/**
 * "Not found" with a real 404, for any address no page answers and for every notFound() (Document 4, sections 5 and 10;
 * Document 6, section 10). Our pages sit under a language segment, so Next.js uses this one global page, which cannot
 * know the language from the address: it says the same in English and in Hindi, with a way to each home page.
 */
export const metadata: Metadata = { title: `${en.notFound.title} · Dhaaga` };

export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${outfitExtended.variable} ${notoDevanagari.variable}`}
    >
      <body>
        <main className="mx-auto grid w-full max-w-[640px] px-4 py-12">
          <div className="grid justify-items-center gap-6 rounded-1 border border-dashed border-control bg-surface px-6 py-10 text-center">
            <SearchX aria-hidden="true" strokeWidth={1.5} className="size-8 text-ink-2" />
            <section className="grid justify-items-center gap-3">
              <h1 className="type-h3 text-ink">{en.notFound.title}</h1>
              <p className="text-muted-foreground">{en.notFound.body}</p>
              {/* A full page load on purpose: this page is outside the app's router. */}
              <a
                href={homePath('en')}
                className="inline-flex h-12 items-center rounded-2 bg-madder px-5 font-medium text-white no-underline hover:bg-madder-hover lg:h-11"
              >
                {en.notFound.home}
              </a>
            </section>
            <section
              lang="hi"
              className="grid justify-items-center gap-3 border-t border-line pt-6"
            >
              <h2 className="type-h3 text-ink">{hi.notFound.title}</h2>
              <p className="text-muted-foreground">{hi.notFound.body}</p>
              {/* A full page load on purpose: this page is outside the app's router. */}
              <a
                href={homePath('hi')}
                className="inline-flex h-12 items-center rounded-2 border border-control bg-surface px-5 font-medium text-ink no-underline hover:border-ink lg:h-11"
              >
                {hi.notFound.home}
              </a>
            </section>
          </div>
        </main>
      </body>
    </html>
  );
}
