/** Lists every key path whose value is text, for example "errors.viewTimeout". */
export function textKeys(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return [prefix];
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => textKeys(child, prefix ? `${prefix}.${key}` : key));
}

export interface CatalogueProblem {
  key: string;
  problem: string;
}

/**
 * Compares two catalogues. Every key must exist in both, hold text in both, and never be empty. Anything else in the
 * files (numbers, lists, null) is reported, because the catalogue holds text only.
 */
export function compareCatalogues(names: [string, string], a: unknown, b: unknown): CatalogueProblem[] {
  const problems: CatalogueProblem[] = [];
  const collect = (value: unknown, prefix: string, name: string): void => {
    if (typeof value === 'string') {
      if (value.trim() === '') problems.push({ key: prefix, problem: `empty text in ${name}` });
      return;
    }
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      problems.push({ key: prefix || '(root)', problem: `not text or a group in ${name}` });
      return;
    }
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) collect(child, prefix ? `${prefix}.${key}` : key, name);
  };
  collect(a, '', names[0]);
  collect(b, '', names[1]);
  const keysA = new Set(textKeys(a));
  const keysB = new Set(textKeys(b));
  for (const key of keysA) if (!keysB.has(key)) problems.push({ key, problem: `missing in ${names[1]}` });
  for (const key of keysB) if (!keysA.has(key)) problems.push({ key, problem: `missing in ${names[0]}` });
  return problems;
}
