
import React from "react";
import MainLayout from "../components/Layout/MainLayout";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { RunList } from "@/components/RunManagement/RunList";
import { RunImportActions } from "@/components/RunManagement/RunImportActions";

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
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Planned Runs</h1>
            <p className="text-gray-600">
              View your upcoming runs and how they align with your meal schedule
            </p>
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              <span>📅 {importedRunsCount} imported runs</span>
              <span>✏️ {manualRunsCount} manual runs</span>
              <span>🍽️ Total: {plannedRuns.length} planned runs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Select a date to view planned runs</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border pointer-events-auto"
                modifiers={{
                  hasRuns: (date) => plannedRuns.some(run => 
                    isSameDay(new Date(run.date), date)
                  )
                }}
                modifiersStyles={{
                  hasRuns: { 
                    backgroundColor: '#dbeafe', 
                    color: '#1e40af',
                    fontWeight: 'bold'
                  }
                }}
              />
            </CardContent>
          </Card>

          <RunImportActions 
            onImportRuns={importRunsFromIcal}
            isLoading={isLoadingImportedRuns}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Schedule for {format(selectedDate, "MMMM d, yyyy")}
              </CardTitle>
              <CardDescription>
                {plannedRuns.filter(run => 
                  isSameDay(new Date(run.date), selectedDate)
                ).length} runs planned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RunList runs={plannedRuns} selectedDate={selectedDate} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Meals for this day
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateMeals.length === 0 ? (
                <p className="text-gray-500">No meals planned for this date</p>
              ) : (
                <div className="space-y-4">
                  {selectedDateMeals.map((meal) => (
                    <div key={meal.id} className="flex items-center bg-white p-3 rounded-lg shadow">
                      <div className="flex-shrink-0 mr-3">
                        {meal.imgUrl ? (
                          <img 
                            src={meal.imgUrl} 
                            alt={meal.title} 
                            className="h-12 w-12 rounded-md object-cover" 
                          />
                        ) : (
                          <div className="h-12 w-12 bg-teal-100 rounded-md flex items-center justify-center">
                            <span className="text-teal-600 font-bold">M</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">{meal.title}</p>
                          <span className="text-sm text-gray-500">
                            {format(new Date(meal.date), "h:mm a")}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {meal.calories} cal · P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fat}g
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default PlannedRuns;
