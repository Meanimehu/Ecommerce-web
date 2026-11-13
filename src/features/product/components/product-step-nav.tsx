'use client';

import { Steps, type Step } from '@/components/common/steps';
import { fill } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { addProductPath, myProductPath } from '@/lib/routes';
import {
  PRODUCT_STEPS,
  ProductStep,
  productStepFor,
  type ProductView,
} from '@/features/product/types';

/**
 * The step bar of the product form, with "step 2 of 5" for screen readers. A step is done when
 * nothing it fixes is missing (the review step never is). Before the draft exists only the first
 * step is shown.
 */
export function ProductStepNav({
  lang,
  product,
  currentStep,
}: {
  lang: Locale;
  product: ProductView | null;
  currentStep: ProductStep;
}) {
  const productMessages = useMessages().product;
  const stepMessages = productMessages.steps;
  const missing = product?.missing ?? [];
  const isStepDone = (step: ProductStep) =>
    product !== null &&
    step !== ProductStep.Review &&
    !missing.some((missingItem) => productStepFor(missingItem) === step);
  const stepPath = (step: ProductStep) =>
    product ? myProductPath(lang, product.id, step) : addProductPath(lang);
  const steps: Step[] = PRODUCT_STEPS.map((step) => ({
    key: step,
    label: stepMessages[step],
    short: stepMessages.short[step],
    href: stepPath(step),
    done: isStepDone(step),
  }));

  return (
    <>
      <Steps
        steps={product ? steps : steps.slice(0, 1)}
        current={currentStep}
        label={stepMessages.label}
        doneLabel={stepMessages.done}
      />
      <p className="sr-only">
        {fill(productMessages.stepOf, {
          step: PRODUCT_STEPS.indexOf(currentStep) + 1,
          count: PRODUCT_STEPS.length,
          name: stepMessages[currentStep],
        })}
      </p>
    </>
  );
}
