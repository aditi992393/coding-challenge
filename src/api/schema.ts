/**
 * GraphQL schema definition.
 *
 * The schema describes the shape of the data the client can request.
 * It is paired with resolvers (see ./resolvers.ts) to build an executable
 * schema that runs inside the browser via Apollo's SchemaLink.
 */
export const typeDefs = `
  type City {
    id: Int!
    name: String!
    country: String!
    countryCode: String
    admin1: String
    latitude: Float!
    longitude: Float!
    timezone: String
  }

  type CurrentWeather {
    temperature: Float!
    windSpeed: Float!
    weatherCode: Int!
    time: String!
  }

  type DailyForecast {
    date: String!
    temperatureMax: Float!
    temperatureMin: Float!
    precipitationSum: Float!
    snowfallSum: Float!
    windSpeedMax: Float!
    weatherCode: Int!
  }

  type WeatherForecast {
    timezone: String!
    current: CurrentWeather!
    daily: [DailyForecast!]!
  }

  type Query {
    searchCities(query: String!, count: Int): [City!]!
    getWeather(latitude: Float!, longitude: Float!, days: Int): WeatherForecast!
  }
`;
