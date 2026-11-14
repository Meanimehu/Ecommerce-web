import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { callBackend, pickClientAddress } from '@/api/client';

describe("the customer's address (Document 3, section 3)", () => {
  it('takes the last entry, the one the host wrote, and ignores what the browser put before it', () => {
    expect(pickClientAddress('6.6.6.6, 203.0.113.7')).toBe('203.0.113.7');
    expect(pickClientAddress('203.0.113.7')).toBe('203.0.113.7');
    expect(pickClientAddress('2001:db8::1')).toBe('2001:db8::1');
  });
  it('accepts only a real IP address', () => {
    expect(pickClientAddress('203.0.113.7, not-an-ip')).toBeUndefined();
    expect(pickClientAddress('')).toBeUndefined();
    expect(pickClientAddress(null)).toBeUndefined();
  });
});

describe('every backend call carries it', () => {
  afterEach(() => vi.restoreAllMocks());
  const ok = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

  it('adds X-Forwarded-For when there is an address', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok());
    await callBackend({
      method: 'GET',
      path: '/x',
      kind: 'view',
      schema: z.object({ ok: z.boolean() }),
      fetchImpl,
      clientAddress: '203.0.113.7',
    });
    expect((fetchImpl.mock.calls[0]?.[1] as RequestInit).headers).toMatchObject({
      'x-forwarded-for': '203.0.113.7',
    });
  });

  it('sends none when there is no address (locally)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok());
    await callBackend({
      method: 'GET',
      path: '/x',
      kind: 'view',
      schema: z.object({ ok: z.boolean() }),
      fetchImpl,
    });
    expect((fetchImpl.mock.calls[0]?.[1] as RequestInit).headers).not.toHaveProperty(
      'x-forwarded-for',
    );
  });
});
