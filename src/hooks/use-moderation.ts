'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, send } from '@/lib/http';
import type { CategoryNode } from '@/types/catalogue';
import type { Page } from '@/types/common';
import type { ModerationRow, ModerationView } from '@/types/product';
import { withQuery, type Query } from '@/utils/url';

/** Product moderation (backend Area 3b, section 7), through our /api/moderation endpoints. */
export const moderationKeys = { list: (query: Query) => ['moderation', 'list', query] as const, one: (id: string) => ['moderation', id] as const };

export const useQueue = (query: Query) =>
  useQuery({ queryKey: moderationKeys.list(query), queryFn: () => get<Page<ModerationRow>>(withQuery('/api/moderation/products', query)), staleTime: 30_000 });

export const useForReview = (id: string) =>
  useQuery({ queryKey: moderationKeys.one(id), queryFn: () => get<ModerationView>(`/api/moderation/products/${encodeURIComponent(id)}`), staleTime: 0 });

/** The public category tree, for showing a category's name and path. */
export const useCategoryTree = () => useQuery({ queryKey: ['catalogue', 'tree'], queryFn: () => get<{ items: CategoryNode[] }>('/api/catalogue/categories'), staleTime: 600_000 });

export function useDecision(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ decision, body }: { decision: 'approve' | 'reject'; body: Record<string, unknown> }) => send<ModerationView>(`/api/moderation/products/${encodeURIComponent(id)}/${decision}`, body),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['moderation'] }),
  });
}

export const reviewPhotoSrc = (id: string, imageId: string, size: 'thumb' | 'medium' | 'large' = 'medium') =>
  `/api/moderation/products/${encodeURIComponent(id)}/images/${encodeURIComponent(imageId)}/file?size=${size}`;
