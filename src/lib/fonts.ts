import localFont from 'next/font/local';

/**
 * Outfit for Latin text and every digit (Document 6, 5.1; D6-06, D6-07; Document 7, section 9), served from our own site
 * from the published npm package, with a size-matched fallback so text does not jump when the font arrives. It is not
 * preloaded: Firefox did not reuse the preloaded files and downloaded each one twice (about 41 KB more, seen in CI).
 * The browser starts the download as soon as it reads the page's styles. Its extended Latin set (it holds the rupee sign) is loaded by the browser only when such a
 * character is on the page. Hindi text uses Noto Sans Devanagari, loaded the same way (globals.css).
 * Next.js needs every value here written out literally, and a font-family set here must match the exported name.
 */
export const outfit = localFont({
  src: [
    { path: '../../node_modules/@fontsource/outfit/files/outfit-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../node_modules/@fontsource/outfit/files/outfit-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../node_modules/@fontsource/outfit/files/outfit-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-outfit',
  display: 'swap',
  preload: false,
  declarations: [
    { prop: 'font-family', value: 'Outfit' },
    {
      prop: 'unicode-range',
      value: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
    },
  ],
});

export const outfitExtended = localFont({
  src: [
    { path: '../../node_modules/@fontsource/outfit/files/outfit-latin-ext-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../node_modules/@fontsource/outfit/files/outfit-latin-ext-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../node_modules/@fontsource/outfit/files/outfit-latin-ext-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-outfit-extended',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: 'font-family', value: 'Outfit' },
    {
      prop: 'unicode-range',
      value: 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
    },
  ],
});

/**
 * Noto Sans Devanagari for Hindi text (D6-06). Its character range is Devanagari only and it is not preloaded, so a
 * browser downloads it only when Hindi text is on the page: on every Hindi page, and on an English page only when it
 * shows Hindi text such as a vendor's title (D6-21).
 */
export const notoDevanagari = localFont({
  src: [
    { path: '../../node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-devanagari',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: 'font-family', value: 'notoDevanagari' },
    { prop: 'unicode-range', value: 'U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20F0,U+25CC,U+A830-A839,U+A8E0-A8FF,U+11B00-11B09' },
  ],
});
