import type { City } from '@/types';

/**
 * Prop types for every feature component in this folder.
 * Co-locating them keeps each component file focused on JSX + state.
 */

export interface CitySearchProps {
  selectedCity: City | null;
  onSelectCity: (city: City | null) => void;
}

export interface WeatherForecastProps {
  city: City | null;
}

export interface ActivityRecommendationsProps {
  city: City | null;
}
