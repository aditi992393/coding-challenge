import type { WeatherForecast } from "@/types";

/**
 * Resolver for the Open-Meteo Forecast API.
 */

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";

interface ForecastApiResponse {
  timezone: string;
  current_weather: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    time: string;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    snowfall_sum: number[];
    windspeed_10m_max: number[];
    weathercode: number[];
  };
}

export async function getWeatherForecastResolver(args: {
  latitude: number;
  longitude: number;
  days?: number;
}): Promise<WeatherForecast> {
  const url = new URL(FORECAST_ENDPOINT);
  url.searchParams.set("latitude", String(args.latitude));
  url.searchParams.set("longitude", String(args.longitude));
  url.searchParams.set("current_weather", "true");
  url.searchParams.set(
    "daily",
    [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "snowfall_sum",
      "windspeed_10m_max",
      "weathercode",
    ].join(","),
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", String(args.days ?? 7));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Weather request failed: ${response.status}`);
  }
  const data = (await response.json()) as ForecastApiResponse;

  return {
    timezone: data.timezone,
    current: {
      temperature: data.current_weather.temperature,
      windSpeed: data.current_weather.windspeed,
      weatherCode: data.current_weather.weathercode,
      time: data.current_weather.time,
    },
    daily: data.daily.time.map((date, i) => ({
      date,
      temperatureMax: data.daily.temperature_2m_max[i],
      temperatureMin: data.daily.temperature_2m_min[i],
      precipitationSum: data.daily.precipitation_sum[i],
      snowfallSum: data.daily.snowfall_sum[i],
      windSpeedMax: data.daily.windspeed_10m_max[i],
      weatherCode: data.daily.weathercode[i],
    })),
  };
}
