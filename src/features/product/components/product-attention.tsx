'use client';

import { CountTile } from '@/components/common/count-tile';
import { PartError } from '@/components/common/load-states';
import { Skeleton } from '@/components/ui/skeleton';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myProductsPath } from '@/lib/routes';
import { withQuery } from '@/utils/url';
import { useMyProducts } from '@/features/product/hooks/use-product';
import { ProductStatus } from '@/features/product/types';

/**
 * The vendor home's product counts (Document 5, section 7.2): products waiting for review and
 * rejected products, each a link to the products list filtered to it. Each count is a part of its
 * own: if it fails, it says so in place and the rest of the home stays.
 */
const COUNT_ONLY = 1;

export function ProductAttention({ lang }: { lang: Locale }) {
  const attention = useMessages().product.attention;
  return (
    <>
      <ProductCount lang={lang} status={ProductStatus.Submitted} label={attention.waiting} />
      <ProductCount lang={lang} status={ProductStatus.Rejected} label={attention.rejected} />
    </>
  );
}

function ProductCount({
  lang,
  status,
  label,
}: {
  lang: Locale;
  status: ProductStatus;
  label: string;
}) {
  const messages = useMessages();
  const products = useMyProducts({ status, limit: COUNT_ONLY });
  if (products.isPending) return <Skeleton className="h-20" />;
  if (products.isError) {
    return (
      <PartError
        error={products.error}
        onRetry={() => void products.refetch()}
        messages={messages}
        title={label}
      />
    );
  }
  return (
    <CountTile
      count={products.data.total}
      label={label}
      href={withQuery(myProductsPath(lang), { status })}
    />
  );
}
