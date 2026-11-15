import { expect, type Page } from '@playwright/test';

/**
 * The first-load page-size budget (Document 6, section 14; owner, 14 Nov 2026, limits raised 15 Nov
 * 2026 for the storefront header). Bytes as
 * transferred, after compression, with headers, on an empty cache. Photos and API data are not
 * counted.
 *
 * - Everything except fonts (document, styles, scripts): the same limit in every language.
 * - Fonts for the page language: their own limit. A Hindi page needs Noto Sans Devanagari as well
 *   as Outfit, so it may be heavier than an English page by its fonts only.
 * - An English page also stays within the 307 KB total.
 * - On an English page, the Hindi font loaded on demand (for the "हिन्दी" link or a vendor's Hindi
 *   text) is reported on its own and not counted (Document 6, section 14, item 4, open).
 */
const KB = 1024;
const WITHOUT_FONTS_LIMIT_KB = 265;
const FONTS_LIMIT_KB = 150;
const ENGLISH_TOTAL_LIMIT_KB = 307;
const COUNTED = new Set(['document', 'stylesheet', 'script', 'font']);

type Part = { bytes: number; isFont: boolean; isOnDemand: boolean };

export type FirstLoad = { withoutFonts: number; fonts: number; onDemandFont: number };

/**
 * Starts counting the page's downloads. Call it before `goto`, and call what it returns once the
 * page has settled (`waitUntil: 'networkidle'`).
 */
export function countFirstLoad(page: Page, lang: 'en' | 'hi'): () => Promise<FirstLoad> {
  const parts: Promise<Part>[] = [];
  page.on('requestfinished', (request) => {
    const type = request.resourceType();
    if (!COUNTED.has(type)) return;
    const isFont = type === 'font';
    const isOnDemand = lang === 'en' && isFont && request.url().includes('devanagari');
    parts.push(
      request.sizes().then((sizes) => ({
        bytes: sizes.responseBodySize + sizes.responseHeadersSize,
        isFont,
        isOnDemand,
      })),
    );
  });
  return async () => {
    const all = await Promise.all(parts);
    const sum = (keep: (part: Part) => boolean) =>
      all.filter(keep).reduce((total, part) => total + part.bytes, 0);
    return {
      withoutFonts: sum((part) => !part.isFont),
      fonts: sum((part) => part.isFont && !part.isOnDemand),
      onDemandFont: sum((part) => part.isOnDemand),
    };
  };
}

/** Checks one page against the budget, and logs its figures so a change in size is seen. */
export function expectWithinBudget(path: string, lang: 'en' | 'hi', load: FirstLoad) {
  const total = load.withoutFonts + load.fonts;
  const inKb = (bytes: number) => (bytes / KB).toFixed(1);
  console.log(
    `${path} first load: ${inKb(total)} KB (without fonts ${inKb(load.withoutFonts)} KB, fonts ${inKb(load.fonts)} KB); ` +
      `Hindi font on demand: ${inKb(load.onDemandFont)} KB`,
  );
  expect(load.withoutFonts, `${path}: everything except fonts`).toBeLessThanOrEqual(
    WITHOUT_FONTS_LIMIT_KB * KB,
  );
  expect(load.fonts, `${path}: fonts`).toBeLessThanOrEqual(FONTS_LIMIT_KB * KB);
  if (lang === 'en')
    expect(total, `${path}: total`).toBeLessThanOrEqual(ENGLISH_TOTAL_LIMIT_KB * KB);
}
