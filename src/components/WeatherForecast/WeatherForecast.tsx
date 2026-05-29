import { useCityStore } from "@/store/useCityStore";
import { useWeatherForecast } from "@/features/weather/useWeatherForecast";
import { Spinner } from "@/components/common/Spinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { getWeatherEmoji, getWeatherLabel } from "@/utils/weatherCodes";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function WeatherForecast() {
  const selectedCity = useCityStore((s) => s.selectedCity);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useWeatherForecast(selectedCity);

  if (!selectedCity) {
    return (
      <EmptyState
        icon={<span aria-hidden>🧭</span>}
        title="No city selected yet"
        description="Search for a destination above to see its 7-day forecast and activity recommendations."
      />
    );
  }

  if (isLoading) {
    return (
      <section aria-busy="true" aria-live="polite" className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
      >
        <p className="font-semibold">Couldn't load the forecast</p>
        <p className="mt-1 text-sm">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="focus-ring mt-3 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <section aria-labelledby="forecast-heading" className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="forecast-heading"
            className="text-xl font-semibold text-slate-900 sm:text-2xl"
          >
            {selectedCity.name}
            {selectedCity.admin1 ? `, ${selectedCity.admin1}` : ""}
          </h2>
          <p className="text-sm text-slate-500">
            {selectedCity.country} · {data.timezone}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching ? <Spinner size="sm" label="Refreshing forecast" /> : null}
          <div className="text-right">
            <div className="text-3xl font-semibold text-slate-900">
              <span aria-hidden className="mr-1">
                {getWeatherEmoji(data.current.weatherCode)}
              </span>
              {Math.round(data.current.temperature)}°C
            </div>
            <div className="text-xs text-slate-500">
              {getWeatherLabel(data.current.weatherCode)} · wind{" "}
              {Math.round(data.current.windSpeed)} km/h
            </div>
          </div>
        </div>
      </header>

      <ul
        role="list"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7"
      >
        {data.daily.map((day) => (
          <li
            key={day.date}
            className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm"
          >
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {formatDate(day.date)}
            </div>
            <div className="my-1 text-2xl" aria-hidden>
              {getWeatherEmoji(day.weatherCode)}
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {Math.round(day.temperatureMax)}° / {Math.round(day.temperatureMin)}°
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {day.precipitationSum > 0
                ? `${day.precipitationSum.toFixed(1)} mm`
                : day.snowfallSum > 0
                  ? `${day.snowfallSum.toFixed(1)} cm snow`
                  : "Dry"}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
