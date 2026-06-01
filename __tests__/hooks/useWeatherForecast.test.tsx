import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useWeatherForecast } from '@/hooks/useWeatherForecast';
import type { City } from '@/types';

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const london: City = {
  id: 1,
  name: 'London',
  country: 'United Kingdom',
  admin1: 'England',
  latitude: 51.5074,
  longitude: -0.1278,
};

const weatherPayload = {
  timezone: 'Europe/London',
  current_weather: {
    temperature: 18,
    windspeed: 12,
    weathercode: 1,
    time: '2025-01-01T10:00',
  },
  daily: {
    time: ['2025-01-01', '2025-01-02'],
    temperature_2m_max: [20, 22],
    temperature_2m_min: [12, 14],
    precipitation_sum: [0, 1.2],
    snowfall_sum: [0, 0],
    windspeed_10m_max: [12, 10],
    weathercode: [1, 2],
  },
};

describe('useWeatherForecast', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not fetch when no city is provided', () => {
    const { result } = renderHook(() => useWeatherForecast(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.forecast).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns a mapped forecast when a city is selected', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => weatherPayload,
    });
    const { result } = renderHook(() => useWeatherForecast(london), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.forecast).toBeDefined());
    expect(result.current.forecast!.timezone).toBe('Europe/London');
    expect(result.current.forecast!.current.temperature).toBe(18);
    expect(result.current.forecast!.daily).toHaveLength(2);
    expect(result.current.forecast!.daily[0]).toEqual(
      expect.objectContaining({
        date: '2025-01-01',
        temperatureMax: 20,
        temperatureMin: 12,
      }),
    );
  });

  it('exposes a populated error when the underlying fetch rejects', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('503 Service Unavailable'));
    const { result } = renderHook(() => useWeatherForecast(london), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect((result.current.error as Error).message).toMatch(/503/);
  });
});
