import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { adminNav } from '@/components/auth/area-menus';
import { AreaShell } from '@/components/auth/area-shell';
import { requireUser } from '@/components/auth/require-user';
import { getMessages } from '@/lib/i18n';
import { isStaff } from '@/types/auth';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Admin area: any staff role (Document 2, section 5; Document 5, section 4). Each screen narrows this further. */
export default async function AdminLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang: param } = await params;
  const result = await requireUser(param, (user) => isStaff(user.roles));
  if ('render' in result) return result.render;
  return (
    <AreaShell lang={result.lang} area="admin" nav={adminNav(result.lang, getMessages(result.lang), result.user.roles)}>
      {children}
    </AreaShell>
  );
}
