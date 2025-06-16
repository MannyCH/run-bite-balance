
import { isSameDay } from 'date-fns';

/**
 * Gets runs for a specific date
 */
export function getRunsForDate(runs: any[], date: Date): any[] {
  return runs.filter(run => {
    const runDate = new Date(run.date);
    return isSameDay(runDate, date);
  });
}

/**
 * Checks if a day has any runs
 */
export function hasRunsOnDate(runs: any[], date: Date): boolean {
  return getRunsForDate(runs, date).length > 0;
}
