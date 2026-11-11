import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * A whole-screen state (Document 6, section 10; approved Stage 5): error, no access, not found. A box with a 32 px line
 * icon, a title that says what happened, one sentence, and one way on.
 */
export function StateBlock({ icon: Icon, title, text, children, titleAs = 'h1' }: { icon: LucideIcon; title: string; text: string; children?: ReactNode; titleAs?: 'h1' | 'h2' }) {
  const Title = titleAs;
  return (
    <div className="grid justify-items-center gap-3 rounded-1 border border-dashed border-control bg-surface px-6 py-10 text-center">
      <Icon aria-hidden="true" strokeWidth={1.5} className="size-8 text-ink-2" />
      <Title className="type-h3 text-ink">{title}</Title>
      <p className="max-w-[60ch] text-muted-foreground">{text}</p>
      {children ? <div className="flex flex-wrap justify-center gap-3 pt-2">{children}</div> : null}
    </div>
  );
}
