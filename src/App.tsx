import { useState } from 'react';
import { CitySearch } from '@/components/CitySearch/CitySearch';
import { WeatherForecast } from '@/components/WeatherForecast/WeatherForecast';
import { ActivityRecommendations } from '@/components/ActivityRecommendations/ActivityRecommendations';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import type { City } from '@/types';
import styles from './App.module.css';

/**
 * Composition root.
 *
 * Owns the single piece of shared UI state — the currently selected city —
 * and passes it down to the three feature sections as props.
 */
export default function App() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Travel planner</p>
        <h1 className={styles.title}>Plan your next trip around the weather</h1>
        <p className={styles.intro}>
          Search for any city to see a 7-day forecast and ranked activity suggestions powered by
          Open-Meteo.
        </p>
      </header>

      <main className={styles.main}>
        <ErrorBoundary>
          <CitySearch selectedCity={selectedCity} onSelectCity={setSelectedCity} />
        </ErrorBoundary>

        <ErrorBoundary>
          <WeatherForecast city={selectedCity} />
        </ErrorBoundary>

        <ErrorBoundary>
          <ActivityRecommendations city={selectedCity} />
        </ErrorBoundary>
      </main>

      <footer className={styles.footer}>
        Weather data from{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Open-Meteo
        </a>
        .
      </footer>
    </div>
  );
}
