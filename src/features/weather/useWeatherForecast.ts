import { useQuery } from "@tanstack/react-query";
import { request } from "@/api/client";
import {
  GET_WEATHER_QUERY,
  type GetWeatherData,
  type GetWeatherVars,
} from "@/api/queries/getWeather";
import type { City } from "@/types";

/**
 * Feature hook to retrieve a weather forecast for a selected city.
 *
 * Caching behaviour (React Query):
 *  - `queryKey` is `["weather", lat, lon]` — re-selecting a previously viewed
 *    city returns the cached forecast immediately.
 *  - `staleTime: 10 minutes` is more conservative than the city search because
 *    weather actually changes; after 10 minutes the next access will refetch
 *    in the background.
 */
export function useWeatherForecast(city: City | null) {
  const result = useQuery({
    queryKey: ["weather", city?.latitude, city?.longitude],
    queryFn: async () => {
      if (!city) throw new Error("City is required");
      const data = await request<GetWeatherData>(GET_WEATHER_QUERY, {
        latitude: city.latitude,
        longitude: city.longitude,
        days: 7,
      } satisfies GetWeatherVars);
      return data.getWeather;
    },
    enabled: city !== null,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });

  return {
    forecast: result.data,
    loading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}
