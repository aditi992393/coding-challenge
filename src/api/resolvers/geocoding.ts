import type { City } from "@/types";

/**
 * Resolver for the Open-Meteo Geocoding API.
 * Transforms the REST response into our domain City type.
 */

const GEOCODING_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";

interface GeocodingApiResult {
  id: number;
  name: string;
  country: string;
  country_code?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

interface GeocodingApiResponse {
  results?: GeocodingApiResult[];
}

export async function searchCitiesResolver(args: {
  query: string;
  count?: number;
}): Promise<City[]> {
  const query = args.query.trim();
  if (query.length < 2) return [];

  const url = new URL(GEOCODING_ENDPOINT);
  url.searchParams.set("name", query);
  url.searchParams.set("count", String(args.count ?? 8));
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Geocoding request failed: ${response.status}`);
  }
  const data = (await response.json()) as GeocodingApiResponse;
  if (!data.results) return [];

  return data.results.map<City>((r) => ({
    id: r.id,
    name: r.name,
    country: r.country,
    countryCode: r.country_code,
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
  }));
}
