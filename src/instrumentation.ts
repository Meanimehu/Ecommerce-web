/** Runs once when a server process starts. */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startStoreMonitor } = await import('./server/store/monitor');
    startStoreMonitor();
  }
}
