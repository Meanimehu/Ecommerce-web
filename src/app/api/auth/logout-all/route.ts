import type { NextRequest } from 'next/server';
import { logoutRoute } from '@/features/auth/server/session';

/** POST /api/auth/logout-all: ends every session of the person at the backend. */
export const POST = (request: NextRequest) => logoutRoute(request, true);
