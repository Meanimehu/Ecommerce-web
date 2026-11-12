import type { ComponentProps } from 'react';

/**
 * The <form> every form uses (Document 7, section 20.6). It always posts: a tap before the page's
 * scripts load must never put what was typed (a phone number, a code) in the address, where
 * browser history and server logs keep it. The browser's own checks are off because our Zod
 * checks and the error summary run instead.
 */
export function Form(props: Omit<ComponentProps<'form'>, 'method' | 'noValidate'>) {
  return <form method="post" noValidate {...props} />;
}
