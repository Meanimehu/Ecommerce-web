'use client';

import { useEffect, useRef, type RefObject } from 'react';

/** Makes a heading able to take focus from a script (not by Tab), then focuses it. */
function focusHeading(heading: HTMLElement | null | undefined) {
  if (!heading) return;
  if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
  heading.focus();
}

/** The section's own heading (not one inside a form), or else the page's main heading. */
function sectionHeading(section: HTMLElement | null): HTMLElement | null {
  const headings = Array.from(section?.querySelectorAll<HTMLElement>('h1, h2, h3') ?? []);
  return (
    headings.find((heading) => !heading.closest('form')) ??
    document.querySelector<HTMLElement>('main h1')
  );
}

/**
 * Focus for a form that opens in place of the button that opened it ("Add", "Edit"; Document 6,
 * section 11; WCAG 2.4.3). The button is gone once the form is drawn, so without this focus falls
 * to the page and a keyboard or screen reader user starts again from the top. When the form opens,
 * focus moves to its heading (or the section's, for a form with none); when it closes, to the
 * section's heading. Only a change counts: a
 * form that is already open when the page is drawn takes no focus.
 *
 * `openForm` is whatever names the open form (an id, "new", true), or null or false when none is.
 */
export function useInPlaceFormFocus(
  openForm: string | boolean | null,
  section: RefObject<HTMLElement | null>,
) {
  const shown = useRef(openForm);
  useEffect(() => {
    if (openForm === shown.current) return;
    shown.current = openForm;
    const isOpen = openForm !== null && openForm !== false;
    const formHeading = isOpen
      ? section.current?.querySelector<HTMLElement>('form h2, form h3')
      : null;
    focusHeading(formHeading ?? sectionHeading(section.current));
  }, [openForm, section]);
}
