import gql from "graphql-tag";

/**
 * GraphQL query for dynamic city autocomplete.
 * Resolved client-side by the local executor against the Open-Meteo Geocoding API.
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
