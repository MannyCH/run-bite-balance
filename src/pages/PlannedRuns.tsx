
import React from "react";
import MainLayout from "../components/Layout/MainLayout";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay } from "date-fns";
import { MapPin, Route, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAutoLoadRuns } from "@/hooks/useAutoLoadRuns";

const PlannedRuns: React.FC = () => {
  const { runs, meals, selectedDate, setSelectedDate, importRunsFromIcal, isLoadingImportedRuns } = useApp();
  const { toast } = useToast();

  // Auto-load runs from user profile
  useAutoLoadRuns();

  // Filter for planned runs only
  const plannedRuns = runs.filter((run) => run.isPlanned);

  // Get runs for the selected date
  const selectedDateRuns = plannedRuns.filter((run) => 
    isSameDay(new Date(run.date), selectedDate)
  );

  // Get meals for the selected date
  const selectedDateMeals = meals.filter((meal) => 
    isSameDay(new Date(meal.date), selectedDate)
  );

  // Format duration from seconds to minutes and seconds
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleRefreshImportedRuns = async () => {
    try {
      await importRunsFromIcal("https://runningcoach.me/calendar/ical/e735d0722a98c308a459f60216f9cd5adc29d107/basic.ics?morning_at=09:00&evening_at=20:00");
      toast({
        title: "Runs Successfully Imported",
        description: "Your running calendar has been updated with the latest imported runs.",
      });
    } catch (error) {
      toast({
        title: "Error Importing Runs",
        description: "There was a problem importing your runs. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Planned Runs</h1>
            <p className="text-gray-600">
              View your upcoming runs and how they align with your meal schedule
            </p>
          </div>
          <Button 
            onClick={handleRefreshImportedRuns} 
            className="mt-4 md:mt-0 flex items-center gap-2"
            disabled={isLoadingImportedRuns}
          >
            <Route className="h-4 w-4" />
            {isLoadingImportedRuns ? "Importing..." : "Refresh Imported Runs"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
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
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Schedule for {format(selectedDate, "MMMM d, yyyy")}
              </CardTitle>
              <CardDescription>
                {selectedDateRuns.length} runs planned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateRuns.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No runs planned for this date</p>
                  <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
                    Plan a Run
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedDateRuns.map((run) => (
                    <div
                      key={run.id}
                      className={`flex flex-col md:flex-row bg-white rounded-lg shadow overflow-hidden ${run.isImported ? 'border-l-4 border-blue-500' : ''}`}
                    >
                      {run.imgUrl && (
                        <div className="md:w-1/3">
                          <img
                            src={run.imgUrl}
                            alt={run.title}
                            className="h-48 w-full md:h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4 flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                          <div className="flex items-center">
                            {run.isImported ? (
                              <Route className="mr-2 h-5 w-5 text-blue-500" />
                            ) : (
                              <MapPin className="mr-2 h-5 w-5 text-blue-500" />
                            )}
                            <h3 className="text-lg font-semibold">
                              {run.title} 
                              {run.isImported && <span className="text-xs text-blue-500 ml-2 bg-blue-100 px-2 py-1 rounded-full">Imported</span>}
                            </h3>
                          </div>
                          <span className="text-gray-500">
                            {format(new Date(run.date), "h:mm a")}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">
                          {run.route && <span>Route: {run.route}</span>}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                            {run.distance} km
                          </span>
                          <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded">
                            {Math.floor(run.duration / 60)} min
                          </span>
                          <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded">
                            {run.pace}/km pace
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8">
                <h3 className="font-semibold text-lg mb-4">Meals for this day</h3>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default PlannedRuns;
