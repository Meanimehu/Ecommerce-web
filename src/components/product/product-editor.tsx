'use client';

import { useSearchParams } from 'next/navigation';
import { Banner } from '@/components/ui/banner';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Steps, type Step } from '@/components/common/steps';
import { useDictionaries, useMyProduct } from '@/hooks/use-product';
import { useMyVendor } from '@/hooks/use-vendor';
import { fill } from '@/lib/errors';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import type { Dictionaries, ProductView } from '@/types/product';
import { AttributesStep } from './product-attributes';
import { BasicsStep } from './product-basics';
import { PhotosStep } from './product-photos';
import { ReviewStep } from './product-review';
import { canEditProduct, ProductStatusChip } from './product-status';
import { PRODUCT_STEPS, productStepFor, type ProductStep } from './product-steps';
import { ProductSummary } from './product-summary';
import { VariantsStep } from './product-variants';

/**
 * Add or edit a product (Document 5, section 7.3; approved Stage 5): five steps, saved as a draft after the first
 * (basics, attributes, variants, photos, review), with the step in the address. A product in review or live is shown
 * read-only: an approved product is changed through a revision (Slice 4). A rejected product shows the moderator's
 * reason at the top. A vendor that is not approved sees everything and changes nothing (Document 5, section 7.5).
 */
export function ProductEditor({ lang, id }: { lang: Locale; id: string | null }) {
  const t = useMessages();
  const p = t.product;
  const params = useSearchParams();
  const dictionaries = useDictionaries();
  const vendor = useMyVendor();
  const product = useMyProduct(id);
  const base = `/${lang}/vendor/products`;
  const crumbs = [{ label: p.title, href: base }, { label: id ? (product.data?.title ?? p.product) : p.add }];

  const loading = dictionaries.isPending || vendor.isPending || (id !== null && product.isPending);
  const failed = dictionaries.error ?? vendor.error ?? (id !== null ? product.error : null);
  let body;
  if (loading) body = <LoadingBlock t={t} lines={6} />;
  else if (failed) body = <PartError error={failed} onRetry={() => void Promise.all([dictionaries.refetch(), vendor.refetch(), id ? product.refetch() : null])} t={t} />;
  else {
    const dict = dictionaries.data as Dictionaries;
    const approved = vendor.data?.status === 'approved';
    if (!id) {
      body = approved ? (
        <div className="grid gap-5">
          <StepNav lang={lang} product={null} current="basics" />
          <BasicsStep lang={lang} product={null} dictionaries={dict} />
        </div>
      ) : (
        <Banner tone="info">{p.notApproved}</Banner>
      );
    } else {
      const view = product.data as ProductView;
      const asked = params.get('step');
      const step = (PRODUCT_STEPS as readonly string[]).includes(asked ?? '') ? (asked as ProductStep) : view.missing[0] ? productStepFor(view.missing[0]) : 'review';
      const editable = approved && canEditProduct(view.status);
      body = (
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 stitch-bottom pb-3">
            <h1 className="type-h2 text-ink">{view.title}</h1>
            <ProductStatusChip status={view.status} t={t} />
          </div>
          {view.statusReason && (view.status === 'rejected' || view.status === 'unpublished') ? (
            <Banner tone="error" title={p.moderatorReason}>
              {/* The moderator's own words, as the backend sends them. */}
              <p className="whitespace-pre-line">{view.statusReason}</p>
            </Banner>
          ) : null}
          {!approved ? <Banner tone="info">{p.notApproved}</Banner> : view.status === 'submitted' ? <Banner tone="info">{p.inReview}</Banner> : view.status === 'approved' ? <Banner tone="success">{p.live}</Banner> : null}
          {editable ? (
            <>
              <StepNav lang={lang} product={view} current={step} />
              {step === 'basics' ? <BasicsStep lang={lang} product={view} dictionaries={dict} /> : null}
              {step === 'attributes' ? <AttributesStep lang={lang} product={view} dictionaries={dict} /> : null}
              {step === 'variants' ? <VariantsStep lang={lang} product={view} dictionaries={dict} /> : null}
              {step === 'photos' ? <PhotosStep lang={lang} product={view} /> : null}
              {step === 'review' ? <ReviewStep lang={lang} product={view} /> : null}
            </>
          ) : (
            <ProductSummary product={view} dictionaries={dict} />
          )}
        </div>
      );
    }
  }

  return (
    <div className="grid max-w-[880px] gap-5">
      <Breadcrumbs label={t.nav.breadcrumbs} items={crumbs} />
      {!id ? <h1 className="type-h2 stitch-bottom pb-3 text-ink">{p.add}</h1> : null}
      {body}
    </div>
  );
}

function StepNav({ lang, product, current }: { lang: Locale; product: ProductView | null; current: ProductStep }) {
  const t = useMessages();
  const p = t.product;
  const missing = product?.missing ?? [];
  const done = (step: ProductStep) => product !== null && step !== 'review' && !missing.some((m) => productStepFor(m) === step);
  const steps: Step[] = PRODUCT_STEPS.map((key) => ({
    key,
    label: p.steps[key],
    short: p.steps.short[key],
    href: product ? `/${lang}/vendor/products/${product.id}?step=${key}` : `/${lang}/vendor/products/new`,
    done: done(key),
  }));
  return (
    <>
      <Steps steps={product ? steps : steps.slice(0, 1)} current={current} label={p.steps.label} doneLabel={p.steps.done} />
      <p className="sr-only">{fill(p.stepOf, { step: PRODUCT_STEPS.indexOf(current) + 1, count: PRODUCT_STEPS.length, name: p.steps[current] })}</p>
    </>
  );
}
