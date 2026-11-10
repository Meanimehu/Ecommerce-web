import { storeStatus } from '@/server/store/monitor';

/**
 * The frontend's own health check (Document 4, section 4). It answers 200 while the server can serve pages. The store
 * status is shown as a yes or no only; the reasons stay in the server log.
 */
export const dynamic = 'force-dynamic';

export function GET(): Response {
  const store = storeStatus();
  return Response.json(
    { status: 'ok', store: { ok: store.ok, checkedAt: store.checkedAt } },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
