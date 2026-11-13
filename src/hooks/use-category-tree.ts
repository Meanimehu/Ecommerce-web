'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/http';
import type { CategoryNode } from '@/types/catalogue';

/**
 * The public category tree, for showing a category's name and path. It waits here until `storefront`, which owns
 * the endpoint, takes it (Document 7, 20.13, step 8).
 */
export const useCategoryTree = () => useQuery({ queryKey: ['catalogue', 'tree'], queryFn: () => get<{ items: CategoryNode[] }>('/api/catalogue/categories'), staleTime: 600_000 });
