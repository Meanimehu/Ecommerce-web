import { requireUser } from '@/features/auth/components/require-user';
import { AdminScreen, canUseAdminScreen } from '@/features/auth/staff-screens';
import { AuditLog } from '@/features/audit/components/audit-log';

/** The audit log (Document 5, section 8.3): admin only, read only. */
export default async function AuditLogPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  const result = await requireUser(langParam, (user) =>
    canUseAdminScreen(user.roles, AdminScreen.AuditLog),
  );
  if ('render' in result) return result.render;
  return <AuditLog lang={result.lang} />;
}
