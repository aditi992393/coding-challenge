import { useCityStore } from "@/store/useCityStore";
import { useWeatherForecast } from "@/features/weather/useWeatherForecast";
import { useActivityRanking } from "@/features/activities/useActivityRanking";
import { Skeleton } from "@/components/common/Skeleton";
import type { ActivityKind } from "@/types";

const ACTIVITY_ICONS: Record<ActivityKind, string> = {
  skiing: "⛷️",
  surfing: "🏄",
  outdoor_sightseeing: "🏞️",
  indoor_sightseeing: "🏛️",
};

function scoreColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-slate-400";
}

function scoreLabel(score: number): string {
  if (score >= 70) return "Excellent";
  if (score >= 40) return "Possible";
  return "Not recommended";
}

export function ActivityRecommendations() {
  const selectedCity = useCityStore((s) => s.selectedCity);
  const { data, isLoading, isError } = useWeatherForecast(selectedCity);
  const ranked = useActivityRanking(data);

  if (!selectedCity || isError) return null;

  if (isLoading) {
    return (
      <section className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </section>
    );
  }

  if (ranked.length === 0) return null;

  return (
    <section aria-labelledby="activities-heading" className="space-y-3">
      <h2
        id="activities-heading"
        className="text-xl font-semibold text-slate-900 sm:text-2xl"
      >
        Activity recommendations
      </h2>
      <ol role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ranked.map((activity, idx) => (
          <li
            key={activity.kind}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl" aria-hidden>
              {ACTIVITY_ICONS[activity.kind]}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">
                  <span className="mr-1.5 text-xs font-medium text-slate-400">
                    #{idx + 1}
                  </span>
                  {activity.label}
                </p>
                <span
                  className="text-xs font-medium text-slate-500"
                  aria-label={`Score ${activity.score} out of 100`}
                >
                  {activity.score}/100
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{activity.reason}</p>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={activity.score}
                aria-label={`${activity.label} suitability`}
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100"
              >
                <div
                  className={`h-full ${scoreColor(activity.score)}`}
                  style={{ width: `${activity.score}%` }}
                />
              </div>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                {scoreLabel(activity.score)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
