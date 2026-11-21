import { fill } from '@/lib/errors';
import type { Locale, Messages } from '@/lib/i18n';
import type { CouponRequestStep, RequestActor } from '@/features/coupon/types';
import { whenText } from './coupon-text';

/**
 * A coupon request's history, oldest first (area-5-sales-cart-coupons.md, part 4, `timeline`):
 * who did what, in which round, when, and any note. Who is named in the reader's words (the vendor
 * reads "You", staff read "The vendor"); a step the frontend does not know is shown by the
 * backend's word.
 */
export function RequestHistory({
  steps,
  lang,
  actors,
  messages,
}: {
  steps: readonly CouponRequestStep[];
  lang: Locale;
  actors: Record<RequestActor, string>;
  messages: Messages;
}) {
  const requestMessages = messages.coupon.requests;
  const actions = requestMessages.actions as Record<string, string>;
  return (
    <ol className="grid gap-3">
      {steps.map((step) => (
        <li key={step.id} className="grid gap-1 border-s-2 border-line ps-4">
          <p className="text-ink">
            <span className="font-medium">{actors[step.actorKind]}</span>{' '}
            {actions[step.action] ?? step.action}
          </p>
          <p className="type-small text-ink-2">
            {whenText(step.createdAt, lang, '')} ·{' '}
            {fill(requestMessages.round, { revision: step.revision })}
          </p>
          {step.note ? <p className="type-small text-ink">{step.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}
