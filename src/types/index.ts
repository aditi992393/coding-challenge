/**
 * Domain types shared across the application.
 * Kept framework-agnostic so they can be reused by API, business logic and UI layers.
 */

export interface City {
  id: number;
  name: string;
  country: string;
  countryCode?: string;
  admin1?: string; // state/region
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface DailyForecast {
  date: string; // ISO date (YYYY-MM-DD)
  temperatureMax: number;
  temperatureMin: number;
  precipitationSum: number; // mm
  snowfallSum: number; // cm
  windSpeedMax: number; // km/h
  weatherCode: number;
}

export interface CurrentWeather {
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  time: string;
}

export interface WeatherForecast {
  current: CurrentWeather;
  daily: DailyForecast[];
  timezone: string;
}

export type ActivityKind =
  | "skiing"
  | "surfing"
  | "indoor_sightseeing"
  | "outdoor_sightseeing";

export interface ActivityRecommendation {
  kind: ActivityKind;
  label: string;
  score: number; // 0..100
  reason: string;
}
