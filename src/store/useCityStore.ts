import { create } from "zustand";
import type { City } from "@/types";

/**
 * Client-side store for the currently selected city.
 * Server-state (search results, weather) is owned by React Query;
 * this store only tracks UI selection.
 */
interface CityStoreState {
  selectedCity: City | null;
  selectCity: (city: City | null) => void;
}

export const useCityStore = create<CityStoreState>((set) => ({
  selectedCity: null,
  selectCity: (city) => set({ selectedCity: city }),
}));
