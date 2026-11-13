import 'server-only';
import { ModerationPageSchema, ModerationViewSchema } from '@/features/product/types';
import type { Query } from '@/utils/url';
import { callBackend, openBackendFile } from '@/api/client';

/** Backend Area 3b, moderation (area-3b-products.md, section 7): moderator and admin. Nobody reviews their own vendor. */
const product = (id: string) => `/moderation/products/${encodeURIComponent(id)}`;

export const listQueue = (token: string, query: Query) =>
  callBackend({ method: 'GET', path: '/moderation/products', query, kind: 'view', token, schema: ModerationPageSchema });

export const getForReview = (token: string, id: string) => callBackend({ method: 'GET', path: product(id), kind: 'view', token, schema: ModerationViewSchema });

/** approve takes seenUpdatedAt (and confirmTax when the vendor declared the tax); reject takes seenUpdatedAt and a reason. */
export const decide = (token: string, id: string, decision: 'approve' | 'reject', body: Record<string, unknown>) =>
  callBackend({ method: 'POST', path: `${product(id)}/${decision}`, kind: 'save', token, body, schema: ModerationViewSchema });

export const openReviewPhoto = (token: string, id: string, imageId: string, size: string) =>
  openBackendFile({ path: `${product(id)}/images/${encodeURIComponent(imageId)}/file?size=${encodeURIComponent(size)}`, token });
