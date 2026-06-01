import type { ActivityKind, ActivityRecommendation, DailyForecast, WeatherForecast } from '@/types';

/**
 * Pure scoring for ranking activities against a weather forecast.
 *
 * Each scorer answers 2–3 yes/no questions about the week
 * ("is it cold?", "did it snow?") and awards fixed points for each "yes".
 * The points add up to 100 max — no clamping, no math curves.
 */

const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  skiing: 'Skiing',
  surfing: 'Surfing',
  outdoor_sightseeing: 'Outdoor sightseeing',
  indoor_sightseeing: 'Indoor sightseeing',
};

const avg = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** One summary object used by every scorer below. */
function summarize(daily: DailyForecast[]) {
  return {
    avgMaxTemp: avg(daily.map((d) => d.temperatureMax)),
    avgWind: avg(daily.map((d) => d.windSpeedMax)),
    totalRain: sum(daily.map((d) => d.precipitationSum)),
    totalSnow: sum(daily.map((d) => d.snowfallSum)),
  };
}

type Score = { score: number; reason: string };
const EMPTY: Score = { score: 0, reason: 'No forecast data' };

/**
 * Skiing score (max 100).
 *
 * Skiing needs two essentials: cold enough that snow doesn't melt, and
 * actual snow on the ground. Both are simple yes/no checks worth 50 pts each:
 *   • cold:  average daily high ≤ 0°C
 *   • snow:  total weekly snowfall ≥ 5 cm
 *
 * Both yes → 100 (perfect alpine week).
 * Only one → 50  (cold but no fresh snow, or vice versa).
 * Neither  → 0   (warm and dry — go elsewhere).
 */
export function scoreSkiing(daily: DailyForecast[]): Score {
  if (daily.length === 0) return EMPTY;
  const { avgMaxTemp, totalSnow } = summarize(daily);

  const isCold = avgMaxTemp <= 0;
  const hasSnow = totalSnow >= 5;
  const score = (isCold ? 50 : 0) + (hasSnow ? 50 : 0);

  let reason: string;
  if (isCold && hasSnow) {
    reason = `Cold (avg ${avgMaxTemp.toFixed(0)}°C) with ${totalSnow.toFixed(1)} cm fresh snow.`;
  } else if (isCold) {
    reason = `Cold conditions but limited snowfall.`;
  } else {
    reason = `Too warm (avg ${avgMaxTemp.toFixed(0)}°C) for skiing.`;
  }
  return { score, reason };
}

/**
 * Surfing score (max 100).
 *
 * Three conditions, weighted by how surf-specific each one is:
 *   • warm sea:   18°C ≤ avg daily high ≤ 32°C        → 35 pts
 *   • good wind:  12 ≤ avg daily wind ≤ 30 km/h       → 40 pts (wind matters most —
 *                                                        no wind, no waves)
 *   • dry beach:  total weekly rainfall ≤ 10 mm       → 25 pts
 *
 * Wind has the highest weight because it's the single factor that turns a
 * pleasant beach day into a surfable one. A warm, dry, windless day will
 * score 60 — below outdoor sightseeing on the same forecast.
 */
export function scoreSurfing(daily: DailyForecast[]): Score {
  if (daily.length === 0) return EMPTY;
  const { avgMaxTemp, avgWind, totalRain } = summarize(daily);

  const isWarm = avgMaxTemp >= 18 && avgMaxTemp <= 32;
  const hasWind = avgWind >= 12 && avgWind <= 30;
  const isDry = totalRain <= 10;
  const score = (isWarm ? 35 : 0) + (hasWind ? 40 : 0) + (isDry ? 25 : 0);

  let reason: string;
  if (!isWarm) {
    reason = `Sea will be too cold (avg ${avgMaxTemp.toFixed(0)}°C).`;
  } else if (!hasWind) {
    reason = `Calm winds (${avgWind.toFixed(0)} km/h) mean flat conditions.`;
  } else {
    reason = `Warm (${avgMaxTemp.toFixed(0)}°C) with workable winds (${avgWind.toFixed(0)} km/h).`;
  }
  return { score, reason };
}

/**
 * Outdoor sightseeing score (max 100).
 *
 * Walking around a city is best when the weather is mild, dry, and calm.
 * Three checks:
 *   • mild temp:  15°C ≤ avg daily high ≤ 25°C   → 50 pts (most important —
 *                                                   shivering or sweating
 *                                                   ruins a long walk)
 *   • dry:        total weekly rainfall ≤ 5 mm   → 30 pts
 *   • light wind: avg daily wind ≤ 15 km/h       → 20 pts
 *
 * Temperature has the highest weight because it impacts comfort the most
 * over several hours of walking. Outdoor wins on classic "spring/autumn"
 * days; loses to indoor on rainy weeks and to surfing on warm + windy ones.
 */
export function scoreOutdoorSightseeing(daily: DailyForecast[]): Score {
  if (daily.length === 0) return EMPTY;
  const { avgMaxTemp, avgWind, totalRain } = summarize(daily);

  const isMild = avgMaxTemp >= 15 && avgMaxTemp <= 25;
  const isDry = totalRain <= 5;
  const isCalm = avgWind <= 15;
  const score = (isMild ? 50 : 0) + (isDry ? 30 : 0) + (isCalm ? 20 : 0);

  let reason: string;
  if (!isDry) {
    reason = `Heavy precipitation (${totalRain.toFixed(0)} mm) over the week.`;
  } else if (isMild) {
    reason = `Pleasant ${avgMaxTemp.toFixed(0)}°C with limited rain.`;
  } else if (avgMaxTemp > 25) {
    reason = `Quite hot (avg ${avgMaxTemp.toFixed(0)}°C) — hydrate and pace yourself.`;
  } else {
    reason = `Cool (avg ${avgMaxTemp.toFixed(0)}°C) — dress warmly.`;
  }
  return { score, reason };
}

/**
 * Indoor sightseeing score (max 100).
 *
 * Indoor is the natural fallback — museums and galleries don't care about
 * the weather. We model that by starting at a 40-pt baseline and adding
 * boosts when conditions outside are unpleasant:
 *   • baseline:     always applies                          → 40 pts
 *   • wet:          total weekly rainfall ≥ 10 mm           → +35 pts
 *   • extreme temp: avg daily high < 5°C or > 30°C          → +25 pts
 *
 * This means indoor wins on rainy or freezing/sweltering weeks (when no
 * other activity scores well) and otherwise sits around 40 — slightly below
 * an outdoor activity that actually fits the weather.
 */
export function scoreIndoorSightseeing(daily: DailyForecast[]): Score {
  if (daily.length === 0) return EMPTY;
  const { avgMaxTemp, totalRain } = summarize(daily);

  const isWet = totalRain >= 10;
  const isExtreme = avgMaxTemp < 5 || avgMaxTemp > 30;
  const score = 40 + (isWet ? 35 : 0) + (isExtreme ? 25 : 0);

  let reason: string;
  if (isWet) {
    reason = `Museums and galleries shine with ${totalRain.toFixed(0)} mm of rain.`;
  } else if (avgMaxTemp > 30) {
    reason = `Stay cool indoors during ${avgMaxTemp.toFixed(0)}°C heat.`;
  } else if (avgMaxTemp < 5) {
    reason = `Warm indoor spaces are welcome in ${avgMaxTemp.toFixed(0)}°C cold.`;
  } else {
    reason = `A solid backup option for any day.`;
  }
  return { score, reason };
}

const SCORERS: Record<ActivityKind, (d: DailyForecast[]) => Score> = {
  skiing: scoreSkiing,
  surfing: scoreSurfing,
  outdoor_sightseeing: scoreOutdoorSightseeing,
  indoor_sightseeing: scoreIndoorSightseeing,
};

/** Rank all four activities for a given forecast, highest score first. */
export function rankActivities(forecast: WeatherForecast): ActivityRecommendation[] {
  return (Object.keys(SCORERS) as ActivityKind[])
    .map((kind) => {
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
