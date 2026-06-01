import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCitySearch } from '@/hooks/useCitySearch';

/**
 * Creates a fresh QueryClientProvider wrapper per test so caches don't leak
 * between cases. `retry: false` makes failures surface immediately.
 */
function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const geocodingPayload = {
  results: [
    {
      id: 2643743,
      name: 'London',
      country: 'United Kingdom',
      country_code: 'GB',
      admin1: 'England',
      latitude: 51.5074,
      longitude: -0.1278,
      timezone: 'Europe/London',
    },
  ],
};

describe('useCitySearch', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns an empty list and skips the fetch for queries shorter than 2 chars', () => {
    const { result } = renderHook(() => useCitySearch('L'), {
      wrapper: createWrapper(),
    });
    expect(result.current.cities).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches and returns mapped City objects for queries of 2+ characters', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => geocodingPayload,
    });
    const { result } = renderHook(() => useCitySearch('Lon'), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.cities).toHaveLength(1));
    expect(result.current.cities[0]).toEqual(
      expect.objectContaining({
        id: 2643743,
        name: 'London',
        country: 'United Kingdom',
        countryCode: 'GB',
        admin1: 'England',
      }),
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('exposes a populated error when the underlying fetch rejects', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network down'));
    const { result } = renderHook(() => useCitySearch('Lon'), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect((result.current.error as Error).message).toMatch(/Network down/);
  });
});
