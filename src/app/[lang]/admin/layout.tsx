import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AreaShell } from '@/features/auth/area-shell';
import { requireUser } from '@/features/auth/require-user';
import { isStaff } from '@/schemas/auth';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Admin area: any staff role (Document 2, section 5; Document 5, section 4). Each screen narrows this further. */
export default async function AdminLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang: param } = await params;
  const result = await requireUser(param, `/${param}/admin`, (user) => isStaff(user.roles));
  if ('render' in result) return result.render;
  return (
    <AreaShell lang={result.lang} area="admin">
      {children}
    </AreaShell>
  );
}
