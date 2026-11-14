/** Query values for a list address. Empty values are left out, so equal requests look the same (Document 4, section 7). */
export type Query = Record<string, string | number | boolean | null | undefined>;

/** A path with its query string, keys in a fixed order. */
export function withQuery(path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(query ?? {}).sort()) {
    const value = query?.[key];
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}

/** A whole number from an address value such as ?page=2, or the fallback. */
export function pageNumber(value: string | string[] | null | undefined, fallback = 1): number {
  const text = Array.isArray(value) ? value[0] : value;
  const pageValue = Number(text);
  return Number.isInteger(pageValue) && pageValue >= 1 && pageValue <= 100_000
    ? pageValue
    : fallback;
}

/** Only the named values of an address's query, as the backend list takes them (unknown ones are refused there). */
export function pick(params: URLSearchParams, names: readonly string[]): Query {
  const query: Query = {};
  for (const name of names) {
    const value = params.get(name);
    if (value !== null && value !== '') query[name] = value;
  }
  return query;
}
