import gql from "graphql-tag";
import type { City } from "@/types";

/**
 * GraphQL query for dynamic city autocomplete.
 * Returned data is shaped according to the schema (`City[]`).
 */
export const SEARCH_CITIES_QUERY = gql`
  query SearchCities($query: String!, $count: Int) {
    searchCities(query: $query, count: $count) {
      id
      name
      country
      countryCode
      admin1
      latitude
      longitude
      timezone
    }
  }
`;

export interface SearchCitiesData {
  searchCities: City[];
}

export interface SearchCitiesVars {
  query: string;
  count?: number;
}
