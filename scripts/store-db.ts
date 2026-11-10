import pg from 'pg';

export function storeUrl(): string {
  const url = process.env.STORE_DATABASE_URL;
  if (!url) throw new Error('STORE_DATABASE_URL is not set. See .env.example.');
  return url;
}

export async function withStore<T>(url: string, run: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 10000 });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}
