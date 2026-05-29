import gql from "graphql-tag";

/**
 * GraphQL query for retrieving a weather forecast for given coordinates.
 * Resolved client-side by the local executor against the Open-Meteo Forecast API.
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
