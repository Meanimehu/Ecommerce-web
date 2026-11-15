import type { Messages } from '@/lib/i18n';

/**
 * The home hero (Document 6, 12.4; Document 5, D5-16 and D5-17), as its approved text-only
 * fallback: the headline and one line on the `sunken` ground, with no illustration, no empty frame
 * and no button. The photo the admin chooses comes once its storage (T7-8) and the vendor's
 * permission are settled; until then the lines are those of the approved Stage 5 screens, which the
 * owner may replace (Document 8, Slice 3 notes). No claim is added (Document 6, 17.1).
 */
export function HomeHero({ messages }: { messages: Messages }) {
  return (
    <section className="rounded-1 bg-sunken px-6 py-10 sm:px-10 sm:py-14">
      <h1 className="max-w-[20ch] type-h1 text-ink">{messages.store.heroTitle}</h1>
      <p className="mt-3 max-w-[48ch] text-ink-2">{messages.store.heroText}</p>
    </section>
  );
}
