# Trimmed font files

`noto-sans-devanagari-hindi-400.woff2` and `noto-sans-devanagari-hindi-500.woff2` are Noto Sans Devanagari, trimmed to the characters normal Hindi text uses (Document 6, section 14; Document 7, Q7-7). They leave out the Vedic signs and other rarely used marks, which saves about 10 KB per file. Text with a left-out character still shows: the browser takes that character from the fallback font.

- **Source:** `@fontsource/noto-sans-devanagari` 5.3.0, the files `noto-sans-devanagari-devanagari-400-normal.woff2` and `-500-normal.woff2`.
- **Licence:** SIL Open Font License 1.1, copied in `OFL.txt` as the licence asks.
- **Made with** fontTools 4.66.1 (`pip install fonttools brotli`), keeping every shaping rule:

  ```sh
  pyftsubset <source file> --unicodes="U+0900-097F,U+200C-200D,U+20A8,U+25CC,U+A830-A839" --layout-features='*' --flavor=woff2 --output-file=<file here>
  ```

- **The same character list** is the `unicode-range` in `src/lib/fonts.ts`. If one changes, the other changes with it.
- **When the package is updated,** the files are made again with the command above, and Hindi text is checked on screen against the full font. On 14 Nov 2026, 577 Hindi lines in both weights and ten page screenshots were pixel for pixel the same.
