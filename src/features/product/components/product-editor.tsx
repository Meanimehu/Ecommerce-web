'use client';

import { useSearchParams } from 'next/navigation';
import { Banner } from '@/components/ui/banner';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myProductsPath } from '@/lib/routes';
import { useMyVendor } from '@/features/vendor/hooks/use-vendor';
import { VendorStatus } from '@/features/vendor/types';
import { useDictionaries, useMyProduct } from '@/features/product/hooks/use-product';
import {
  canEditProduct,
  ProductStatus,
  ProductStep,
  productStepToShow,
  type Dictionaries,
  type ProductView,
} from '@/features/product/types';
import { AttributesStep } from './attributes-step';
import { BasicsStep } from './basics-step';
import { PhotosStep } from './photos-step';
import { ProductStatusChip } from './product-status-chip';
import { ProductStepNav } from './product-step-nav';
import { ProductSummary } from './product-summary';
import { ReviewStep } from './review-step';
import { VariantsStep } from './variants-step';

/**
 * Add or edit a product (Document 5, section 7.3; approved Stage 5): five steps, saved as a draft
 * after the first (basics, attributes, variants, photos, review), with the step in the address. A
 * product in review or live is shown read-only: an approved product is changed through a revision
 * (Slice 4). A rejected product shows the moderator's reason at the top. A vendor that is not
 * approved sees everything and changes nothing (Document 5, section 7.5).
 */
export function ProductEditor({ lang, id }: { lang: Locale; id: string | null }) {
  const messages = useMessages();
  const productMessages = messages.product;
  const searchParams = useSearchParams();
  const dictionaries = useDictionaries();
  const myVendor = useMyVendor();
  const myProduct = useMyProduct(id);
  const isLoading =
    dictionaries.isPending || myVendor.isPending || (id !== null && myProduct.isPending);
  const loadError = dictionaries.error ?? myVendor.error ?? (id !== null ? myProduct.error : null);
  const crumbs = [
    { label: productMessages.title, href: myProductsPath(lang) },
    { label: id ? (myProduct.data?.title ?? productMessages.product) : productMessages.add },
  ];

  function reloadAll() {
    void Promise.all([dictionaries.refetch(), myVendor.refetch(), id ? myProduct.refetch() : null]);
  }

  function editorBody() {
    if (isLoading) return <LoadingBlock messages={messages} lines={6} />;
    if (loadError) return <PartError error={loadError} onRetry={reloadAll} messages={messages} />;
    // Loaded: the dictionaries are there, and the product too when there is one.
    const loadedDictionaries = dictionaries.data as Dictionaries;
    const isVendorApproved = myVendor.data?.status === VendorStatus.Approved;
    if (!id) {
      return (
        <NewProduct
          lang={lang}
          dictionaries={loadedDictionaries}
          isVendorApproved={isVendorApproved}
        />
      );
    }
    return (
      <ExistingProduct
        lang={lang}
        product={myProduct.data as ProductView}
        dictionaries={loadedDictionaries}
        isVendorApproved={isVendorApproved}
        askedStep={searchParams.get('step')}
      />
    );
  }

  return (
    <div className="grid max-w-[880px] gap-5">
      <Breadcrumbs label={messages.nav.breadcrumbs} items={crumbs} />
      {!id ? <h1 className="type-h2 stitch-bottom pb-3 text-ink">{productMessages.add}</h1> : null}
      {editorBody()}
    </div>
  );
}

/** A product that is not made yet: only the first step, and only for an approved vendor. */
function NewProduct({
  lang,
  dictionaries,
  isVendorApproved,
}: {
  lang: Locale;
  dictionaries: Dictionaries;
  isVendorApproved: boolean;
}) {
  // A vendor that is not approved cannot start a product; the Vendor area's banner says why.
  if (!isVendorApproved) return null;
  return (
    <div className="grid gap-5">
      <ProductStepNav lang={lang} product={null} currentStep={ProductStep.Basics} />
      <BasicsStep lang={lang} product={null} dictionaries={dictionaries} />
    </div>
  );
}

function ExistingProduct({
  lang,
  product,
  dictionaries,
  isVendorApproved,
  askedStep,
}: {
  lang: Locale;
  product: ProductView;
  dictionaries: Dictionaries;
  isVendorApproved: boolean;
  askedStep: string | null;
}) {
  const messages = useMessages();
  const productMessages = messages.product;
  const currentStep = productStepToShow(askedStep, product.missing);
  const isEditable = isVendorApproved && canEditProduct(product.status);
  const hasModeratorReason =
    Boolean(product.statusReason) &&
    (product.status === ProductStatus.Rejected || product.status === ProductStatus.Unpublished);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 stitch-bottom pb-3">
        <h1 className="type-h2 text-ink">{product.title}</h1>
        <ProductStatusChip status={product.status} messages={messages} />
      </div>
      {hasModeratorReason ? (
        <Banner tone="error" title={productMessages.moderatorReason}>
          {/* The moderator's own words, as the backend sends them. */}
          <p className="whitespace-pre-line">{product.statusReason}</p>
        </Banner>
      ) : null}
      <ProductNotice status={product.status} />
      {isEditable ? (
        <>
          <ProductStepNav lang={lang} product={product} currentStep={currentStep} />
          <CurrentStep
            lang={lang}
            step={currentStep}
            product={product}
            dictionaries={dictionaries}
          />
        </>
      ) : (
        <ProductSummary product={product} dictionaries={dictionaries} />
      )}
    </div>
  );
}

/**
 * Why the product cannot be changed now because of its status. A vendor that is not approved is
 * told once, by the Vendor area's banner (Document 5, section 7.5).
 */
function ProductNotice({ status }: { status: ProductStatus }) {
  const productMessages = useMessages().product;
  if (status === ProductStatus.Submitted) {
    return <Banner tone="info">{productMessages.inReview}</Banner>;
  }
  if (status === ProductStatus.Approved) {
    return <Banner tone="success">{productMessages.live}</Banner>;
  }
  return null;
}

function CurrentStep({
  lang,
  step,
  product,
  dictionaries,
}: {
  lang: Locale;
  step: ProductStep;
  product: ProductView;
  dictionaries: Dictionaries;
}) {
  switch (step) {
    case ProductStep.Basics:
      return <BasicsStep lang={lang} product={product} dictionaries={dictionaries} />;
    case ProductStep.Attributes:
      return <AttributesStep lang={lang} product={product} dictionaries={dictionaries} />;
    case ProductStep.Variants:
      return <VariantsStep lang={lang} product={product} dictionaries={dictionaries} />;
    case ProductStep.Photos:
      return <PhotosStep lang={lang} product={product} />;
    case ProductStep.Review:
      return <ReviewStep lang={lang} product={product} />;
  }
}
