import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AppError, messageFor } from '@/lib/errors';
import { getMessages } from '@/lib/messages';
import { callBackend } from '@/api/client';

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
const backendError = (status: number, code: string, details?: Record<string, unknown>) => json(status, { error: { code, message: 'backend text', details, requestId: 'req-1' } });
const noSleep = async () => undefined;
const Schema = z.object({ ok: z.literal(true) });

describe('the backend client (Document 3; D7-01, D7-10)', () => {
  it('retries a safe read after a server error, then succeeds', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(backendError(503, 'X')).mockResolvedValueOnce(json(200, { ok: true }));
    const result = await callBackend({ method: 'GET', path: '/x', kind: 'view', schema: Schema, fetchImpl, sleep: noSleep });
    expect(result.data).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('retries a read at most twice', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(backendError(502, 'X'));
    await expect(callBackend({ method: 'GET', path: '/x', kind: 'view', schema: Schema, fetchImpl, sleep: noSleep })).rejects.toBeInstanceOf(AppError);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('never retries a save, and marks a server error on a save as an unknown outcome', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(backendError(503, 'X'));
    const error = await callBackend({ method: 'POST', path: '/x', kind: 'save', schema: Schema, fetchImpl, sleep: noSleep }).catch((e: unknown) => e);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(error).toMatchObject({ status: 503, outcomeUnknown: true });
  });

  it('a timeout on a save is an unknown outcome with the D7-10 save message; on a view, the view message', async () => {
    const timeout = vi.fn().mockRejectedValue(new DOMException('t', 'TimeoutError'));
    const save = (await callBackend({ method: 'POST', path: '/x', kind: 'save', schema: Schema, fetchImpl: timeout, sleep: noSleep }).catch((e: unknown) => e)) as AppError;
    expect(save).toMatchObject({ code: 'TIMEOUT', outcomeUnknown: true });
    expect(timeout).toHaveBeenCalledTimes(1);
    const t = getMessages('en');
    expect(messageFor(save, t)).toBe("We couldn't confirm your change. Please check before trying again.");
    const view = (await callBackend({ method: 'GET', path: '/x', kind: 'view', schema: Schema, fetchImpl: timeout, sleep: noSleep }).catch((e: unknown) => e)) as AppError;
    expect(messageFor(view, t)).toBe('Something went wrong. Please try again.');
  });

  it('waits the backend time on "too many requests" for a read', async () => {
    const sleep = vi.fn(noSleep);
    const fetchImpl = vi.fn().mockResolvedValueOnce(backendError(429, 'RATE', { retryAfterSeconds: 2 })).mockResolvedValueOnce(json(200, { ok: true }));
    await callBackend({ method: 'GET', path: '/x', kind: 'view', schema: Schema, fetchImpl, sleep });
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it('decides by code, keeps the request id, and drops a database constraint name (backend gap B1)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(backendError(409, 'CODE_TAKEN', { constraint: 'coupons_code_key', field: 'code' }));
    const error = (await callBackend({ method: 'POST', path: '/x', kind: 'save', schema: Schema, fetchImpl, sleep: noSleep }).catch((e: unknown) => e)) as AppError;
    expect(error.code).toBe('CODE_TAKEN');
    expect(error.requestId).toBe('req-1');
    expect(error.details).toEqual({ field: 'code' });
  });

  it('reads the field list of VALIDATION_FAILED (api-contract.md, section 3)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      json(400, { error: { code: 'VALIDATION_FAILED', message: 'Request validation failed', details: [{ field: 'email', messages: ['email must be an email'] }], requestId: 'r' } }),
    );
    const error = (await callBackend({ method: 'POST', path: '/x', kind: 'save', schema: Schema, fetchImpl, sleep: noSleep }).catch((e: unknown) => e)) as AppError;
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.fields).toEqual([{ field: 'email', messages: ['email must be an email'] }]);
    expect(error.details).toBeUndefined();
  });

  it('a response that does not match its schema is never passed on (D3-02)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchImpl = vi.fn().mockResolvedValue(json(200, { ok: 'yes', secret: 'data' }));
    const error = (await callBackend({ method: 'GET', path: '/x', kind: 'view', schema: Schema, fetchImpl, sleep: noSleep }).catch((e: unknown) => e)) as AppError;
    expect(error.code).toBe('RESPONSE_MISMATCH');
    expect(spy.mock.calls[0]?.[0]).toContain('"fields":["ok"]');
    expect(spy.mock.calls[0]?.[0]).not.toContain('data');
    spy.mockRestore();
  });

  it('extra fields from the backend are ignored', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(200, { ok: true, added: 1 }));
    expect((await callBackend({ method: 'GET', path: '/x', kind: 'view', schema: Schema, fetchImpl, sleep: noSleep })).data).toEqual({ ok: true });
  });

  it('an unknown code falls back to the general message for its kind (D-09)', () => {
    const t = getMessages('hi');
    expect(messageFor({ code: 'SOMETHING_NEW', status: 429 }, t)).toBe(t.errors.kinds.rateLimit);
    expect(messageFor({ code: 'OTP_INVALID', status: 400 }, t)).toBe(t.errors.codes.OTP_INVALID);
  });
});

describe('Document 3 alignment', () => {
  it('"too many requests" uses the backend wait from its headers, and the message says how long (section 5)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'TOO_MANY_REQUESTS', message: 'x', requestId: 'r' } }), { status: 429, headers: { 'x-ratelimit-reset': '42' } }),
    );
    const error = (await callBackend({ method: 'POST', path: '/x', kind: 'save', schema: Schema, fetchImpl, sleep: noSleep }).catch((e: unknown) => e)) as AppError;
    expect(error.details?.retryAfterSeconds).toBe(42);
    expect(messageFor(error, getMessages('en'))).toBe('Too many requests. Please wait a moment and try again. Please try again in 42 seconds.');
    expect(messageFor({ ...error, details: { retryAfterSeconds: 600 } }, getMessages('hi'))).toContain('कृपया 10 मिनट बाद फिर कोशिश करें।');
    // One, not "1 minutes" (Document 6, writing for the interface).
    expect(messageFor({ ...error, details: { retryAfterSeconds: 54 } }, getMessages('en'))).toContain('Please try again in 54 seconds.');
    expect(messageFor({ ...error, details: { retryAfterSeconds: 60 } }, getMessages('en'))).toContain('Please try again in 1 minute.');
    expect(messageFor({ ...error, details: { retryAfterSeconds: 1 } }, getMessages('en'))).toContain('Please try again in 1 second.');
  });

  it('a lost connection on a change is an unknown outcome: never "failed" (section 6, D7-10)', () => {
    expect(messageFor({ code: 'NETWORK', status: 0, outcomeUnknown: true }, getMessages('en'))).toBe("We couldn't confirm your change. Please check before trying again.");
    expect(messageFor({ code: 'NETWORK', status: 0 }, getMessages('en'))).toBe("We couldn't reach Dhaaga. Check your connection and try again.");
  });

  it('a schema mismatch says exactly what is wrong outside production (D3-02)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchImpl = vi.fn().mockResolvedValue(json(200, { ok: 'no' }));
    const error = (await callBackend({ method: 'GET', path: '/me', kind: 'view', schema: Schema, fetchImpl, sleep: noSleep }).catch((e: unknown) => e)) as AppError;
    expect(messageFor(error, getMessages('en'))).toBe('The answer of GET /me does not match its schema (fields: ok).');
    expect(fetchImpl).toHaveBeenCalledTimes(1); // never retried
    spy.mockRestore();
  });
});
