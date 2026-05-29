import { useQuery } from "@tanstack/react-query";
import { request } from "@/api/client";
import {
  SEARCH_CITIES_QUERY,
  type SearchCitiesData,
  type SearchCitiesVars,
} from "@/api/queries/searchCities";

/**
 * Feature hook for dynamic city autocomplete.
 *
 * Caching behaviour (React Query):
 *  - `queryKey` is `["cities", <query>]` — each unique query string is cached separately.
 *  - `staleTime: Infinity` means once fetched, the same query is considered fresh
 *    forever within the session. Re-typing the same word returns instantly with
 *    no network call. This is the behaviour you'd want for autocomplete results
 *    which rarely change.
 *  - The query is disabled (`enabled: false`) until the user has typed at least
 *    2 characters.
 */
export function useCitySearch(query: string) {
  const trimmed = query.trim();
  const enabled = trimmed.length >= 2;

  const result = useQuery({
    queryKey: ["cities", trimmed],
    queryFn: async () => {
      const data = await request<SearchCitiesData>(SEARCH_CITIES_QUERY, {
        query: trimmed,
        count: 8,
      } satisfies SearchCitiesVars);
      return data.searchCities;
    },
    enabled,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30, // keep results in memory for 30 minutes
  });

  return {
    cities: result.data ?? [],
    loading: result.isLoading || result.isFetching,
    error: result.error,
  };
}
