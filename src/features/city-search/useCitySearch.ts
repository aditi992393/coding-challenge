import { useQuery } from "@tanstack/react-query";
import { executeQuery } from "@/api/client";
import { SEARCH_CITIES_QUERY } from "@/api/queries/searchCities";
import type { City } from "@/types";

interface SearchCitiesResult {
  searchCities: City[];
}

/**
 * Feature hook for dynamic city autocomplete.
 *
 * - Skips fetching when the query is shorter than 2 chars (empty state in UI).
 * - Cached for 5 minutes (React Query default behaviour can be tuned per-call).
 * - Resolved through the GraphQL abstraction at @/api/client.
 */
export function useCitySearch(query: string) {
  const enabled = query.trim().length >= 2;
  return useQuery({
    queryKey: ["cities", query],
    queryFn: async () => {
      const data = await executeQuery<SearchCitiesResult>(SEARCH_CITIES_QUERY, {
        query,
        count: 8,
      });
      return data.searchCities;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}
