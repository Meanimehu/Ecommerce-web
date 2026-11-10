import 'server-only';

/**
 * Settings read on the server only (Document 4, section 4: configuration through environment variables). Nothing here
 * is ever sent to the browser. Each value is read when first needed, so a build does not require runtime secrets.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing setting ${name}. See .env.example.`);
  return value;
}

function secret(name: string): string {
  const value = required(name);
  if (value.length < 32) throw new Error(`Setting ${name} must be at least 32 characters (openssl rand -hex 32).`);
  return value;
}

export const serverConfig = {
  get appEnv(): string {
    return process.env.APP_ENV ?? 'local';
  },
  get isProduction(): boolean {
    return (process.env.APP_ENV ?? 'local') === 'production';
  },
  get backendUrl(): string {
    return required('BACKEND_URL').replace(/\/$/, '');
  },
  /** This site's own origin, for example https://localhost:3001 (Document 7, section 17.1). */
  get siteOrigin(): string {
    return new URL(required('PUBLIC_SITE_URL')).origin;
  },
  get storeDatabaseUrl(): string | undefined {
    return process.env.STORE_DATABASE_URL || undefined;
  },
  get storeCheckIntervalMs(): number {
    const seconds = Number(process.env.STORE_CHECK_INTERVAL_SECONDS ?? 60);
    return (Number.isFinite(seconds) && seconds >= 5 ? seconds : 60) * 1000;
  },
  /** Signs the pending-add and after-login cookies (D4-07). */
  get cookieSecret(): string {
    return secret('COOKIE_SECRET');
  },
  /** Makes the anti-forgery tokens (Document 2, section 6; D7-13). */
  get csrfSecret(): string {
    return secret('CSRF_SECRET');
  },
  /** Keyed hash of refresh tokens in the store, and encryption of short-lived refresh results (Document 4, section 9). */
  get storeSecret(): string {
    return secret('STORE_SECRET');
  },
  /** The previous STORE_SECRET after a change, kept while markers made with it may still be needed (31 days). */
  get storeSecretPrevious(): string | undefined {
    return process.env.STORE_SECRET_PREVIOUS || undefined;
  },
};
