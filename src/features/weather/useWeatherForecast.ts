import { useQuery } from "@apollo/client/react";
import {
  GET_WEATHER_QUERY,
  type GetWeatherData,
  type GetWeatherVars,
} from "@/api/queries/getWeather";
import type { City } from "@/types";

/**
 * Feature hook to retrieve a weather forecast for a selected city.
 *
 * - Skipped until a city is selected.
 * - Apollo caches by query variables; switching back to a previously selected
 *   city returns its forecast instantly.
 */
export function useWeatherForecast(city: City | null) {
  const { data, loading, error, refetch } = useQuery<
    GetWeatherData,
    GetWeatherVars
  >(GET_WEATHER_QUERY, {
    variables: {
      latitude: city?.latitude ?? 0,
      longitude: city?.longitude ?? 0,
      days: 7,
    },
    skip: !city,
  });

  return {
    forecast: data?.getWeather,
    loading,
    error,
    refetch,
  };
}
