import 'server-only';
import { callBackend, openBackendFile } from '@/api/client';
import type { Query } from '@/utils/url';
import {
  ModerationPageSchema,
  ModerationViewSchema,
  type ApproveProductBody,
  type PhotoSize,
  type ProductDecision,
  type RejectProductBody,
} from '@/features/product/types';

/**
 * Backend Area 3b, moderation (area-3b-products.md, section 7): moderator and admin. Nobody
 * reviews their own vendor's products.
 */
const reviewProductPath = (id: string) => `/moderation/products/${encodeURIComponent(id)}`;

export const listReviewQueue = (token: string, query: Query) =>
  callBackend({
    method: 'GET',
    path: '/moderation/products',
    query,
    kind: 'view',
    token,
    schema: ModerationPageSchema,
  });

export const getProductForReview = (token: string, id: string) =>
  callBackend({
    method: 'GET',
    path: reviewProductPath(id),
    kind: 'view',
    token,
    schema: ModerationViewSchema,
  });

/**
 * Approve takes seenUpdatedAt (and confirmTax when the vendor declared the tax); reject takes
 * seenUpdatedAt and a reason.
 */
export const decideProduct = (
  token: string,
  id: string,
  decision: ProductDecision,
  body: ApproveProductBody | RejectProductBody,
) =>
  callBackend({
    method: 'POST',
    path: `${reviewProductPath(id)}/${decision}`,
    kind: 'save',
    token,
    body,
    schema: ModerationViewSchema,
  });

/** A photo under review, in one of the stored sizes. */
export const openReviewPhoto = (token: string, id: string, imageId: string, size: PhotoSize) =>
  openBackendFile({
    path: `${reviewProductPath(id)}/images/${encodeURIComponent(imageId)}/file?size=${encodeURIComponent(size)}`,
    token,
  });
