// utils/errorRetry.ts
export async function retry<T>(fn: () => Promise<T>, attempts = 2, backoffMs = 200): Promise<T> {
  let lastErr: any;
  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // exponential backoff
      const wait = backoffMs * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}