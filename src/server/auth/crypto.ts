import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes, timingSafeEqual } from 'node:crypto';

export const b64url = (buffer: Buffer): string => buffer.toString('base64url');

export function hmac(key: Buffer | string, data: string | Buffer): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

/** A separate 32-byte key for each purpose, from one secret. */
export function deriveKey(secret: string, purpose: string): Buffer {
  return Buffer.from(hkdfSync('sha256', secret, 'dhaaga-web', purpose, 32));
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** AES-256-GCM. The output is iv, tag and ciphertext together. */
export function encrypt(key: Buffer, plain: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]);
}

export function decrypt(key: Buffer, sealed: Buffer): string {
  const decipher = createDecipheriv('aes-256-gcm', key, sealed.subarray(0, 12));
  decipher.setAuthTag(sealed.subarray(12, 28));
  return Buffer.concat([decipher.update(sealed.subarray(28)), decipher.final()]).toString('utf8');
}

export const randomId = (): string => b64url(randomBytes(16));

/** "payload.signature", both base64url. */
export function sign(key: Buffer | string, payload: unknown): string {
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  return `${body}.${b64url(hmac(key, body))}`;
}

export function unsign<T>(key: Buffer | string, value: string | undefined): T | null {
  if (!value) return null;
  const [body, signature, extra] = value.split('.');
  if (!body || !signature || extra !== undefined) return null;
  if (!safeEqual(signature, b64url(hmac(key, body)))) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}
