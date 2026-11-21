import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { requireUser } from '@/features/auth/components/require-user';
import { isStaff } from '@/features/auth/types';
import { AreaShell } from '@/features/layout/components/area-shell';
import { adminNav, StaffArea } from '@/features/layout/menus';
import { getMessages } from '@/lib/messages';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Admin area: any staff role (Document 2, section 5; Document 5, section 4). Each screen narrows this further, and each
 * screen's folder adds its own text (lib/messages.ts, ADMIN_SCREEN_SECTIONS).
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const result = await requireUser(langParam, (user) => isStaff(user.roles));
  if ('render' in result) return result.render;
  const { lang, user } = result;
  return (
    <AreaShell
      lang={lang}
      area={StaffArea.Admin}
      nav={adminNav(lang, getMessages(lang), user.roles)}
      sections={[]}
    >
      {children}
    </AreaShell>
  );
}
