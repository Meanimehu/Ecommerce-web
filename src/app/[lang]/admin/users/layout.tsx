import type { ReactNode } from 'react';
import { ADMIN_SCREEN_SECTIONS } from '@/lib/messages';
import { ScreenText } from '@/features/layout/components/screen-text';

/** The text of this Admin screen only (lib/messages.ts, ADMIN_SCREEN_SECTIONS). */
export default async function AdminUsersLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <ScreenText langParam={lang} sections={ADMIN_SCREEN_SECTIONS.users}>
      {children}
    </ScreenText>
  );
}
