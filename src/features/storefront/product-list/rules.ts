import type { CategoryNode } from './types';

/**
 * The small rules of the product lists. This file has no Zod and imports only types, so a public
 * page that uses a rule does not load Zod (about 31 KB) into the browser (Document 7, section 16).
 * The answer schemas stay in `types.ts`, used by the server.
 */

/** How the category page orders its products. Filters and other orders come in Slice 3. */
export enum ProductSort {
  Newest = 'newest',
}

// ---- Where a category sits ----

/** The node with this id or slug, and the path from the top level down to it. */
export function findInTree(
  nodes: readonly CategoryNode[],
  isWanted: (node: CategoryNode) => boolean,
  parents: CategoryNode[] = [],
): CategoryNode[] | null {
  for (const node of nodes) {
    if (isWanted(node)) return [...parents, node];
    const found = findInTree(node.children, isWanted, [...parents, node]);
    if (found) return found;
  }
  return null;
}
