import { useState } from 'react';
import { normalizeError } from './normalize';

type AsyncFn<Args extends any[], T> = (...args: Args) => Promise<T>;

export function useApi<Args extends any[], T>(fn: AsyncFn<Args, T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  async function run(...args: Args) {
    setLoading(true);
    setError(null);

    try {
      const data = await fn(...args);
      return { ok: true as const, data, error: null };
    } catch (e) {
      const normalized = normalizeError(e);
      setError(normalized);
      return { ok: false as const, data: null, error: normalized };
    } finally {
      setLoading(false);
    }
  }

  return { run, loading, error };
}