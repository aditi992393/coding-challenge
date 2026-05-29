import { useQuery } from "@apollo/client/react";
import {
  SEARCH_CITIES_QUERY,
  type SearchCitiesData,
  type SearchCitiesVars,
} from "@/api/queries/searchCities";

/**
 * Feature hook for dynamic city autocomplete.
 *
 * - Skips the network call when the query is shorter than 2 chars.
 * - Apollo's `InMemoryCache` automatically caches each (query, count) combination.
 */
export function useCitySearch(query: string) {
  const skip = query.trim().length < 2;
  const { data, loading, error, networkStatus } = useQuery<
    SearchCitiesData,
    SearchCitiesVars
  >(SEARCH_CITIES_QUERY, {
    variables: { query, count: 8 },
    skip,
    notifyOnNetworkStatusChange: true,
  });

  return {
    cities: data?.searchCities ?? [],
    loading,
    error,
    networkStatus,
  };
}
