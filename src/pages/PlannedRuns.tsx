
import React from "react";
import MainLayout from "../components/Layout/MainLayout";
import { useApp } from "@/context/AppContext";
import { isSameDay } from "date-fns";
import { RunImportActions } from "@/components/RunManagement/RunImportActions";
import { PlannedRunsHeader } from "@/components/PlannedRuns/PlannedRunsHeader";
import { PlannedRunsCalendar } from "@/components/PlannedRuns/PlannedRunsCalendar";
import { PlannedRunsSchedule } from "@/components/PlannedRuns/PlannedRunsSchedule";
import { PlannedRunsMeals } from "@/components/PlannedRuns/PlannedRunsMeals";

const PlannedRuns: React.FC = () => {
  const { 
    runs, 
    meals, 
    selectedDate, 
    setSelectedDate, 
    importRunsFromIcal, 
    isLoadingImportedRuns 
  } = useApp();

  // Filter for planned runs only
  const plannedRuns = runs.filter((run) => run.isPlanned);

  // Get meals for the selected date
  const selectedDateMeals = meals.filter((meal) => 
    isSameDay(new Date(meal.date), selectedDate)
  );

  // Count imported vs manual runs
  const importedRunsCount = plannedRuns.filter(run => run.isImported).length;
  const manualRunsCount = plannedRuns.filter(run => !run.isImported).length;

  return (
    <MainLayout>
      <PlannedRunsHeader 
        importedRunsCount={importedRunsCount}
        manualRunsCount={manualRunsCount}
        totalRuns={plannedRuns.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <PlannedRunsCalendar 
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            plannedRuns={plannedRuns}
          />

          <RunImportActions 
            onImportRuns={importRunsFromIcal}
            isLoading={isLoadingImportedRuns}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <PlannedRunsSchedule 
            selectedDate={selectedDate}
            plannedRuns={plannedRuns}
          />

          <PlannedRunsMeals 
            selectedDate={selectedDate}
            selectedDateMeals={selectedDateMeals}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default PlannedRuns;
