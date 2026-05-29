import { gql } from "@apollo/client";
import type { WeatherForecast } from "@/types";

/**
 * GraphQL query for retrieving a weather forecast for given coordinates.
 */
export const GET_WEATHER_QUERY = gql`
  query GetWeather($latitude: Float!, $longitude: Float!, $days: Int) {
    getWeather(latitude: $latitude, longitude: $longitude, days: $days) {
      timezone
      current {
        temperature
        windSpeed
        weatherCode
        time
      }
      daily {
        date
        temperatureMax
        temperatureMin
        precipitationSum
        snowfallSum
        windSpeedMax
        weatherCode
      }
    }
  }
`;

export interface GetWeatherData {
  getWeather: WeatherForecast;
}

export interface GetWeatherVars {
  latitude: number;
  longitude: number;
  days?: number;
}
