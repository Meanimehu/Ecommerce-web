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
  /**
   * Header in which the hosting's front door gives the customer's address, for example "x-forwarded-for". Empty locally.
   * Set per host in staging and production (Document 4, section 4).
   */
  get clientAddressHeader(): string | undefined {
    return process.env.CLIENT_ADDRESS_HEADER?.trim().toLowerCase() || undefined;
  },
};
