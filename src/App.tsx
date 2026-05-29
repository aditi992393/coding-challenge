import { CitySearch } from "@/components/CitySearch/CitySearch";
import { WeatherForecast } from "@/components/WeatherForecast/WeatherForecast";
import { ActivityRecommendations } from "@/components/ActivityRecommendations/ActivityRecommendations";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

export default function App() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-8 sm:mb-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Travel planner
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">
          Plan your next trip around the weather
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Search for any city to see a 7-day forecast and ranked activity
          suggestions powered by Open-Meteo.
        </p>
      </header>

      <main className="space-y-8">
        <ErrorBoundary>
          <CitySearch />
        </ErrorBoundary>

        <ErrorBoundary>
          <WeatherForecast />
        </ErrorBoundary>

        <ErrorBoundary>
          <ActivityRecommendations />
        </ErrorBoundary>
      </main>

      <footer className="mt-12 border-t border-slate-200 pt-4 text-xs text-slate-400">
        Weather data from{" "}
        <a
          className="underline hover:text-slate-600"
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
        >
          Open-Meteo
        </a>
        .
      </footer>
    </div>
  );
}
