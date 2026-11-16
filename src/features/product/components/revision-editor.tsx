'use client';

import { ErrorSummary } from '@/components/form/error-summary';
import { Form } from '@/components/form/form';
import { Button } from '@/components/ui/button';
import { useMessages } from '@/lib/messages-context';
import { useRevisionAttributesForm } from '@/features/product/hooks/use-revision-attributes-form';
import { useRevisionDetailsForm } from '@/features/product/hooks/use-revision-details-form';
import type { Attribute } from '@/features/catalogue/types';
import {
  findCategoryChoice,
  RevisionPhotoState,
  sortedPhotos,
  type Dictionaries,
  type ProductView,
  type Revision,
} from '@/features/product/types';
import { AttributeFields, attributeFieldIds } from './attribute-fields';
import { BasicsFields } from './basics-fields';
import { RevisionPhotos } from './revision-photos';

/**
 * Editing a revision (Document 5, section 7.3): the details, the attributes of the proposed
 * category and the photos, each saved on its own. The first save starts the revision; the live
 * product does not change. It only draws; what each part sends is in its hook.
 */
const DETAIL_FIELD_IDS = {
  title: 'revision-title',
  categoryId: 'revision-category',
  brandId: 'revision-brand',
  description: 'revision-description',
  hsnCode: 'revision-hsn',
  gstRateBps: 'revision-gst',
} as const;

export function RevisionEditor({
  product,
  revision,
  dictionaries,
}: {
  product: ProductView;
  revision: Revision | null;
  dictionaries: Dictionaries;
}) {
  const categoryId = revision?.content.categoryId ?? product.categoryId;
  const attributes = findCategoryChoice(dictionaries.categories, categoryId)?.category.attributes;
  // Before the first change there is no revision: the gallery is the live product's photos.
  const gallery = revision ?? {
    images: sortedPhotos(product.images).map((photo) => ({
      ...photo,
      state: RevisionPhotoState.Live,
    })),
    removed: [],
  };

  return (
    <div className="grid gap-5">
      <DetailsForm product={product} revision={revision} dictionaries={dictionaries} />
      {attributes && attributes.length > 0 ? (
        // A new category asks for new attributes: the form starts again when it changes.
        <AttributesForm
          key={categoryId}
          product={product}
          revision={revision}
          attributes={attributes}
        />
      ) : null}
      <RevisionPhotos productId={product.id} gallery={gallery} />
    </div>
  );
}

const FORM_CLASS = 'grid gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6';

function DetailsForm({
  product,
  revision,
  dictionaries,
}: {
  product: ProductView;
  revision: Revision | null;
  dictionaries: Dictionaries;
}) {
  const messages = useMessages();
  const revisionMessages = messages.product.revision;
  const details = useRevisionDetailsForm({ product, revision, dictionaries });
  const { form } = details;

  return (
    <Form
      className={FORM_CLASS}
      onSubmit={form.handleSubmit(details.saveDetails, details.showValidationErrors)}
    >
      <h3 className="type-h3 text-ink">{revisionMessages.detailsTitle}</h3>
      <ErrorSummary
        form={form}
        fieldIds={DETAIL_FIELD_IDS}
        messages={messages}
        requestId={details.requestId}
        focusSignal={details.focusSignal}
      />
      <BasicsFields
        form={form}
        fieldIds={DETAIL_FIELD_IDS}
        categoryChoices={details.categoryChoices}
        chosenCategory={details.chosenCategory}
        dictionaries={dictionaries}
      />
      <div>
        <Button type="submit" loading={details.isSaving}>
          {revisionMessages.saveDetails}
        </Button>
      </div>
    </Form>
  );
}

function AttributesForm({
  product,
  revision,
  attributes,
}: {
  product: ProductView;
  revision: Revision | null;
  attributes: readonly Attribute[];
}) {
  const messages = useMessages();
  const revisionMessages = messages.product.revision;
  const attributesForm = useRevisionAttributesForm({ product, revision, attributes });
  const { form } = attributesForm;

  return (
    <Form
      className={FORM_CLASS}
      onSubmit={form.handleSubmit(
        attributesForm.saveAttributes,
        attributesForm.showValidationErrors,
      )}
    >
      <h3 className="type-h3 text-ink">{revisionMessages.attributesTitle}</h3>
      <ErrorSummary
        form={form}
        fieldIds={attributeFieldIds(attributes)}
        messages={messages}
        requestId={attributesForm.requestId}
        focusSignal={attributesForm.focusSignal}
      />
      <AttributeFields form={form} attributes={attributes} />
      <div>
        <Button type="submit" loading={attributesForm.isSaving}>
          {revisionMessages.saveAttributes}
        </Button>
      </div>
    </Form>
  );
}
