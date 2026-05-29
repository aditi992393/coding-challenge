import { useCityStore } from "@/store/useCityStore";
import { useWeatherForecast } from "@/features/weather/useWeatherForecast";
import { useActivityRanking } from "@/features/activities/useActivityRanking";
import { Skeleton } from "@/components/common/Skeleton";
import type { ActivityKind } from "@/types";
import styles from "./ActivityRecommendations.module.css";

const ACTIVITY_ICONS: Record<ActivityKind, string> = {
  skiing: "⛷️",
  surfing: "🏄",
  outdoor_sightseeing: "🏞️",
  indoor_sightseeing: "🏛️",
};

function scoreClass(score: number): string {
  if (score >= 70) return styles.progressExcellent;
  if (score >= 40) return styles.progressOk;
  return styles.progressPoor;
}

function scoreLabel(score: number): string {
  if (score >= 70) return "Excellent";
  if (score >= 40) return "Possible";
  return "Not recommended";
}

export function ActivityRecommendations() {
  const selectedCity = useCityStore((s) => s.selectedCity);
  const { forecast, loading, error } = useWeatherForecast(selectedCity);
  const ranked = useActivityRanking(forecast);

  if (!selectedCity || error) return null;

  if (loading && !forecast) {
    return (
      <section className={styles.section}>
        <Skeleton className={styles.skeletonHeader} />
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className={styles.skeletonCard} />
          ))}
        </div>
      </section>
    );
  }

  if (ranked.length === 0) return null;

  return (
    <section aria-labelledby="activities-heading" className={styles.section}>
      <h2 id="activities-heading" className={styles.title}>
        Activity recommendations
      </h2>
      <ol role="list" className={styles.grid}>
        {ranked.map((activity, idx) => (
          <li key={activity.kind} className={styles.card}>
            <div className={styles.iconWrap} aria-hidden>
              {ACTIVITY_ICONS[activity.kind]}
            </div>
            <div className={styles.body}>
              <div className={styles.rowTop}>
                <p className={styles.name}>
                  <span className={styles.rank}>#{idx + 1}</span>
                  {activity.label}
                </p>
                <span
                  className={styles.score}
                  aria-label={`Score ${activity.score} out of 100`}
                >
                  {activity.score}/100
                </span>
              </div>
              <p className={styles.reason}>{activity.reason}</p>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={activity.score}
                aria-label={`${activity.label} suitability`}
                className={styles.progressTrack}
              >
                <div
                  className={`${styles.progressFill} ${scoreClass(activity.score)}`}
                  style={{ width: `${activity.score}%` }}
                />
              </div>
              <p className={styles.qualityLabel}>{scoreLabel(activity.score)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
