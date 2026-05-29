import type {
  ActivityKind,
  ActivityRecommendation,
  DailyForecast,
  WeatherForecast,
} from "@/types";

/**
 * Pure business logic for ranking activity suitability against a weather forecast.
 *
 * All functions here are deterministic and side-effect free, making them trivial
 * to unit-test. The UI layer never computes these scores directly — it only renders
 * the result of `rankActivities`.
 */

const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  skiing: "Skiing",
  surfing: "Surfing",
  outdoor_sightseeing: "Outdoor sightseeing",
  indoor_sightseeing: "Indoor sightseeing",
};

const clamp = (n: number, min = 0, max = 100): number =>
  Math.max(min, Math.min(max, n));

/** Average a metric across the forecast horizon. */
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Skiing score:
 *  - Cold temperatures (≤ 0°C) are essential.
 *  - Snowfall over the period boosts the score significantly.
 */
export function scoreSkiing(daily: DailyForecast[]): {
  score: number;
  reason: string;
} {
  if (daily.length === 0) return { score: 0, reason: "No forecast data" };
  const avgMax = average(daily.map((d) => d.temperatureMax));
  const avgMin = average(daily.map((d) => d.temperatureMin));
  const totalSnow = daily.reduce((s, d) => s + d.snowfallSum, 0);

  // Temperature contribution: peaks at -5°C with 70 points, drops to 0 around +7°C.
  const tempScore = clamp(70 - (avgMax + 5) * 6, 0, 70);
  // Snow contribution: 0..50 points, saturates around 5cm total snowfall.
  const snowScore = clamp(totalSnow * 10, 0, 50);
  const score = clamp(tempScore + snowScore);

  const reason =
    totalSnow > 1
      ? `Cold temps (avg ${avgMin.toFixed(0)}°C low) with ${totalSnow.toFixed(1)} cm fresh snow.`
      : avgMax <= 2
        ? `Cold conditions (avg ${avgMax.toFixed(0)}°C high) but limited snowfall.`
        : `Too warm (avg ${avgMax.toFixed(0)}°C high) for skiing.`;
  return { score, reason };
}

/**
 * Surfing score:
 *  - Needs warmth (≥ 15°C) and meaningful wind (12–25 km/h ideal).
 *  - Heavy rain detracts.
 */
export function scoreSurfing(daily: DailyForecast[]): {
  score: number;
  reason: string;
} {
  if (daily.length === 0) return { score: 0, reason: "No forecast data" };
  const avgMax = average(daily.map((d) => d.temperatureMax));
  const avgWind = average(daily.map((d) => d.windSpeedMax));
  const totalRain = daily.reduce((s, d) => s + d.precipitationSum, 0);

  // Temperature contribution: 0..60, peaks at 24°C.
  const tempScore = clamp(60 - Math.abs(avgMax - 24) * 4, 0, 60);
  // Wind contribution: 0..40. Below 5 km/h is dead calm; 18+ km/h is ideal;
  // above 25 conditions become harsh and the score tapers off.
  const windScore =
    avgWind <= 25
      ? clamp((avgWind - 5) * 3, 0, 40)
      : clamp(40 - (avgWind - 25) * 3, 0, 40);
  const rainPenalty = clamp(totalRain * 1.5, 0, 30);
  const score = clamp(tempScore + windScore - rainPenalty);

  const reason =
    avgMax < 12
      ? `Sea will be too cold (avg ${avgMax.toFixed(0)}°C).`
      : avgWind < 10
        ? `Calm winds (${avgWind.toFixed(0)} km/h) mean flat conditions.`
        : `Warm (${avgMax.toFixed(0)}°C) with workable winds (${avgWind.toFixed(0)} km/h).`;
  return { score, reason };
}

/**
 * Outdoor sightseeing score:
 *  - Mild temperatures (15–28°C), low precipitation, light wind.
 */
export function scoreOutdoorSightseeing(daily: DailyForecast[]): {
  score: number;
  reason: string;
} {
  if (daily.length === 0) return { score: 0, reason: "No forecast data" };
  const avgMax = average(daily.map((d) => d.temperatureMax));
  const totalRain = daily.reduce((s, d) => s + d.precipitationSum, 0);
  const avgWind = average(daily.map((d) => d.windSpeedMax));

  const tempScore = clamp(70 - Math.abs(avgMax - 21) * 5, 0, 70);
  const rainPenalty = clamp(totalRain * 3, 0, 50);
  const windPenalty = clamp(Math.max(0, avgWind - 25) * 2, 0, 20);
  const score = clamp(tempScore - rainPenalty - windPenalty);

  const reason =
    totalRain > 10
      ? `Heavy precipitation (${totalRain.toFixed(0)} mm) over the week.`
      : avgMax >= 15 && avgMax <= 28
        ? `Pleasant ${avgMax.toFixed(0)}°C with limited rain.`
        : avgMax > 28
          ? `Quite hot (avg ${avgMax.toFixed(0)}°C) — hydrate and pace yourself.`
          : `Cool (avg ${avgMax.toFixed(0)}°C) — dress warmly.`;
  return { score, reason };
}

/**
 * Indoor sightseeing is the natural fallback when outdoor conditions are poor.
 * Its score moves inversely with outdoor suitability and rises with rain/extremes.
 */
export function scoreIndoorSightseeing(daily: DailyForecast[]): {
  score: number;
  reason: string;
} {
  if (daily.length === 0) return { score: 0, reason: "No forecast data" };
  const outdoor = scoreOutdoorSightseeing(daily);
  const totalRain = daily.reduce((s, d) => s + d.precipitationSum, 0);
  const avgMax = average(daily.map((d) => d.temperatureMax));

  // Base 40, boosted when outdoor is poor, and by rain / temperature extremes.
  const base = 40;
  const inverseOutdoor = clamp((100 - outdoor.score) * 0.4, 0, 40);
  const rainBoost = clamp(totalRain * 1.2, 0, 25);
  const extremeBoost =
    avgMax < 0 || avgMax > 32 ? 12 : avgMax < 8 || avgMax > 28 ? 6 : 0;
  const score = clamp(base + inverseOutdoor + rainBoost + extremeBoost);

  const reason =
    totalRain > 10
      ? `Museums and galleries shine when there's ${totalRain.toFixed(0)} mm of rain.`
      : avgMax > 30
        ? `Stay cool indoors during ${avgMax.toFixed(0)}°C heat.`
        : avgMax < 5
          ? `Warm indoor spaces are welcome in ${avgMax.toFixed(0)}°C cold.`
          : `A solid backup option for any day.`;
  return { score, reason };
}

const SCORERS: Record<
  ActivityKind,
  (d: DailyForecast[]) => { score: number; reason: string }
> = {
  skiing: scoreSkiing,
  surfing: scoreSurfing,
  outdoor_sightseeing: scoreOutdoorSightseeing,
  indoor_sightseeing: scoreIndoorSightseeing,
};

/**
 * Rank all activities for a given forecast, highest score first.
 */
export function rankActivities(
  forecast: WeatherForecast,
): ActivityRecommendation[] {
  const kinds: ActivityKind[] = [
    "skiing",
    "surfing",
    "outdoor_sightseeing",
    "indoor_sightseeing",
  ];
  return kinds
    .map<ActivityRecommendation>((kind) => {
      const { score, reason } = SCORERS[kind](forecast.daily);
      return {
        kind,
        label: ACTIVITY_LABELS[kind],
        score: Math.round(score),
        reason,
      };
    })
    .sort((a, b) => b.score - a.score);
}
