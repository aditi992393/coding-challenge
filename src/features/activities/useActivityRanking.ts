import { useMemo } from "react";
import { rankActivities } from "@/utils/activityScoring";
import type { ActivityRecommendation, WeatherForecast } from "@/types";

/**
 * Memoized ranking of activities for a given forecast. The actual scoring is
 * pure (see @/utils/activityScoring); this hook just plugs it into React's
 * render cycle.
 */
export function useActivityRanking(
  forecast: WeatherForecast | undefined,
): ActivityRecommendation[] {
  return useMemo(() => {
    if (!forecast) return [];
    return rankActivities(forecast);
  }, [forecast]);
}
