
import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { format, isWithinInterval, addDays } from 'date-fns';

export const useRunDebug = () => {
  const { runs } = useApp();

  useEffect(() => {
    console.group('🏃 Run Debug Information');
    console.log(`Total runs in context: ${runs.length}`);
    
    const today = new Date();
    const endDate = addDays(today, 6);
    
    const plannedRuns = runs.filter(run => run.isPlanned);
    const importedRuns = runs.filter(run => run.isImported);
    const runsInRange = runs.filter(run => {
      const runDate = new Date(run.date);
      return isWithinInterval(runDate, { start: today, end: endDate });
    });
    
    console.log(`Planned runs: ${plannedRuns.length}`);
    console.log(`Imported runs: ${importedRuns.length}`);
    console.log(`Runs in next 7 days: ${runsInRange.length}`);
    
    if (runs.length > 0) {
      console.log('All runs:');
      runs.forEach((run, index) => {
        console.log(`  ${index + 1}. ${run.title} on ${format(new Date(run.date), 'yyyy-MM-dd')} - Planned: ${run.isPlanned}, Imported: ${run.isImported}`);
      });
    } else {
      console.log('No runs found in context');
    }
    
    console.groupEnd();
  }, [runs]);

  return {
    totalRuns: runs.length,
    plannedRuns: runs.filter(run => run.isPlanned).length,
    importedRuns: runs.filter(run => run.isImported).length,
    runsThisWeek: runs.filter(run => {
      const runDate = new Date(run.date);
      const today = new Date();
      const endDate = addDays(today, 6);
      return isWithinInterval(runDate, { start: today, end: endDate });
    }).length
  };
};
