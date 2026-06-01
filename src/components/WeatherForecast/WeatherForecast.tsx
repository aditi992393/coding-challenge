import { useWeatherForecast } from '@/hooks/useWeatherForecast';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/common/Skeleton';
import { getWeatherEmoji, getWeatherLabel } from '@/utils/weatherCodes';
import { formatDate } from '@/components/helpers';
import type { WeatherForecastProps } from '@/components/types';
import styles from './WeatherForecast.module.css';

export function WeatherForecast({ city }: WeatherForecastProps) {
  const { forecast, loading, error, refetch } = useWeatherForecast(city);

  if (!city) {
    return (
      <EmptyState
        icon={<span aria-hidden>🧭</span>}
        title="No city selected yet"
        description="Search for a destination above to see its 7-day forecast and activity recommendations."
      />
    );
  }

  if (loading && !forecast) {
    return (
      <section aria-busy="true" aria-live="polite" className={styles.section}>
        <Skeleton className={styles.skeletonHeader} />
        <div className={styles.dailyGrid}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className={styles.skeletonCard} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div role="alert" className={styles.errorBox}>
        <p className={styles.errorTitle}>Couldn't load the forecast</p>
        <p className={styles.errorMessage}>{error.message}</p>
        <button type="button" onClick={() => refetch()} className={styles.errorButton}>
          Retry
        </button>
      </div>
    );
  }

  if (!forecast) return null;

  return (
    <section aria-labelledby="forecast-heading" className={styles.section}>
      <header className={styles.header}>
        <div>
          <h2 id="forecast-heading" className={styles.title}>
            {city.name}
            {city.admin1 ? `, ${city.admin1}` : ''}
          </h2>
          <p className={styles.subtitle}>
            {city.country} · {forecast.timezone}
          </p>
        </div>
        <div className={styles.currentWrap}>
          {loading ? <Spinner size="sm" label="Refreshing forecast" /> : null}
          <div className={styles.currentTemp}>
            <div className={styles.currentValue}>
              <span aria-hidden className={styles.currentValueIcon}>
                {getWeatherEmoji(forecast.current.weatherCode)}
              </span>
              {Math.round(forecast.current.temperature)}°C
            </div>
            <div className={styles.currentLabel}>
              {getWeatherLabel(forecast.current.weatherCode)} · wind{' '}
              {Math.round(forecast.current.windSpeed)} km/h
            </div>
          </div>
        </div>
      </header>

      <ul role="list" className={styles.dailyGrid}>
        {forecast.daily.map((day) => (
          <li key={day.date} className={styles.day}>
            <div className={styles.dayLabel}>{formatDate(day.date)}</div>
            <div className={styles.dayIcon} aria-hidden>
              {getWeatherEmoji(day.weatherCode)}
            </div>
            <div className={styles.dayTemp}>
              {Math.round(day.temperatureMax)}° / {Math.round(day.temperatureMin)}°
            </div>
            <div className={styles.dayMeta}>
              {day.precipitationSum > 0
                ? `${day.precipitationSum.toFixed(1)} mm`
                : day.snowfallSum > 0
                  ? `${day.snowfallSum.toFixed(1)} cm snow`
                  : 'Dry'}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
