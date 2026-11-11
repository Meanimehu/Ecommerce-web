/** The frontend's own health check (Document 4, section 4): 200 while the server can serve pages. */
export const dynamic = 'force-dynamic';

export function GET(): Response {
  return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}
