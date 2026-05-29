import { useQuery } from "@tanstack/react-query";
import { executeQuery } from "@/api/client";
import { GET_WEATHER_QUERY } from "@/api/queries/getWeather";
import type { City, WeatherForecast } from "@/types";

interface GetWeatherResult {
  getWeather: WeatherForecast;
}

/**
 * Feature hook to retrieve a weather forecast for a selected city.
 *
 * - Disabled until a city is selected (returns idle state).
 * - Cached per (lat, lon) for 10 minutes.
 */
export function useWeatherForecast(city: City | null) {
  return useQuery({
    queryKey: ["weather", city?.latitude, city?.longitude],
    queryFn: async () => {
      if (!city) throw new Error("City is required");
      const data = await executeQuery<GetWeatherResult>(GET_WEATHER_QUERY, {
        latitude: city.latitude,
        longitude: city.longitude,
        days: 7,
      });
      return data.getWeather;
    },
    enabled: city !== null,
    staleTime: 1000 * 60 * 10,
  });
}
