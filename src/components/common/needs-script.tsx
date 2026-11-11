import { Banner } from '@/components/ui/banner';
import type { Messages } from '@/lib/i18n';

/**
 * Login, account and the vendor and admin tools need JavaScript. Where it cannot run, the page says so plainly instead
 * of showing controls that do nothing (D-12).
 */
export function NeedsScript({ t }: { t: Messages }) {
  return (
    <noscript>
      <Banner tone="warning">{t.noScript.interactive}</Banner>
    </noscript>
  );
}
