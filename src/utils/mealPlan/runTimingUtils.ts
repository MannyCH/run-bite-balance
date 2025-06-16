
import { getHours } from 'date-fns';

/**
 * Checks if a run is scheduled during lunch time (11:00-14:00)
 */
export function isLunchTimeRun(run: any): boolean {
  const runDate = new Date(run.date);
  const hour = getHours(runDate);
  return hour >= 11 && hour <= 14;
}

/**
 * Gets runs for a specific date
 */
export function getRunsForDate(runs: any[], date: Date): any[] {
  return runs.filter(run => {
    const runDate = new Date(run.date);
    return runDate.toDateString() === date.toDateString();
  });
}

/**
 * Checks if a day has lunch-time runs
 */
export function hasLunchTimeRuns(runs: any[]): boolean {
  return runs.some(run => isLunchTimeRun(run));
}

/**
 * Checks if runs require post-run snack (5km+ and not lunch-time)
 */
export function needsPostRunSnack(runs: any[]): boolean {
  return runs.some(run => run.distance >= 5) && !hasLunchTimeRuns(runs);
}
