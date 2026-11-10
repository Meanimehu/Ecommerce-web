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
  get backendUrl(): string {
    return required('BACKEND_URL');
  },
  get storeDatabaseUrl(): string | undefined {
    return process.env.STORE_DATABASE_URL || undefined;
  },
  get storeCheckIntervalMs(): number {
    const seconds = Number(process.env.STORE_CHECK_INTERVAL_SECONDS ?? 60);
    return (Number.isFinite(seconds) && seconds >= 5 ? seconds : 60) * 1000;
  },
};
