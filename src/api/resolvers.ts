import { fetchCities } from "@/api/rest/geocoding";
import { fetchWeather } from "@/api/rest/weather";

/**
 * GraphQL resolvers map each field in the schema to a function that returns
 * data for it. Here both queries are top-level fields on `Query`.
 *
 * The resolver functions translate from the GraphQL world into REST calls
 * against the Open-Meteo APIs.
 */
export const resolvers = {
  Query: {
    searchCities: (
      _parent: unknown,
      args: { query: string; count?: number },
    ) => fetchCities(args),
    getWeather: (
      _parent: unknown,
      args: { latitude: number; longitude: number; days?: number },
    ) => fetchWeather(args),
  },
};
