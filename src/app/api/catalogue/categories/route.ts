import * as catalogueApi from '@/api/catalogue';
import { answerPublic } from '@/middleware/endpoint';

/** GET /api/catalogue/categories: the public category tree (area-3a-catalogue.md); fresh for 10 minutes (Document 7, section 12). */
export const dynamic = 'force-dynamic';

export function GET() {
  return answerPublic(() => catalogueApi.getCategoryTree(), 600);
}
