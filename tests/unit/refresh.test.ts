import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/lib/errors';
import { refreshSession } from '@/features/auth/server/session';

const fresh = { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 86400 };

describe('refreshing a session (Document 4, section 9; D4-11)', () => {
  it('requests that arrive together share one refresh', async () => {
    let release: () => void = () => undefined;
    const backend = vi.fn(() => new Promise<typeof fresh>((resolve) => (release = () => resolve(fresh))));
    const first = refreshSession('token-a', backend);
    const second = refreshSession('token-a', backend);
    release();
    expect(await first).toEqual({ ok: true, cookies: fresh });
    expect(await second).toEqual({ ok: true, cookies: fresh });
    expect(backend).toHaveBeenCalledTimes(1);
  });

  it('a later request starts a new refresh (the backend accepts a repeat within 10 seconds)', async () => {
    const backend = vi.fn().mockResolvedValue(fresh);
    await refreshSession('token-b', backend);
    await refreshSession('token-b', backend);
    expect(backend).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['SESSION_ENDED', { ok: false, outcome: 'ended', reason: 'session' }],
    ['TOKEN_REUSED', { ok: false, outcome: 'ended', reason: 'session' }],
    ['USER_BLOCKED', { ok: false, outcome: 'ended', reason: 'blocked' }],
    ['TIMEOUT', { ok: false, outcome: 'temporary' }],
    ['SERVER_ERROR', { ok: false, outcome: 'temporary' }],
  ])('backend answer %s', async (code, expected) => {
    const backend = vi.fn().mockRejectedValue(new AppError({ code, status: code === 'TIMEOUT' ? 0 : 401 }));
    expect(await refreshSession(`token-${code}`, backend)).toEqual(expected);
  });

  it('anything unexpected logs nobody out', async () => {
    expect(await refreshSession('token-c', vi.fn().mockRejectedValue(new Error('boom')))).toEqual({ ok: false, outcome: 'temporary' });
  });
});
