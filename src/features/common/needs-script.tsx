import type { Messages } from '@/lib/i18n';

/**
 * Login, account and the vendor and admin tools need JavaScript. Where it cannot run, the page says so plainly instead
 * of showing controls that do nothing (D-12).
 */
export function NeedsScript({ t }: { t: Messages }) {
  return (
    <noscript>
      <p className="rounded-md border p-3 text-sm">{t.noScript.interactive}</p>
    </noscript>
  );
}
