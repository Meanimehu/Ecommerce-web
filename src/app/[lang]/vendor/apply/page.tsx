import { ApplyScreen } from '@/components/vendor/apply-screen';
import { VendorArea } from '@/components/vendor/vendor-area';
import { isLocale } from '@/lib/i18n';

/** Become a vendor (Document 5, section 7.1): open to any logged-in person. */
export default async function ApplyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return (
    <VendorArea langParam={lang} needsVendor={false}>
      {isLocale(lang) ? <ApplyScreen lang={lang} /> : null}
    </VendorArea>
  );
}
