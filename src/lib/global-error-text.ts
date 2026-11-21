/**
 * The last-resort error page's three lines, the same words as the English catalogue's
 * `errorPage.title`, `errorPage.body` and `errors.tryAgain`. They are copied here because Next.js
 * puts that page's code into every page's browser files: importing the catalogue there sent all
 * of it to every page, in every language (found in Slice 4; Document 6, section 14).
 * `tests/unit/messages.test.ts` checks that the copies still match the catalogue.
 */
export const GLOBAL_ERROR_TEXT = {
  title: 'Something went wrong',
  body: "This page couldn't be shown. Please try again.",
  tryAgain: 'Try again',
} as const;
