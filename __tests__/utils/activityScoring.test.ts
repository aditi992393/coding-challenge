import {
  rankActivities,
  scoreIndoorSightseeing,
  scoreOutdoorSightseeing,
  scoreSkiing,
  scoreSurfing,
} from "@/utils/activityScoring";
import type { DailyForecast, WeatherForecast } from "@/types";

const day = (over: Partial<DailyForecast>): DailyForecast => ({
  date: "2025-01-01",
  temperatureMax: 20,
  temperatureMin: 12,
  precipitationSum: 0,
  snowfallSum: 0,
  windSpeedMax: 10,
  weatherCode: 0,
  ...over,
});

const forecast = (daily: DailyForecast[]): WeatherForecast => ({
  timezone: "UTC",
  current: { temperature: 20, windSpeed: 10, weatherCode: 0, time: "" },
  daily,
});

describe("activity scoring (pure logic)", () => {
  it("rates skiing highest for snowy alpine conditions", () => {
    const winter = Array.from({ length: 5 }, () =>
      day({ temperatureMax: -3, temperatureMin: -9, snowfallSum: 4 }),
    );
    const ranked = rankActivities(forecast(winter));
    expect(ranked[0].kind).toBe("skiing");
    expect(ranked[0].score).toBeGreaterThan(70);
  });

  it("rates surfing highest for warm windy coast conditions", () => {
    const coast = Array.from({ length: 5 }, () =>
      day({ temperatureMax: 24, temperatureMin: 18, windSpeedMax: 18 }),
    );
    const ranked = rankActivities(forecast(coast));
    expect(ranked[0].kind).toBe("surfing");
  });

  it("rates outdoor sightseeing highest for mild dry weather", () => {
    const mild = Array.from({ length: 5 }, () =>
      day({ temperatureMax: 21, temperatureMin: 14, windSpeedMax: 8 }),
    );
    const ranked = rankActivities(forecast(mild));
    expect(ranked[0].kind).toBe("outdoor_sightseeing");
  });

  it("rates indoor sightseeing highest for wet, miserable weather", () => {
    const wet = Array.from({ length: 5 }, () =>
      day({ temperatureMax: 8, temperatureMin: 4, precipitationSum: 18 }),
    );
    const ranked = rankActivities(forecast(wet));
    expect(ranked[0].kind).toBe("indoor_sightseeing");
  });

  it("returns scores clamped to 0..100", () => {
    const extreme = Array.from({ length: 5 }, () =>
      day({
        temperatureMax: 45,
        temperatureMin: 30,
        precipitationSum: 200,
        windSpeedMax: 80,
      }),
    );
    const ranked = rankActivities(forecast(extreme));
    for (const r of ranked) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    }
  });

  it("handles empty daily forecast gracefully", () => {
    expect(scoreSkiing([])).toEqual({ score: 0, reason: "No forecast data" });
    expect(scoreSurfing([])).toEqual({ score: 0, reason: "No forecast data" });
    expect(scoreOutdoorSightseeing([])).toEqual({
      score: 0,
      reason: "No forecast data",
    });
    expect(scoreIndoorSightseeing([])).toEqual({
      score: 0,
      reason: "No forecast data",
    });
  });

  it("returns recommendations in descending score order", () => {
    const mixed = [
      day({ temperatureMax: 18, precipitationSum: 1 }),
      day({ temperatureMax: 22, precipitationSum: 0 }),
      day({ temperatureMax: 19, precipitationSum: 2 }),
    ];
    const ranked = rankActivities(forecast(mixed));
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });
});
