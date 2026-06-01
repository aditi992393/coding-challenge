/**
 * Pure UI helpers — used by ActivityRecommendations to colour progress bars
 * and label each card's quality band.
 */

export type ScoreLevel = 'excellent' | 'ok' | 'poor';

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 70) return 'excellent';
  if (score >= 40) return 'ok';
  return 'poor';
}

export function getScoreLabel(score: number): string {
  const level = getScoreLevel(score);
  if (level === 'excellent') return 'Excellent';
  if (level === 'ok') return 'Possible';
  return 'Not recommended';
}
