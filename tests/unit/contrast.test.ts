import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Slice 6a (D6-50; Document 6, section 4.7): the contrast of every token pair the design uses, from
 * the colour values in `globals.css`. Each pair must reach its ratio (4.5 to 1 for text, 3 to 1 for
 * control borders and the focus ring) and must still match the ratio Document 6 records, so a
 * changed colour cannot pass unnoticed. The combinations real screens make are checked by axe in
 * the end-to-end tests (`tests/e2e/accessibility.spec.ts`).
 */
const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

/** The `--kora-*` colours, by their name without the prefix. */
const tokens = Object.fromEntries(
  Array.from(css.matchAll(/--kora-([a-z0-9-]+):\s*(#[0-9a-f]{6});/gi), (match) => [
    match[1],
    match[2],
  ]),
) as Record<string, string>;
const WHITE = '#ffffff';

function colourOf(name: string): string {
  if (name === 'white') return WHITE;
  const value = tokens[name];
  if (!value) throw new Error(`no colour token --kora-${name}`);
  return value;
}

/** WCAG 2.x relative luminance of a #rrggbb colour. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  ) as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: string, second: string): number {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((one, two) => two - one) as [
    number,
    number,
  ];
  return (lighter + 0.05) / (darker + 0.05);
}

const TEXT = 4.5;
const BOUNDARY = 3;

/** Foreground, background, the ratio it needs, and the ratio Document 6 (4.7) records. */
const PAIRS: [string, string, number, number][] = [
  ['ink', 'surface', TEXT, 13.36],
  ['ink', 'page', TEXT, 12.33],
  ['ink', 'sunken', TEXT, 11.26],
  ['ink-2', 'surface', TEXT, 8.76],
  ['ink-2', 'page', TEXT, 8.08],
  ['ink-2', 'sunken', TEXT, 7.38],
  ['muted', 'surface', TEXT, 6.02],
  ['muted', 'page', TEXT, 5.56],
  ['muted', 'sunken', TEXT, 5.08],
  ['control', 'surface', BOUNDARY, 4.12],
  ['control', 'page', BOUNDARY, 3.8],
  ['white', 'madder', TEXT, 7.47],
  ['white', 'madder-hover', TEXT, 9.29],
  ['white', 'madder-press', TEXT, 11.23],
  ['madder', 'surface', TEXT, 7.16],
  ['madder', 'page', TEXT, 6.6],
  ['madder', 'sunken', TEXT, 6.03],
  ['madder-hover', 'surface', TEXT, 8.9],
  ['madder-hover', 'sunken', TEXT, 7.5],
  ['success', 'success-fill', TEXT, 5.6],
  ['success', 'surface', TEXT, 6.44],
  ['success', 'sunken', TEXT, 5.43],
  ['warning', 'warning-fill', TEXT, 6.28],
  ['warning', 'surface', TEXT, 7.09],
  ['warning', 'sunken', TEXT, 5.98],
  ['error', 'error-fill', TEXT, 4.76],
  ['error', 'surface', TEXT, 5.46],
  ['error', 'page', TEXT, 5.04],
  ['error', 'sunken', TEXT, 4.6],
  ['info', 'info-fill', TEXT, 5.95],
  ['info', 'surface', TEXT, 6.94],
  ['info', 'sunken', TEXT, 5.85],
  ['ink', 'sale', TEXT, 6.28],
  ['white', 'error', TEXT, 5.69],
  ['white', 'error-hover', TEXT, 7.15],
  ['white', 'ink', TEXT, 13.95],
  ['surface', 'ink', TEXT, 13.36],
];

/** A link inside a banner: madder on each semantic fill (Document 6: 6.13 to 6.34). */
const LINK_ON_FILLS = ['success-fill', 'warning-fill', 'error-fill', 'info-fill'];

describe('colour contrast of the design tokens (D6-50)', () => {
  it.each(PAIRS)(
    '%s on %s reaches %s to 1 (Document 6 records %s)',
    (fore, back, needs, recorded) => {
      const ratio = contrast(colourOf(fore), colourOf(back));
      expect(ratio).toBeGreaterThanOrEqual(needs);
      expect(Math.abs(ratio - recorded)).toBeLessThan(0.01);
    },
  );

  it.each(LINK_ON_FILLS)('a madder link on %s reaches 4.5 to 1', (fill) => {
    const ratio = contrast(colourOf('madder'), colourOf(fill));
    expect(ratio).toBeGreaterThanOrEqual(TEXT);
    expect(ratio).toBeGreaterThanOrEqual(6.13 - 0.005);
    expect(ratio).toBeLessThanOrEqual(6.34 + 0.005);
  });

  it('the focus ring (ink, with a surface halo) stands out on every ground it sits on', () => {
    expect(css).toContain('--kora-ring: 0 0 0 2px var(--kora-surface), 0 0 0 4px var(--kora-ink);');
    for (const ground of ['surface', 'page', 'sunken']) {
      expect(contrast(colourOf('ink'), colourOf(ground))).toBeGreaterThanOrEqual(BOUNDARY);
    }
  });

  it('every colour token is read, so a new or renamed token cannot slip past', () => {
    const named = new Set([...PAIRS.flatMap(([fore, back]) => [fore, back]), ...LINK_ON_FILLS]);
    // Lines and edges are decoration only (Document 6, 4.7): no text or control boundary.
    const decoration = ['line', 'success-edge', 'warning-edge', 'error-edge', 'info-edge'];
    const unchecked = Object.keys(tokens).filter(
      (name) => !named.has(name) && !decoration.includes(name),
    );
    expect(unchecked).toEqual([]);
  });
});
