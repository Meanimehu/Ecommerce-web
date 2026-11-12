import type { NextRequest } from 'next/server';
import { logoutRoute } from '@/features/auth/server/logout';

/** POST /api/auth/logout: ends this session at the backend. */
export const POST = (request: NextRequest) => logoutRoute(request, false);
